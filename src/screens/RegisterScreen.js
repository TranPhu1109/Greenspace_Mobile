import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { api } from '../api/api'; // Assuming 'api' is your configured axios instance
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Might be useful for error icons
import logo from '../assets/logo/logo.png';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {getApp}  from '@react-native-firebase/app';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const navigation = useNavigation();
  const { login } = useAuth(); // Get login function from AuthContext

  // State for error messages
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Helper function to fetch wallet info (copy from LoginScreen)
  const fetchWalletInfo = async (userId, token) => {
    try {
      const response = await api.get(`/wallets/user${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response; // Assuming response.data contains the wallet info
    } catch (error) {
      console.error('Error fetching wallet during auto-login:', error);
      return null;
    }
  };

  const handleRegister = async () => {
    console.log('Registering...');
    // Reset previous errors
    setFullNameError('');
    setEmailError('');
    setPhoneNumberError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let isValid = true;

    // Basic Validation
    if (!fullName.trim()) {
      setFullNameError('Vui lòng nhập họ và tên.');
      isValid = false;
    }
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email.');
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
      setEmailError('Email không hợp lệ.');
      isValid = false;
    }
    if (!phoneNumber.trim()) {
      setPhoneNumberError('Vui lòng nhập số điện thoại.');
      isValid = false;
    } else if (!/^\d{10,11}$/.test(phoneNumber)) { // Basic phone number format check
        setPhoneNumberError('Số điện thoại không hợp lệ (10 hoặc 11 chữ số).');
        isValid = false;
    }
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      isValid = false;
    } else if (password.length < 6) { // Example: minimum password length
        setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
        isValid = false;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      isValid = false;
    }

    if (!isValid) {
      return; // Stop if client-side validation fails
    }

    try {
      // 1. Register user via your backend API
      const registrationResponse = await api.post('/users/register', {
        name: fullName,
        email: email,
        password: password,
        phone: phoneNumber,
        address: "", // Default empty address
        avatarUrl: "", // Default empty avatarUrl
      });

      console.log('Registration successful:', registrationResponse);

      // 2. Sign in with Firebase using the registered credentials
      const app = getApp();
      const userCredential = await auth().signInWithEmailAndPassword(email, password);

      // 3. Get Firebase ID token and FCM token
      const idToken = await userCredential.user.getIdToken();
      const fcmToken = await messaging(app).getToken();

      console.log('Firebase ID Token:', idToken);
      console.log('FCM Token:', fcmToken);

      // 4. Authenticate with your backend using tokens
      const authResponse = await api.post('/auth', {
        token: idToken,
        fcmToken: fcmToken,
        role: 'string' // Assuming role is required by your /auth endpoint
      });

      console.log("Backend Auth Response:", authResponse);

      // 5. Fetch Wallet Info
      const walletData = await fetchWalletInfo(authResponse.user.id, authResponse.token);

      // 6. Prepare user data for AuthContext
      const userData = {
        token: authResponse.token, // Your backend token
        fcmToken: fcmToken,
        id: authResponse.user.id,
        email: authResponse.user.email,
        name: authResponse.user.name,
        roleName: authResponse.user.roleName,
        phone: authResponse.user.phone,
        address: authResponse.user.address,
        avatarUrl: authResponse.user.avatarUrl,
        backendToken: authResponse.token,
        wallet: walletData,
      };

      // 7. Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // 8. Update AuthContext state
      login(userData);

      // 9. Navigate to the main part of the app
      Alert.alert('Thành công', 'Đăng ký và đăng nhập thành công!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs') }, // Navigate to main tabs after auto-login
      ]);

    } catch (error) {
      console.error('Registration/Auto-Login Error:', error.response || error.message);
      // Handle specific API errors (e.g., duplicate email/phone) from /users/register or /auth
      if (error.response && error.response) {
        const errorData = error.response;

        if(errorData.error === "Error: RegisterUserCommand_email is duplicate!"){
          setEmailError("Email này đã tồn tại, vui lòng sử dụng email khác")
        }
        if(errorData.error === "Error: RegisterUserCommand_phone is duplicate!"){
          setPhoneNumberError("Số điện thoại đã được sử dụng, vui lòng sử dụng số điện thoại khác")
        }
         // Add handling for errors from the /auth endpoint if needed
         // e.g., if /auth returns errors about tokens
        if (errorData.message) {
           setGeneralError(errorData.message); // Display a general error message from API if available
        }

      } else if (error.code) { // Handle Firebase auth errors during auto-login
         if (error.code === 'auth/network-request-failed') {
           setGeneralError('Không thể kết nối để đăng nhập. Vui lòng kiểm tra kết nối mạng.');
         } else if (error.code === 'auth/invalid-credential') { // Should not happen with just registered user
            setGeneralError('Thông tin đăng nhập không hợp lệ sau đăng ký.');
         } else {
            setGeneralError(`Lỗi Firebase (${error.code}). Vui lòng thử lại.`);
         }
      }
      else {
        setGeneralError('Đăng ký hoặc đăng nhập tự động thất bại. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image 
        source={require('../assets/logo/logo.png')} // Adjust path as needed
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Đăng kí</Text>

      <TextInput
        style={[styles.input, fullNameError && styles.inputError]} // Apply error style
        placeholder="Họ và tên"
        placeholderTextColor="#999" // So it's visible with green theme
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

      <TextInput
        style={[styles.input, emailError && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={email => setEmail(email)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TextInput
        style={[styles.input, phoneNumberError && styles.inputError]}
        placeholder="Số điện thoại"
        placeholderTextColor="#999"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}

      <TextInput
        style={[styles.input, passwordError && styles.inputError]}
        placeholder="Mật khẩu"
        placeholderTextColor="#999"
        value={password}
        onChangeText={password => setPassword(password)}
        secureTextEntry
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TextInput
        style={[styles.input, confirmPasswordError && styles.inputError]}
        placeholder="Xác nhận mật khẩu"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

      {/* General Error Message */}
      {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Đăng kí</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.signUpText}>
          Bạn đã có tài khoản?
          <Text
            style={styles.signUpLink}
            onPress={() => navigation.goBack()}>
            {' '}
            Đăng nhập ngay
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
    paddingTop: 60, // Add padding at the top for the logo
  },
  logo: {
    width: '80%', // Adjust size as needed
    height: 100, // Adjust size as needed
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333', // Ensure text color is visible
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  registerButton: {
    backgroundColor: '#4CAF50', // Green color
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonText: {
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
    color: '#4CAF50', // Green color
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 4,
    padding: 10,
    marginHorizontal: 20,
  },
  googleIconContainer: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 2,
    marginRight: 10,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RegisterScreen;
