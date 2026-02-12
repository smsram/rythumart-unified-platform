import React, { useState, useCallback } from 'react';
import { 
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Modal, TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Settings, Edit2, Landmark, Globe, HelpCircle, LogOut, ChevronRight, TrendingUp, Star, Camera, X 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker'; 

import { API_URL } from '../config/api';
import CustomAlert from '../components/CustomAlert'; // <--- Import CustomAlert

const FarmerProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, month: 0 });
  
  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [language, setLanguage] = useState('English');
  const [langModalVisible, setLangModalVisible] = useState(false);

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    singleButton: true
  });

  // --- Helper to Show Custom Alert ---
  const showAlert = (title, message, onConfirm = null, singleButton = true) => {
    setAlertConfig({ title, message, onConfirm, singleButton });
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  // --- 1. Load Data ---
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang) setLanguage(savedLang);

      if (userData) {
        const parsedUser = JSON.parse(userData);
        const res = await axios.get(`${API_URL}/profile/${parsedUser.id}`);
        setProfile(res.data.user);
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Edit Handlers ---
  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name);
      setEditLocation(profile.location);
      setEditImage(profile.profileImage);
      setEditModalVisible(true);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert("Permission Required", "Need photo access to update profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalImageUrl = editImage;

      // If image is new (local URI), upload it first
      if (editImage && !editImage.startsWith('http')) {
        const formData = new FormData();
        formData.append('image', {
          uri: editImage,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = uploadRes.data.imageUrl;
      }

      // Update Profile in DB
      const userData = await AsyncStorage.getItem('userData');
      const userId = JSON.parse(userData).id;

      await axios.put(`${API_URL}/profile/${userId}`, {
        name: editName,
        location: editLocation,
        profileImage: finalImageUrl
      });

      setEditModalVisible(false);
      showAlert("Success", "Profile Updated Successfully!", () => {
         loadProfile(); // Refresh Data after alert closes
         closeAlert();
      });

    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // --- 3. Logout ---
  const handleLogoutPress = () => {
    showAlert(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
         await AsyncStorage.removeItem('userData');
         closeAlert();
         navigation.reset({ index: 0, routes: [{ name: 'StartScreen' }] });
      },
      false // singleButton = false (Shows Cancel & Confirm)
    );
  };

  const formatMoney = (amount) => amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- CUSTOM ALERT COMPONENT --- */}
      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={closeAlert}
        singleButton={alertConfig.singleButton}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.iconBtn}><Settings size={24} color="#1F2937" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: profile?.profileImage || 'https://via.placeholder.com/100' }} style={styles.profileImg} />
            <TouchableOpacity style={styles.editBadge} onPress={openEditModal}>
              <Edit2 size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.location}>{profile?.location}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                {profile?.isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>VERIFIED</Text></View>}
                <View style={styles.ratingBadge}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{profile?.rating}</Text>
                </View>
            </View>
          </View>
        </View>

        {/* Earnings Card */}
        <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.earningCard}>
          <Text style={styles.earningLabel}>Total Lifetime Earnings</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
            <Text style={styles.earningAmount}>{formatMoney(stats.total)}</Text>
            <TrendingUp size={20} color="#D1FAE5" style={{marginLeft: 8}} />
          </View>
          <View style={styles.divider} />
          <View style={styles.cardFooter}>
            <View><Text style={styles.monthLabel}>THIS MONTH</Text><Text style={styles.monthAmount}>{formatMoney(stats.month)}</Text></View>
            <TouchableOpacity style={styles.withdrawBtn}><Text style={styles.withdrawText}>Withdraw</Text></TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Settings */}
        <Text style={styles.sectionHeader}>ACCOUNT SETTINGS</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}><Landmark size={20} color="#2563EB" /></View>
            <View style={styles.settingInfo}><Text style={styles.settingTitle}>Bank Account</Text><Text style={styles.settingSub}>{profile?.bankAccount || "Link Bank Account"}</Text></View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => setLangModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}><Globe size={20} color="#9333EA" /></View>
            <View style={styles.settingInfo}><Text style={styles.settingTitle}>Language</Text><Text style={styles.settingSub}>{language}</Text></View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
          <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- EDIT PROFILE MODAL --- */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}><X size={24} color="#64748B"/></TouchableOpacity>
                </View>

                {/* Image Picker */}
                <View style={{alignItems: 'center', marginBottom: 20}}>
                    <TouchableOpacity onPress={pickImage} style={styles.editImgWrapper}>
                        <Image source={{ uri: editImage || 'https://via.placeholder.com/100' }} style={styles.editImg} />
                        <View style={styles.camBadge}><Camera size={16} color="#FFF"/></View>
                    </TouchableOpacity>
                    <Text style={{color: '#16A34A', fontSize: 12, marginTop: 8, fontWeight:'600'}}>Change Photo</Text>
                </View>

                {/* Inputs */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Enter your name" />
                
                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation} placeholder="City, State" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* --- Language Modal --- */}
      <Modal visible={langModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {width: '80%'}]}>
                <Text style={styles.modalTitle}>Select Language</Text>
                {['English', 'Hindi', 'Telugu'].map(lang => (
                    <TouchableOpacity key={lang} style={styles.langOption} onPress={() => { setLanguage(lang); AsyncStorage.setItem('appLanguage', lang); setLangModalVisible(false); }}>
                        <Text style={[styles.langText, language === lang && {color:'#16A34A', fontWeight:'bold'}]}>{lang}</Text>
                        {language === lang && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  iconBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 20 },
  
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20 },
  imageContainer: { position: 'relative' },
  profileImg: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#FFF', backgroundColor: '#E2E8F0' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#16A34A', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F8F9FA' },
  
  profileText: { marginLeft: 15 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  location: { fontSize: 13, color: '#64748B', marginTop: 2 },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  verifiedText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { fontSize: 10, fontWeight: 'bold', color: '#B45309', marginLeft: 4 },

  earningCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: '#16A34A', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  earningLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  earningAmount: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold' },
  monthAmount: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  withdrawText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  sectionHeader: { paddingHorizontal: 20, fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 10, letterSpacing: 1 },
  settingsList: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 5 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  settingSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 25, paddingVertical: 16, backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },

  /* MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  editImgWrapper: { position: 'relative' },
  editImg: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E2E8F0' },
  camBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#16A34A', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#FFF' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A' },
  saveBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  /* Lang Modal */
  langOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  langText: { fontSize: 16, color: '#334155' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', alignSelf: 'center' }
});

export default FarmerProfileScreen;