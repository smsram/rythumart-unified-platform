import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- IMPORT THIS
import { API_URL } from '../config/api'; 
import CustomAlert from '../components/CustomAlert'; 

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    singleButton: true,
    onConfirm: () => setAlertVisible(false)
  });

  const showAlert = (title, message, onConfirm = null) => {
    setAlertConfig({
      title,
      message,
      singleButton: true,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
    });
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      showAlert("Error", "Please enter phone number and password");
      return;
    }

    setLoading(true);
    try {
      // 1. Call Backend
      const response = await axios.post(`${API_URL}/auth/login`, {
        phone,
        password
      });

      const user = response.data.user;
      
      // 2. SAVE TO CACHE (AsyncStorage)
      // We store the whole user object as a string
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Navigate based on Role
      if (user.role === 'FARMER') {
        navigation.replace('FarmerHome'); 
      } else if (user.role === 'RETAILER') {
        navigation.replace('RetailerHome');
      } else {
        showAlert("Error", "Unknown user role detected.");
      }

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Login failed. Check connection.";
      showAlert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* --- CUSTOM ALERT --- */}
      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertVisible(false)}
        singleButton={alertConfig.singleButton}
      />

      <View style={styles.content}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to access your AgriFlow account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="98765 43210" 
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 20}}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{color:'#16A34A', fontWeight:'bold'}}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A', marginBottom: 20 },
  primaryBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: '#64748B', fontSize: 14 }
});

export default LoginScreen;