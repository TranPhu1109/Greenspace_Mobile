import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

// Navigation
import RootStack from './src/navigation/RootStack';

// Context Providers
import { WalletProvider } from './src/context/WalletContext';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { useLoading } from './src/context/LoadingContext';
import Loading from './src/components/Loading';

const AppContent = () => {
  const { isLoading } = useLoading();
  
  return (
    <NavigationContainer>
      <RootStack />
      {isLoading && <Loading />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <AuthProvider>
          <CartProvider>
            <WalletProvider>
              <View style={{ flex: 1 }}>
                <AppContent />
              </View>
            </WalletProvider>
          </CartProvider>
        </AuthProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
};

export default App; 