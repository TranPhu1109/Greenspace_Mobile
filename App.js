import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Linking, Alert } from 'react-native';
import { createRef } from 'react';
import { CommonActions } from '@react-navigation/native';

// Navigation
import RootStack from './src/navigation/RootStack';

// Context Providers
import { WalletProvider, useWallet } from './src/context/WalletContext';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { useLoading } from './src/context/LoadingContext';
import Loading from './src/components/Loading';
import InAppBrowser from 'react-native-inappbrowser-reborn';

// Define your custom URL scheme - MUST match AndroidManifest.xml and Info.plist
const SCHEME = 'greenspaceapp://';

const AppContent = () => {
  const { isLoading } = useLoading();
  const walletContext = useWallet();

  const navigationRef = createRef();

  useEffect(() => {
    // Listener for initial URL when app opens from killed state
    const handleInitialUrl = async () => {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
            handleDeepLink(initialUrl);
        }
    };
    handleInitialUrl();

    // Listener for URL when app is already running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      linkingSubscription.remove(); // Clean up listener
    };
  }, []);

  const handleDeepLink = async (url) => {
    if (!url || !walletContext) return;
  
    console.log('DEBUG: handleDeepLink called with URL:', url);
    console.log('DEBUG: walletContext available:', !!walletContext);

    console.log('🔗 Received deep link URL:', url);

    // --- Manual URL Parsing --- 
    const schemePrefix = 'greenspaceapp:';
    const host = 'vnpay-payment-result';
    const expectedPrefix = `${schemePrefix}//${host}`;

    if (!url.startsWith(expectedPrefix)) {
      console.warn('URL does not match expected VNPAY deep link format:', url);
      return;
    }

    const queryString = url.substring(url.indexOf('?') + 1);
    const params = {};
    queryString.split('&').forEach(part => {
        const [key, value] = part.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });

    const txnStatus = params['vnp_TransactionStatus'];
    const responseCode = params['vnp_ResponseCode'];
    const userId = params['userId']; // Assuming userId is still needed/passed
    const txnRef = params['vnp_TxnRef'];
    // --- End Manual URL Parsing ---

    console.log('🔗 Deep link parsed parameters:', {
      scheme: schemePrefix,
      host: host,
      txnStatus,
      responseCode,
      userId, 
      txnRef
    });

    // ✅ Check if we have the necessary parameters from VNPAY
    if (txnStatus && responseCode && userId) { // Keep userId check if relevant
      // Giao dịch thành công là TransactionStatus = 00 và ResponseCode = 00
      const isSuccess = txnStatus === '00' && responseCode === '00';

      console.log('DEBUG: Parsed VNPay status:', { txnStatus, responseCode, isSuccess });

      try {
        if (await InAppBrowser.isAvailable()) {
          console.log('Closing InAppBrowser...');
          await InAppBrowser.close();
        }
  
        // Gọi xử lý backend
        console.log('Calling handleVnpayResponse...');
        const resultMessage = await walletContext.handleVnpayResponse(url);
  
        Alert.alert(
          isSuccess ? 'Thành công' : 'Thất bại',
          resultMessage || (isSuccess ? 'Giao dịch đã được xử lý!' : 'Giao dịch thất bại!')
        );
  
        // (Tuỳ chọn) Điều hướng người dùng đến màn hình cụ thể
        // navigation.navigate('Wallet');
  
        // Navigate to WalletScreen after successful top-up
        if (isSuccess && navigationRef.current) {
          console.log('Navigating to WalletScreen...');
          // Use CommonActions.reset to ensure a clean navigation stack
          navigationRef.current.dispatch(
             CommonActions.reset({
               index: 0,
               routes: [{ name: 'Account', params: { screen: 'Profile', params: { screen: 'Wallet' } } }],
             })
           );
        }
  
      } catch (err) {
        console.error('❌ Xử lý VNPay thất bại:', err);
        if (await InAppBrowser.isAvailable()) {
          await InAppBrowser.close();
        }
        Alert.alert('Lỗi xử lý VNPay', err.message || 'Không thể xử lý phản hồi từ VNPay.');
      }
    } else {
      console.warn('URL không phải deep link hợp lệ từ VNPay:', url);
    }
  };
  

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack />
      {isLoading && <Loading />}
    </NavigationContainer>
  );
};

export default function AppWrapper() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LoadingProvider>
            <CartProvider>
                <WalletProvider>
                    <AppContent />
                </WalletProvider>
            </CartProvider>
        </LoadingProvider>  
      </AuthProvider>
    </SafeAreaProvider>
  );
} 