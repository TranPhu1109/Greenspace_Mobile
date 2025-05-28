import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {getApp, firebase}  from '@react-native-firebase/app';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLoading } from '../context/LoadingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

// Assuming logo.png is in the assets folder. Adjust the path if needed.
import logo from '../assets/logo/logo.png';

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
      const response = await api.get(`/wallets/user${userId}`, {
        'Authorization': `Bearer ${token}`
      });
      
      return response;
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
      
      const idToken = await userCredential.user.getIdToken();
      console.log('firebase Token:', idToken);
      
      const fcmToken = await messaging(app).getToken();
      console.log('FCM Token:', fcmToken);

      const response = await api.post('/auth', {
        token: idToken,
        fcmToken: fcmToken,
        role: 'string'
      });

      console.log("response auth", response);

      // Create user object with all necessary data
      const userData = {
        token: response.token,
        fcmToken: fcmToken,
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        roleName: response.user.roleName,
        phone: response.user.phone,
        address: response.user.address,
        avatarUrl: response.user.avatarUrl,
        backendToken: response.token,
        wallet: await fetchWalletInfo(response.user.id, response.token)
      };

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Update auth context
      login(userData);

      // Explicitly handle navigation here instead of relying solely on the useEffect
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

      <Image source={logo} style={styles.logo} resizeMode="contain" />

      
      <Text style={styles.welcomeText}>Chào mừng bạn quay trở lại với GreenSpace</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Email"
          placeholderTextColor="rgba(0, 0, 0, 0.3)"
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
          placeholderTextColor="rgba(0, 0, 0, 0.3)"
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
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.signUpText}>
          Bạn chưa có tài khoản?
          <Text
            style={styles.signUpLink}
            onPress={() => navigation.navigate('SignUp')}>
            {' '}
            Đăng ký ngay
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
    backgroundColor: '#F5F9F5',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2E5A27',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#2E5A27",
    borderWidth: 1,
    borderColor: '#A8D5A3',
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
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpText: {
    textAlign: 'center',
    color: '#2E5A27',
    marginBottom: 20,
  },
  signUpLink: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  welcomeText: {
    textAlign: 'center',
    color: '#2E5A27',
    marginBottom: 50,
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: 'center',
  },
});

export default LoginScreen;
