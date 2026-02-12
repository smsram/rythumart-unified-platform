import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,           // <--- Added Modal
  Dimensions       // <--- Added Dimensions
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api'; 

const { width } = Dimensions.get('window');

const FarmerSignup = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [crops, setCrops] = useState([]);

  // --- Alert State (Internal) ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    onConfirm: () => setAlertVisible(false),
  });

  // --- Helper to Show Alert ---
  const showAlert = (title, message, onConfirm = null) => {
    setAlertData({
      title,
      message,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
    });
    setAlertVisible(true);
  };

  // --- Crop Options ---
  const cropList = ['Tomato', 'Chilli', 'Rice', 'Cotton', 'Onion', 'Mango', 'Corn', 'Turmeric'];

  const toggleCrop = (crop) => {
    if (crops.includes(crop)) setCrops(crops.filter(c => c !== crop));
    else setCrops([...crops, crop]);
  };

  // --- API Submission ---
  const handleSignup = async () => {
    if (crops.length === 0) {
      showAlert("Selection Required", "Please select at least one crop.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        phone,
        password,
        role: 'FARMER',
        location,
        mainCrops: crops.join(', '),
      };

      const response = await axios.post(`${API_URL}/auth/signup`, payload);

      if (response.status === 201) {
        setLoading(false);
        showAlert("Welcome!", "Your account has been created successfully.", () => {
          setAlertVisible(false);
          navigation.replace('FarmerHome');
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

      {/* --- BUILT-IN CUSTOM ALERT MODAL --- */}
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
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={alertData.onConfirm}
            >
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
        
        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>📱</Text>
            <Text style={styles.title}>Mobile Registration</Text>
            <Text style={styles.subtitle}>Enter your number and password.</Text>
            
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
                if(phone.length === 10 && password.length >= 4) setStep(2);
                else showAlert("Invalid Input", "Please enter a valid phone number and password.");
              }}
            >
              <Text style={styles.btnText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>🚜</Text>
            <Text style={styles.title}>Farmer Details</Text>
            <Text style={styles.subtitle}>Who are you and where do you farm?</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Ramesh Rao" 
              value={name}
              onChangeText={setName}
            />
            
            <Text style={styles.label}>Village / Mandal</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Guntur, Andhra Pradesh" 
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} 
                onPress={() => {
                  if(name.length > 2 && location.length > 2) setStep(3);
                  else showAlert("Missing Info", "Please fill in your name and location.");
                }}
              >
                <Text style={styles.btnText}>Next Step</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View style={styles.stepView}>
            <Text style={styles.emoji}>🌾</Text>
            <Text style={styles.title}>What do you grow?</Text>
            <Text style={styles.subtitle}>Select your main crops.</Text>
            
            <View style={styles.chipContainer}>
              {cropList.map(item => (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.chip, crops.includes(item) && styles.chipActive]}
                  onPress={() => toggleCrop(item)}
                >
                  <Text style={[styles.chipText, crops.includes(item) && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} 
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Finish Setup</Text>
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
  progressBar: { height: 6, backgroundColor: '#16A34A', borderRadius: 3 },
  scrollContent: { padding: 24 },
  stepView: { marginTop: 10 },
  emoji: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 16, color: '#0F172A' },
  primaryBtn: { backgroundColor: '#16A34A', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  backBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginRight: 10, backgroundColor: '#F1F5F9' },
  backBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 16 },
  btnRow: { flexDirection: 'row', marginTop: 10 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  chipText: { color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },

  /* --- MODAL STYLES --- */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: width - 60, backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#0F172A' },
  modalMessage: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  modalButton: { backgroundColor: '#16A34A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default FarmerSignup;