import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShoppingScreen from '../screens/ShoppingScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckOutScreen from '../screens/CheckOutScreen';

const Stack = createNativeStackNavigator();

const ShopStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ShopMain"
        component={ShoppingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailScreen}
        options={{
          title: 'Chi tiết sản phẩm',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Giỏ hàng',
        }}
      />
      <Stack.Screen
        name="CheckOut"
        component={CheckOutScreen}
        options={{
          title: 'Thanh toán',
        }}
      />
    </Stack.Navigator>
  );
};

export default ShopStack; 