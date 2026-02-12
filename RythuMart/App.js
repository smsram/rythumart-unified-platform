import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORT SCREENS ---
import StartScreen from './src/screens/StartScreen';
import LoginScreen from './src/screens/LoginScreen';
import FarmerSignup from './src/screens/FarmerSignup';
import RetailerSignup from './src/screens/RetailerSignup';

// --- IMPORT TAB NAVIGATORS ---
import FarmerTabs from './src/navigation/FarmerTabs';
import RetailerTabs from './src/navigation/RetailerTabs';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('StartScreen');

  // --- CHECK LOGIN STATUS ON APP START ---
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          // Determine where to go based on role
          if (user.role === 'FARMER') {
            setInitialRoute('FarmerHome');
          } else if (user.role === 'RETAILER') {
            setInitialRoute('RetailerHome');
          }
        }
      } catch (e) {
        console.error("Failed to load user token", e);
      } finally {
        setIsLoading(false); // Stop loading regardless of result
      }
    };

    checkLoginStatus();
  }, []);

  // --- SHOW LOADING SCREEN WHILE CHECKING ---
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <Stack.Navigator 
        initialRouteName={initialRoute} // <--- Dynamic Start Screen
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#F8FAFC' } }}
      >
        {/* 1. Onboarding Screens */}
        <Stack.Screen name="StartScreen" component={StartScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="FarmerSignup" component={FarmerSignup} />
        <Stack.Screen name="RetailerSignup" component={RetailerSignup} />
        
        {/* 2. Farmer Dashboard */}
        <Stack.Screen name="FarmerHome" component={FarmerTabs} />
        
        {/* 3. Retailer Dashboard */}
        <Stack.Screen name="RetailerHome" component={RetailerTabs} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}