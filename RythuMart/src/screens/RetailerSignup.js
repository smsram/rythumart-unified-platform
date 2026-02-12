import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

const RetailerSignup = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // --- Form State ---
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Retailer Name
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState(''); // Delivery Address

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    onConfirm: () => setAlertVisible(false),
  });

  const showAlert = (title, message, onConfirm = null) => {
    setAlertData({
      title,
      message,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
    });
    setAlertVisible(true);
  };

  // --- Simulation for Location ---
  const detectLocation = () => {
    setLocation("Checking GPS...");
    setTimeout(() => {
      setLocation("Shop 42, GGU Main Road, Bilaspur");
    }, 1500);
  };

  // --- API Submission ---
  const handleSignup = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        phone,
        password,
        role: 'RETAILER',
        businessName,
        location,
      };

      const response = await axios.post(`${API_URL}/auth/signup`, payload);

      if (response.status === 201) {
        setLoading(false);
        showAlert("Success", "Your retailer account is ready!", () => {
          setAlertVisible(false);
          navigation.replace('RetailerHome');
        });
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      const msg = error.response?.data?.error || "Signup failed. Check connection.";
      showAlert("Error", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* --- MODAL ALERT --- */}
      <Modal
        transparent={true}
        visible={alertVisible}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{alertData.title}</Text>
            <Text style={styles.modalMessage}>{alertData.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={alertData.onConfirm}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Progress Bar --- */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1: Identity (Phone & Password) */}
        {step === 1 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Retailer Identity</Text>
            <Text style={styles.subtitle}>Create your business credentials.</Text>
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="98765 43210" 
              keyboardType="phone-pad" 
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Create Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Min 6 characters" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => {
                if (phone.length === 10 && password.length >= 4) setStep(2);
                else showAlert("Invalid Input", "Enter valid phone and password.");
              }}
            >
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Business Details */}
        {step === 2 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>📝</Text>
            <Text style={styles.title}>Business Details</Text>
            <Text style={styles.subtitle}>Tell us about your shop.</Text>
            
            <Text style={styles.label}>Your Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Siva Kumar" 
              value={name}
              onChangeText={setName} 
            />

            <Text style={styles.label}>Business Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Siva Traders" 
              value={businessName}
              onChangeText={setBusinessName} 
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} 
                onPress={() => {
                  if (name && businessName) setStep(3);
                  else showAlert("Missing Info", "Name and Business Name are required.");
                }}
              >
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.title}>Location</Text>
            <Text style={styles.subtitle}>Where should farmers deliver crops?</Text>
            
            <TouchableOpacity style={styles.gpsBtn} onPress={detectLocation}>
              <Text style={styles.gpsBtnText}>📍 Detect My Shop Location</Text>
            </TouchableOpacity>
            
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Type Address Manually" 
              value={location}
              onChangeText={setLocation} 
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: '#16A34A' }]} 
                onPress={handleSignup}
                disabled={loading}
              >
                 {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  progressContainer: { height: 6, backgroundColor: '#F1F5F9', marginHorizontal: 20, marginTop: 20, borderRadius: 3 },
  progressBar: { height: 6, backgroundColor: '#2563EB', borderRadius: 3 },
  scrollContent: { padding: 24 },
  stepView: { marginTop: 10 },
  emoji: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 16, color: '#0F172A' },
  primaryBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  backBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginRight: 10, backgroundColor: '#F1F5F9' },
  backBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 16 },
  btnRow: { flexDirection: 'row', marginTop: 10 },
  
  /* Retailer Specific */
  gpsBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#2563EB', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20, backgroundColor: '#F0F9FF' },
  gpsBtnText: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },

  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: width - 60, backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#0F172A' },
  modalMessage: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  modalButton: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default RetailerSignup;