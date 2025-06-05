import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';
import RegisterScreen from '../screens/RegisterScreen';
import PrivacyPolicyScreen from '../screens/Policy/PrivacyPolicyScreen';
import TermsAndConditionsScreen from '../screens/Policy/TermsAndConditionsScreen';
import WarrantyPolicyScreen from '../screens/Policy/WarrantyPolicy';
import ReturnPolicyScreen from '../screens/Policy/ReturnPolicyScreen';
import PolicyDetailScreen from '../screens/Policy/PolicyDetailScreen';
const Stack = createNativeStackNavigator();

const RootStack = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main application screens - always accessible */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="WarrantyPolicy" component={WarrantyPolicyScreen} />
      <Stack.Screen name="ReturnPolicy" component={ReturnPolicyScreen} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
      {/* Authentication screens - accessible even when logged in for the cart -> login flow */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default RootStack;