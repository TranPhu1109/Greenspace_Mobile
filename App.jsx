/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { CartProvider } from './src/context/CartContext';
import TabNavigator from './src/navigation/TabNavigator';
import RootStack from './src/navigation/RootStack';
function App() {
  

  return (
    <NavigationContainer>
      <CartProvider>
      <RootStack />
      </CartProvider>
    
  </NavigationContainer>
  );
}


export default App;
