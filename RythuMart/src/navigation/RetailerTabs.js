import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Store, ClipboardList, User, ShoppingCart } from 'lucide-react-native';

// --- Import Screens ---
import RetailerHome from '../screens/RetailerHome';
import RetailerOrders from '../screens/RetailerOrders';
import RetailerProfile from '../screens/RetailerProfile';
import CartScreen from '../screens/CartScreen'; // <--- NEW IMPORT

const Tab = createBottomTabNavigator();

export default function RetailerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 12, 
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 5,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
      }}
    >
      <Tab.Screen 
        name="Market" 
        component={RetailerHome} 
        options={{
          tabBarLabel: 'Market',
          tabBarIcon: ({ color }) => <Store size={24} color={color} />,
        }}
      />
      
      {/* NEW CART TAB */}
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />

      <Tab.Screen 
        name="Orders" 
        component={RetailerOrders} 
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={RetailerProfile} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}