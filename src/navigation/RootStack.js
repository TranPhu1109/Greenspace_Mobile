import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

const RootStack = () => {
  const { isAuthenticated } = useAuth();

  return (
    // <Stack.Navigator screenOptions={{ headerShown: false }}>
    //   {isAuthenticated ? (
    //     // Protected routes - only accessible when logged in
    //     <>
    //       <Stack.Screen name="MainTabs" component={TabNavigator} />
    //       <Stack.Screen name="Settings" component={SettingsScreen} />
    //     </>
    //   ) : (
    //     // Public routes - only accessible when not logged in
    //     <>
    //       <Stack.Screen name="Login" component={LoginScreen} />
    //       <Stack.Screen name="SignUp" component={RegisterScreen} />
    //     </>
    //   )}
    // </Stack.Navigator>

    <Stack.Navigator screenOptions={{ headerShown: false }}>
     
       
        
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        
     
        
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={RegisterScreen} />
        
     
    </Stack.Navigator>
  );
};

export default RootStack;