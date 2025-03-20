import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Dimensions, TouchableOpacity, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserInfoScreen from '../screens/UserInfoScreen';
import MaterialOrderScreen from '../screens/MaterialOrderScreen';
import ServiceOrderScreen from '../screens/ServiceOrderScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ShippingAddressScreen from '../screens/ShippingAddressScreen';
import ServiceOrderDetailScreen from '../screens/ServiceOrderDetailScreen';
import MaterialOrderDetailScreen from '../screens/MaterialOrderDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import TopUpScreen from '../screens/TopUpScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

const ProfileStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="UserInfo"
  >
    <Stack.Screen 
      name="UserInfo" 
      component={UserInfoScreen}
      options={{
        unmountOnBlur: true // This will unmount the screen when navigating away
      }}
    />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ShippingAddress" component={ShippingAddressScreen} />
    <Stack.Screen name="Wallet" component={WalletScreen} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <Stack.Screen name="TopUp" component={TopUpScreen} />
  </Stack.Navigator>
);

const ServiceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ServiceOrders" component={ServiceOrderScreen} />
    <Stack.Screen name="ServiceOrderDetail" component={ServiceOrderDetailScreen} />
  </Stack.Navigator>
);

const MaterialStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MaterialOrders" component={MaterialOrderScreen} />
    <Stack.Screen name="MaterialOrderDetail" component={MaterialOrderDetailScreen} />
  </Stack.Navigator>
);

const AccountStack = ({ navigation }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '600',
          color: '#000',
        }}>
          User name
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={{
            padding: 8,
          }}
        >
          <Icon name="cog" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#007AFF',
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarPressColor: 'transparent',
          lazy: true,
        }}
      >
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
        <Tab.Screen
          name="ServiceOrdersTab"
          component={ServiceStack}
          options={{
            tabBarLabel: 'Services',
          }}
        />
        <Tab.Screen
          name="MaterialOrdersTab"
          component={MaterialStack}

          options={{
            tabBarLabel: 'Materials',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default AccountStack; 