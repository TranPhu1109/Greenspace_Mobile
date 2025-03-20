import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { WalletProvider } from './src/context/WalletContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

const AppContent = () => {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </View>
    </SafeAreaProvider>
  );
};

export default App; 