import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StartScreen from '../screens/StartScreen'; // Import your screens
import LoginScreen from '../screens/LoginScreen';
import FarmerSignup from '../screens/FarmerSignup';
import RetailerSignup from '../screens/RetailerSignup';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StartScreen" component={StartScreen} />
      <Stack.Screen name="FarmerSignup" component={FarmerSignup} />
      <Stack.Screen name="RetailerSignup" component={RetailerSignup} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;