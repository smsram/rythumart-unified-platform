import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const StartScreen = ({ navigation }) => {
  // State to track selection ('farmer' or 'retailer')
  const [selectedRole, setSelectedRole] = useState(null); 

  const handleContinue = () => {
    if (selectedRole === 'farmer') {
      // Navigate to Farmer Signup
      navigation.navigate('FarmerSignup');
    } else if (selectedRole === 'retailer') {
      // Navigate to Retailer Signup
      navigation.navigate('RetailerSignup');
    } else {
      Alert.alert("Selection Required", "Please select whether you are a Farmer or a Retailer to continue.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="leaf" size={32} color="#16A34A" />
          </View>
          <Text style={styles.title}>Welcome to AgriFlow</Text>
          <Text style={styles.subtitle}>Select your profile to continue</Text>
        </View>

        {/* --- CARDS SECTION --- */}
        <View style={styles.cardsContainer}>
          
          {/* FARMER CARD */}
          <TouchableOpacity 
            style={[
              styles.card, 
              { borderColor: selectedRole === 'farmer' ? '#16A34A' : '#E2E8F0' },
              selectedRole === 'farmer' && { backgroundColor: '#F0FDF4' }
            ]}
            onPress={() => setSelectedRole('farmer')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="tractor" size={26} color="#16A34A" />
              </View>
              <View style={[
                  styles.radio, 
                  { borderColor: selectedRole === 'farmer' ? '#16A34A' : '#CBD5E1' }
                ]}>
                {selectedRole === 'farmer' && <View style={[styles.radioFill, { backgroundColor: '#16A34A' }]} />}
              </View>
            </View>

            <View style={{zIndex: 10}}>
              <Text style={styles.cardTitle}>Farmer</Text>
              <Text style={styles.cardDesc}>
                List your harvests, manage inventory, and sell directly to local retailers.
              </Text>
            </View>

            <MaterialCommunityIcons name="grass" size={140} color="#16A34A" style={styles.watermarkFarmer} />
          </TouchableOpacity>

          {/* RETAILER CARD */}
          <TouchableOpacity 
            style={[
              styles.card, 
              { borderColor: selectedRole === 'retailer' ? '#2563EB' : '#E2E8F0' },
              selectedRole === 'retailer' && { backgroundColor: '#EFF6FF' }
            ]}
            onPress={() => setSelectedRole('retailer')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="storefront-outline" size={26} color="#2563EB" />
              </View>
              <View style={[
                  styles.radio, 
                  { borderColor: selectedRole === 'retailer' ? '#2563EB' : '#CBD5E1' }
                ]}>
                {selectedRole === 'retailer' && <View style={[styles.radioFill, { backgroundColor: '#2563EB' }]} />}
              </View>
            </View>

            <View style={{zIndex: 10}}>
              <Text style={styles.cardTitle}>Retailer</Text>
              <Text style={styles.cardDesc}>
                Browse local produce, source quality crops, and grow your inventory.
              </Text>
            </View>

            <MaterialCommunityIcons name="basket-outline" size={130} color="#2563EB" style={styles.watermarkRetailer} />
          </TouchableOpacity>

        </View>

        {/* --- FOOTER SECTION --- */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
                styles.continueBtn, 
                { backgroundColor: selectedRole ? '#0F172A' : '#94A3B8' }
            ]}
            onPress={handleContinue}
            disabled={!selectedRole}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
             <Text style={styles.footerHint}>Already have an account? </Text>
             <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.loginLink}>Log In</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.bottomLinks}>
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="globe-outline" size={18} color="#64748B" />
              <Text style={styles.bottomLinkText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="help-circle-outline" size={18} color="#64748B" />
              <Text style={styles.bottomLinkText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  logoBox: { width: 64, height: 64, backgroundColor: '#DCFCE7', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  
  cardsContainer: { paddingHorizontal: 20, gap: 16 },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 2, 
    position: 'relative', 
    overflow: 'hidden', 
    minHeight: 180, 
    elevation: 2 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#64748B', lineHeight: 20, maxWidth: '85%', marginBottom: 12 },
  
  watermarkFarmer: { position: 'absolute', bottom: -30, right: -20, opacity: 0.1, transform: [{ rotate: '-10deg' }] },
  watermarkRetailer: { position: 'absolute', bottom: -20, right: -25, opacity: 0.08, transform: [{ rotate: '-15deg' }] },
  
  footer: { marginTop: 30, paddingHorizontal: 20, alignItems: 'center' },
  continueBtn: { width: '100%', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  loginRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  footerHint: { color: '#64748B', fontSize: 14 },
  loginLink: { color: '#0F172A', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  
  bottomLinks: { flexDirection: 'row', justifyContent: 'center', gap: 32, width: '100%' },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomLinkText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
});

export default StartScreen;