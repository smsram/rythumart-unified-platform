import React, { useState, useCallback } from 'react';
import { 
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, StatusBar, 
  Dimensions, RefreshControl, ActivityIndicator, TextInput, Modal, FlatList, Alert, Platform, SafeAreaView
} from 'react-native';
import { Mic, Camera, MapPin, Eye, Heart, Plus, Search, X } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_URL } from '../config/api';
import AddCropModal from '../components/AddCropModal';
import PricePredictionCard from '../components/PricePredictionCard';

const { width } = Dimensions.get('window');

const ALL_CROPS = [
    'Tomato', 'Potato', 'Onion', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane',
    'Apple', 'Banana', 'Mango', 'Orange', 'Grapes', 'Papaya', 'Pomegranate',
    'Brinjal', 'Cabbage', 'Cauliflower', 'Carrot', 'Garlic', 'Ginger', 'Chilli', 'Turmeric',
    'Bengal Gram', 'Green Gram', 'Black Gram', 'Tur Dal', 'Soyabean', 'Groundnut',
    'Mustard', 'Sunflower', 'Jowar', 'Bajra', 'Ragi', 'Coconut', 'Coffee', 'Tea',
    'Okra', 'Pumpkin', 'Bottle Gourd', 'Bitter Gourd', 'Cucumber', 'Spinach',
    'Lemon', 'Guava', 'Watermelon', 'Muskmelon', 'Pineapple', 'Jackfruit'
].sort();

const FarmerHome = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [myCrops, setMyCrops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- ANALYSIS STATE ---
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [weight, setWeight] = useState('100'); 
  const [historyData, setHistoryData] = useState([]); 
  const [forecastData, setForecastData] = useState([]); 
  const [trendLoading, setTrendLoading] = useState(false);

  // Search Modal
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCrops = ALL_CROPS.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  useFocusEffect(
    useCallback(() => {
      const loadScreenData = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('userData');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            await Promise.all([
               fetchCrops(parsedUser.id),
               fetchAnalysisData(selectedCrop) 
            ]);
            
            axios.get(`${API_URL}/profile/${parsedUser.id}`)
              .then(res => setUser(prev => ({ ...prev, ...res.data.user, id: parsedUser.id })))
              .catch(() => {});
          }
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
      };

      loadScreenData();
      return () => {};
    }, [selectedCrop]) 
  );

  const fetchCrops = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/crops/farmer/${userId}`);
      setMyCrops(response.data);
    } catch (error) { console.error("Error fetching crops:", error); }
  };

  const fetchAnalysisData = async (cropName) => {
    if (!cropName) return;
    setTrendLoading(true);
    try {
        const marketRes = await axios.get(`${API_URL}/market/prices?limit=100`);
        const currentItem = marketRes.data.find(i => i.cropName === cropName);
        
        // FIX: Default fallback is now 20 (kg price) not 2000 (ton price)
        const currentPrice = currentItem ? currentItem.price : 20; 

        const response = await axios.post(`${API_URL}/market/analyze`, {
            cropName,
            currentPrice
        });

        if (response.data.history && response.data.forecast) {
            setHistoryData(response.data.history);
            setForecastData(response.data.forecast);
        }

    } catch (error) {
        console.log("Analysis fetch error, using fallbacks");
        const base = 20; // FIX: Base price per KG
        
        // Mock History
        setHistoryData(Array.from({length: 7}, (_, i) => ({
            day: ['Mon','Tue','Wed','Thu','Fri','Sat','Today'][i],
            date: `Day -${6-i}`,
            price: Math.floor(base + (i * 0.5) + (Math.random() * 2)) // Smaller fluctuations for KG
        })));

        // Mock Forecast
        setForecastData(Array.from({length: 7}, (_, i) => ({
            day: ['Tom','Tue','Wed','Thu','Fri','Sat','Sun'][i],
            date: `Day +${i+1}`,
            price: Math.floor(base + 1 + (i * 0.5) + (Math.random() * 2))
        })));
    } finally {
        setTrendLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
        await fetchCrops(user.id);
        await fetchAnalysisData(selectedCrop);
    }
    setRefreshing(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Fix: Translucent StatusBar for better look, but padded in container */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {user && user.id && (
        <AddCropModal visible={modalVisible} onClose={() => setModalVisible(false)} onCropAdded={() => fetchCrops(user.id)} userId={user.id} />
      )}

      {/* SEARCH CROP MODAL */}
      <Modal visible={searchVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Crop</Text>
                    <TouchableOpacity onPress={() => setSearchVisible(false)}><X size={24} color="#000" /></TouchableOpacity>
                </View>
                <View style={styles.modalSearch}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput 
                        placeholder="Search crops..." 
                        style={styles.modalInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                    />
                </View>
                <FlatList 
                    data={filteredCrops}
                    keyExtractor={(item) => item}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.cropItem} onPress={() => { setSelectedCrop(item); setSearchVisible(false); }}>
                            <Text style={styles.cropItemText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}><Text style={styles.logoLeaf}>🍃</Text></View>
          <Text style={styles.appName}>AgriFlow</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.locationChip}>
            <MapPin size={14} color="#16A34A" />
            <Text style={styles.locationText}>{user?.location || 'India'}</Text>
          </View>
          <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/100' }} style={styles.profilePic} />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Namaste, {user?.name || 'Farmer'}!</Text>
          <Text style={styles.subGreeting}>AI-Powered Price Analysis</Text>
        </View>

        <PricePredictionCard 
            selectedCrop={selectedCrop}
            weight={weight}
            setWeight={setWeight}
            onOpenSearch={() => setSearchVisible(true)}
            onPredict={() => fetchAnalysisData(selectedCrop)}
            loading={trendLoading}
            historyData={historyData}
            forecastData={forecastData}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert("Coming Soon", "Voice listing features.")}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}><Mic size={24} color="#16A34A" /></View>
            <Text style={styles.actionTitle}>Speak to List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert("Coming Soon", "AI Quality Grading.")}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}><Camera size={24} color="#16A34A" /></View>
            <Text style={styles.actionTitle}>Scan Quality</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Crop Listings</Text>
          <TouchableOpacity onPress={() => fetchCrops(user?.id)}><Text style={styles.viewAll}>Refresh</Text></TouchableOpacity>
        </View>

        {myCrops.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No crops listed yet.</Text>
             <Text style={styles.emptySubText}>Tap + to sell your harvest.</Text>
          </View>
        ) : (
          myCrops.map((crop) => (
            <View key={crop.id} style={styles.listingCard}>
              <Image source={{ uri: crop.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cropImage} />
              <View style={styles.listingInfo}>
                <View style={styles.listingTopRow}>
                  <View style={[styles.statusTag, { backgroundColor: crop.status === 'SOLD' ? '#E5E7EB' : '#DCFCE7' }]}>
                    <Text style={[styles.statusText, { color: crop.status === 'SOLD' ? '#6B7280' : '#16A34A' }]}>{crop.status || 'LIVE'}</Text>
                  </View>
                  <Text style={styles.listingPrice}>₹{crop.price} <Text style={styles.unitText}>/kg</Text></Text>
                </View>
                <Text style={styles.cropName}>{crop.name}</Text>
                <Text style={styles.quantityText}>Qty: {crop.quantity} {crop.quantityUnit || 'kg'}</Text>
                <View style={styles.listingStats}>
                  <View style={styles.statItem}><Eye size={14} color="#9CA3AF" /><Text style={styles.statText}>{crop.views || 0} views</Text></View>
                  <View style={styles.statItem}><Heart size={14} color="#9CA3AF" /><Text style={styles.statText}>{crop.bids || 0} bids</Text></View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="white" />
        <Text style={styles.fabText}>ADD CROP</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // FIX: Using SafeAreaView + paddingTop for Android creates the perfect spacing
  container: { 
    flex: 1, 
    backgroundColor: '#fff', // Header background color
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header styles updated to remove excessive padding since Container handles it
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, // Reduced from 50+ to standard padding
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, backgroundColor: '#16A34A', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoLeaf: { fontSize: 18 },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#16A34A' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  locationChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
  locationText: { fontSize: 12, color: '#15803D', fontWeight: '600', marginLeft: 4 },
  profilePic: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#DCFCE7' },
  
  welcomeSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  actionCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  viewAll: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  listingCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 16, padding: 12, elevation: 2 },
  cropImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  listingInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  listingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  listingPrice: { fontSize: 16, fontWeight: 'bold', color: '#16A34A' },
  unitText: { fontSize: 12, color: '#9CA3AF', fontWeight: 'normal' },
  cropName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  quantityText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  listingStats: { flexDirection: 'row', marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  statText: { fontSize: 10, color: '#9CA3AF', marginLeft: 4 },
  
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  modalInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  cropItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cropItemText: { fontSize: 16, color: '#1F2937' }
});

export default FarmerHome;