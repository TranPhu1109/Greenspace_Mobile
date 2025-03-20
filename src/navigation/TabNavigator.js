import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import ShopStack from './ShopStack';
import DesignStack from './DesignStack';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountStack from './AccountStack';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home-outline' : 'home-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'shopping-outline' : 'shopping-outline';
          } else if (route.name === 'Design') {
            iconName = focused ? 'pencil-ruler' : 'pencil-ruler';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'bell-outline' : 'bell-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'account-outline' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopStack}
        options={{
          title: 'Shop',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Design"
        component={DesignStack}
        options={{
          title: 'Design',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{
          title: 'Account',
          headerShown: false,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Reset the Account stack to its initial state when pressing the tab
            navigation.navigate('Account', {
              screen: 'Profile',
              params: {
                screen: 'UserInfo'
              }
            });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;