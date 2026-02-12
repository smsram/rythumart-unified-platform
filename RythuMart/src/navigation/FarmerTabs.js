import React from 'react';
import { View, Text, Platform } from 'react-native'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- IMPORT YOUR ACTUAL SCREENS ---
import FarmerHome from '../screens/FarmerHome'; 
import FarmerMarketScreen from '../screens/FarmerMarketScreen'; // <--- UPDATED
import FarmerMyCropsScreen from '../screens/FarmerMyCropsScreen'; // <--- UPDATED
import FarmerProfileScreen from '../screens/FarmerProfileScreen'; // <--- UPDATED

const Tab = createBottomTabNavigator();

export default function FarmerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16A34A', // AgriFlow Green
        tabBarInactiveTintColor: '#94A3B8', // Gray
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 12, 
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 }
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={FarmerHome} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "home-variant" : "home-variant-outline"} 
              color={color} 
              size={26} 
            />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Market" 
        component={FarmerMarketScreen} 
        options={{
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "storefront" : "storefront-outline"} 
              color={color} 
              size={26} 
            />
          ),
        }}
      />

      <Tab.Screen 
        name="MyCrops" 
        component={FarmerMyCropsScreen} 
        options={{
          tabBarLabel: 'My Crops',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "sprout" : "sprout-outline"} 
              color={color} 
              size={26} 
            />
          ),
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={FarmerProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "account-circle" : "account-circle-outline"} 
              color={color} 
              size={26} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}