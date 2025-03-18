import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Dimensions, TouchableOpacity, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DesignIdeaLibraryScreen from '../screens/DesignIdeaLibraryScreen';
import RecentProjectsScreen from '../screens/RecentProjectsScreen';
import DesignDetailScreen from '../screens/DesignDetailScreen';
import OrderScreen from '../screens/OrderScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

const DesignLibraryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DesignIdeaLibrary" component={DesignIdeaLibraryScreen} />
    <Stack.Screen name="DesignDetail" component={DesignDetailScreen} />
    <Stack.Screen name="Order" component={OrderScreen} />
  </Stack.Navigator>
);



const DesignStack = ({ navigation }) => {
  return (
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
          name="DesignIdeaLibraryTab"
          component={DesignLibraryStack}
          options={{
            tabBarLabel: 'Design Idea Library',
          }}
        />
        <Tab.Screen
          name="RecentProjects"
          component={RecentProjectsScreen}
          options={{
            tabBarLabel: 'Recent Projects',
          }}
        />
      </Tab.Navigator>
  );
};

export default DesignStack; 