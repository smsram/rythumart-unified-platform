import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Modal, TextInput, Image, FlatList 
} from 'react-native';
import { 
  Store, MapPin, CreditCard, FileText, Globe, LogOut, ChevronRight, BadgeCheck, Edit2, X, Search, Crosshair, Plus, Trash2, Check 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { API_URL } from '../config/api';
import CustomAlert from '../components/CustomAlert';

const RetailerProfile = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalSpent: 0, orderCount: 0 });
  const [addresses, setAddresses] = useState([]); // List of addresses

  // Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false); // To View List
  const [addAddressMapVisible, setAddAddressMapVisible] = useState(false); // To Add New

  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  // New Address State
  const mapRef = useRef(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.5937, longitude: 78.9629, latitudeDelta: 15, longitudeDelta: 15
  });
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  // --- 1. Load Data ---
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const res = await axios.get(`${API_URL}/profile/${parsedUser.id}`);
        setProfile(res.data.user);
        setStats({ totalSpent: res.data.stats?.total || 0, orderCount: res.data.stats?.month || 0 });
        
        // Fetch Addresses
        fetchAddresses(parsedUser.id);
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/address/${userId}`);
      setAddresses(res.data);
    } catch (err) { console.error(err); }
  };

  // --- 2. Address Logic ---
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        setAlertConfig({ visible: true, title: "Permission Denied", message: "Enable GPS." });
        return;
    }
    let location = await Location.getCurrentPositionAsync({});
    updateMapRegion(location.coords.latitude, location.coords.longitude);
  };

  const updateMapRegion = async (lat, long) => {
    const newRegion = { latitude: lat, longitude: long, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setMapRegion(newRegion);
    setSelectedCoords({ latitude: lat, longitude: long });
    if(mapRef.current) mapRef.current.animateToRegion(newRegion, 1000);
    
    // Reverse Geocode
    let addr = await Location.reverseGeocodeAsync({ latitude: lat, longitude: long });
    if(addr.length > 0) {
        const place = `${addr[0].street || ''} ${addr[0].city}, ${addr[0].region}`;
        setSelectedLocation(place);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressLabel || !selectedLocation) {
        setAlertConfig({ visible: true, title: "Missing Info", message: "Please select location and give it a name." });
        return;
    }
    setSaving(true);
    try {
        await axios.post(`${API_URL}/address/add`, {
            userId: profile.id,
            label: newAddressLabel,
            addressLine: selectedLocation,
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            isDefault: addresses.length === 0 // Make default if it's the first one
        });
        fetchAddresses(profile.id);
        setAddAddressMapVisible(false);
        setNewAddressLabel('');
        setAlertConfig({ visible: true, title: "Success", message: "Address Added!" });
    } catch(err) {
        setAlertConfig({ visible: true, title: "Error", message: "Could not save address." });
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
      try {
          await axios.delete(`${API_URL}/address/${id}`);
          fetchAddresses(profile.id);
      } catch(err) { console.error(err); }
  };

  // --- 3. Simple Profile Edit ---
  const handleSaveProfileName = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/profile/${profile.id}`, { name: editName });
      setEditModalVisible(false);
      loadProfile();
    } catch (err) {
      setAlertConfig({ visible: true, title: "Error", message: "Update Failed." });
    } finally { setSaving(false); }
  };

  // --- 4. Logout ---
  const handleLogout = () => {
    setAlertConfig({
        visible: true, title: "Logout", message: "Are you sure?", showCancel: true,
        onConfirm: async () => {
            await AsyncStorage.removeItem('userData');
            navigation.reset({ index: 0, routes: [{ name: 'StartScreen' }] });
        }
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        singleButton={!alertConfig.showCancel}
        onConfirm={() => {
            if(alertConfig.onConfirm) alertConfig.onConfirm();
            setAlertConfig({ ...alertConfig, visible: false });
        }}
        onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}><Store size={32} color="#16A34A" /></View>
            <View style={styles.profileText}>
              <Text style={styles.businessName}>{profile?.name || "Retailer"}</Text>
              <View style={styles.verifiedRow}>
                <BadgeCheck size={16} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedText}>Verified • {addresses[0]?.addressLine?.split(',')[0] || "No Address Set"}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setEditName(profile?.name); setEditModalVisible(true); }} style={{padding: 8}}>
                <Edit2 size={20} color="#64748B"/>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statLabel}>TOTAL SPENT</Text><Text style={styles.statValue}>₹{(stats.totalSpent/1000).toFixed(1)}k</Text></View>
            <View style={styles.verticalLine} />
            <View style={styles.statItem}><Text style={styles.statLabel}>ORDERS</Text><Text style={styles.statValue}>{stats.orderCount}</Text></View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setAddressModalVisible(true)}>
            <View style={styles.iconBox}><MapPin size={20} color="#64748B" /></View>
            <View style={{flex: 1}}>
                <Text style={styles.settingTitle}>Manage Delivery Addresses</Text>
                {addresses.length > 0 && <Text style={styles.subText}>{addresses.length} Saved Addresses</Text>}
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}><CreditCard size={20} color="#64748B" /></View>
            <Text style={styles.settingTitle}>Payment Methods</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}><Globe size={20} color="#64748B" /></View>
            <Text style={styles.settingTitle}>Language</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={styles.iconBox}><LogOut size={20} color="#EF4444" /></View>
            <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>AgriFlow v2.4.1</Text>
      </ScrollView>

      {/* --- EDIT NAME MODAL --- */}
      <Modal visible={editModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Business Name</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
                <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop: 10}}>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{padding:10}}><Text>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveProfileName} style={{padding:10, backgroundColor:'#16A34A', borderRadius:8, marginLeft:10}}><Text style={{color:'white'}}>Save</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MANAGE ADDRESSES LIST MODAL --- */}
      <Modal visible={addressModalVisible} animationType="slide">
        <View style={{flex: 1, backgroundColor: '#F8F9FA'}}>
            <View style={styles.mapHeader}>
                <TouchableOpacity onPress={() => setAddressModalVisible(false)}><X size={24} color="#000"/></TouchableOpacity>
                <Text style={styles.headerTitleSmall}>My Addresses</Text>
                <TouchableOpacity onPress={() => setAddAddressMapVisible(true)}><Plus size={24} color="#16A34A"/></TouchableOpacity>
            </View>
            <FlatList 
                data={addresses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{padding: 20}}
                renderItem={({item}) => (
                    <View style={styles.addressCard}>
                        <View style={{flex: 1}}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Text style={styles.addrLabel}>{item.label}</Text>
                                {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                            </View>
                            <Text style={styles.addrText}>{item.addressLine}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}><Trash2 size={20} color="#EF4444"/></TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={{textAlign:'center', marginTop:50, color:'#94A3B8'}}>No addresses saved yet.</Text>}
            />
        </View>
      </Modal>

      {/* --- ADD NEW ADDRESS MAP MODAL --- */}
      <Modal visible={addAddressMapVisible} animationType="slide">
        <View style={{flex: 1}}>
            <View style={styles.mapHeader}>
                <TouchableOpacity onPress={() => setAddAddressMapVisible(false)} style={styles.backBtn}><X size={24} color="#000"/></TouchableOpacity>
                <TextInput 
                    style={styles.mapSearch} 
                    placeholder="Search location..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={async () => {
                        let res = await Location.geocodeAsync(searchQuery);
                        if(res.length > 0) updateMapRegion(res[0].latitude, res[0].longitude);
                    }}
                />
                <TouchableOpacity onPress={getCurrentLocation}><Crosshair size={24} color="#16A34A"/></TouchableOpacity>
            </View>
            
            <MapView
                ref={mapRef}
                style={{flex: 1}}
                provider={PROVIDER_DEFAULT}
                region={mapRegion}
                onPress={(e) => updateMapRegion(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
            >
                {selectedCoords && <Marker coordinate={selectedCoords} />}
            </MapView>

            <View style={styles.mapFooter}>
                <Text style={styles.selectedLocText}>Selected: {selectedLocation || "Tap map to select"}</Text>
                <Text style={styles.label}>Address Label (e.g. Warehouse, Shop)</Text>
                <TextInput style={styles.input} placeholder="Enter Label" value={newAddressLabel} onChangeText={setNewAddressLabel} />
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveNewAddress} disabled={saving}>
                    {saving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmText}>Save Address</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  headerTitleSmall: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },

  profileCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25, elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#22C55E' },
  profileText: { marginLeft: 16, flex: 1 },
  businessName: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  verticalLine: { width: 1, height: 40, backgroundColor: '#F1F5F9' },

  settingsContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 30 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBox: { marginRight: 15 },
  settingTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#334155' },
  subText: { fontSize: 12, color: '#16A34A', marginTop: 2 },
  footerText: { textAlign: 'center', color: '#94A3B8', fontSize: 12 },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A', marginBottom: 10 },

  /* MAP MODAL */
  mapHeader: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingTop: 50 },
  backBtn: { marginRight: 10 },
  mapSearch: { flex: 1, backgroundColor: '#F1F5F9', padding: 10, borderRadius: 10, marginRight: 10 },
  mapFooter: { padding: 20, backgroundColor: '#FFF' },
  selectedLocText: { marginBottom: 15, fontSize: 14, color: '#334155' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 5 },
  confirmBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#FFF', fontWeight: 'bold' },

  /* ADDRESS LIST CARD */
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  addrLabel: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  addrText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  defaultBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  defaultText: { fontSize: 10, color: '#16A34A', fontWeight: 'bold' }
});

export default RetailerProfile;