import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {getApp, firebase}  from '@react-native-firebase/app';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLoading } from '../context/LoadingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({navigation, route}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const {login, isAuthenticated} = useAuth();
  const { showLoading, hideLoading } = useLoading();

  // Simplified logic - just check if we need to go back after login
  useEffect(() => {
    if (isAuthenticated) {
      // If there are returnTo params, go back to the previous screen
      if (route.params?.returnTo) {
        navigation.goBack();
      } else {
        // Otherwise go to home
        navigation.navigate('MainTabs');
      }
    }
  }, [isAuthenticated, navigation, route.params]);

  const validateInputs = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    // Email validation
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email sai định dạng');
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 kí tự');
      isValid = false;
    }

    return isValid;
  };

  const fetchWalletInfo = async (userId, token) => {
    try {
      const response = await axios.get(`http://10.0.2.2:8080/api/wallets/user${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        const walletData = response.data;
        console.log('Wallet data fetched:', walletData);
        return walletData;
      } else {
        console.error('Failed to fetch wallet data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    try {
      showLoading();
      
      const app = getApp();
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      console.log('Firebase authentication successful');
      
      const idToken = await userCredential.user.getIdToken();
      console.log('ID Token:', idToken);
      

      const fcmToken = await messaging(app).getToken();
      //console.log('FCM Token:', fcmToken);

      const response = await axios.post('http://10.0.2.2:8080/api/auth', {
        token: idToken,
        fcmToken: fcmToken,
        role: 'string'
      });
      console.log("response", response);

      if (response.status !== 200) {
        throw new Error('Backend authentication failed');
      }
      console.log('Backend authentication successful');
      const backendToken = response.data.token;
      //console.log('Backend Token:', backendToken);

      // Fetch wallet information
      const walletInfo = await fetchWalletInfo(response.data.user.id, backendToken);

      // Create user object with all necessary data
      const userData = {
        token: response.data.token,
        fcmToken: fcmToken,
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name,
        roleName: response.data.user.roleName,
        phone: response.data.user.phone,
        address: response.data.user.address,
        avatarUrl: response.data.user.avatarUrl,
        backendToken: backendToken,
        wallet: walletInfo // Add wallet information
      };

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('User data stored in AsyncStorage');

      // Update auth context
      login(userData);

      // Explicitly handle navigation here instead of relying solely on the useEffect
      console.log('Login successful, redirecting...');
      if (route.params?.returnTo) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs');
      }
      
    } catch (error) {
      if (error.code === 'auth/network-request-failed') {
        setAuthError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Địa chỉ email không hợp lệ');
      } else if (error.code === 'auth/invalid-credential') {
        setAuthError('Email hoặc mật khẩu không chính xác');
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError('Quá nhiều lần thử. Vui lòng thử lại sau');
      } else {
        setAuthError('Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại');
      }
    } finally {
      hideLoading();
    }
  };

  const handleGoogleSignIn = () => {
    // Add Google sign in logic here
  };

  const refreshFCMToken = async () => {
    const app = getApp();
    const newToken = await messaging(app).getToken();
    console.log('New FCM Token:', newToken);
    // Update the token in your backend or auth context
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="chevron-left" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Login</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            setAuthError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
            setAuthError('');
          }}
          secureTextEntry
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.signUpText}>
          Don't have an account?
          <Text
            style={styles.signUpLink}
            onPress={() => navigation.navigate('SignUp')}>
            {' '}
            Sign Up
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  authErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  signUpLink: {
    color: '#6200EE',
    fontWeight: '600',
  },
});

export default LoginScreen;
