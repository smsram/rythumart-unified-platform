import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Camera, MapPin, TrendingUp, Eye, Heart, Plus } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// --- Imports ---
import { API_URL } from '../config/api';
import AddCropModal from '../components/AddCropModal';

const { width } = Dimensions.get('window');

const FarmerHome = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [myCrops, setMyCrops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- 1. Load User from Cache on Startup ---
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // 1. Set User IMMEDIATELY with cached data (This ensures ID exists)
          setUser(parsedUser); 
          fetchCrops(parsedUser.id);

          // 2. Fetch FRESH profile in background (to update image/name)
          try {
             const res = await axios.get(`${API_URL}/profile/${parsedUser.id}`);
             
             // --- FIX IS HERE ---
             // Don't overwrite! Merge new data, but force keep the ID from cache
             setUser(prev => ({
                ...prev, 
                ...res.data.user, 
                id: parsedUser.id // <--- FORCE KEEP ID
             }));
             
          } catch(err) {
             console.log("Profile sync failed, using cached user");
          }
        }
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // --- 2. Fetch Crops Function ---
  const fetchCrops = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/crops/farmer/${userId}`);
      setMyCrops(response.data);
    } catch (error) {
      console.error("Error fetching crops:", error);
    }
  };

  // --- 3. Refresh Logic ---
  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
        try {
            const res = await axios.get(`${API_URL}/profile/${user.id}`);
            // Safe merge again
            setUser(prev => ({ ...prev, ...res.data.user, id: user.id }));
            await fetchCrops(user.id);
        } catch (e) { console.error(e); }
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* --- ADD CROP MODAL --- */}
      {/* Ensure userId is passed only if user exists */}
      {user && user.id && (
        <AddCropModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onCropAdded={() => fetchCrops(user.id)} 
          userId={user.id}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* --- Header Section --- */}
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
            
            <Image 
              source={{ uri: user?.profileImage || 'https://via.placeholder.com/100' }} 
              style={styles.profilePic} 
            />
          </View>
        </View>

        {/* --- Welcome Text --- */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Namaste, {user?.name || 'Farmer'}!</Text>
          <Text style={styles.subGreeting}>Here's what's happening in your fields today.</Text>
        </View>

        {/* --- AI Insight Card --- */}
        <LinearGradient
          colors={['#16A34A', '#15803D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightCard}
        >
          <View style={styles.insightHeader}>
            <View style={styles.aiTag}><Text style={styles.aiTagText}>AI INSIGHTS</Text></View>
            <View>
              <Text style={styles.priceText}>₹18,500</Text>
              <Text style={styles.priceSubText}>Current / Quintal</Text>
            </View>
          </View>

          <Text style={styles.insightTitle}>Chilli Price Prediction</Text>
          <View style={styles.chartContainer}>
            {[30, 50, 45, 60, 40, 70, 80].map((h, i) => (
              <View key={i} style={[styles.bar, { height: h, opacity: i === 6 ? 1 : 0.4 }]} />
            ))}
          </View>
          <View style={styles.predictionFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TrendingUp size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.predictionText}>Prices expected to rise by 12% in 5 days</Text>
            </View>
            <TouchableOpacity style={styles.holdButton}><Text style={styles.holdButtonText}>HOLD STOCK</Text></TouchableOpacity>
          </View>
        </LinearGradient>

        {/* --- Action Buttons --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}><Mic size={24} color="#16A34A" /></View>
            <Text style={styles.actionTitle}>Speak to List</Text>
            <Text style={styles.actionSub}>VOICE INPUT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}><Camera size={24} color="#16A34A" /></View>
            <Text style={styles.actionTitle}>Quality Scan</Text>
            <Text style={styles.actionSub}>AI INSPECTION</Text>
          </TouchableOpacity>
        </View>

        {/* --- Listings Section --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Crop Listings</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        {/* --- Dynamic List Rendering --- */}
        {myCrops.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No crops listed yet.</Text>
             <Text style={styles.emptySubText}>Tap the + button to sell your harvest.</Text>
          </View>
        ) : (
          myCrops.map((crop) => (
            <View key={crop.id} style={styles.listingCard}>
              <Image 
                source={{ uri: crop.imageUrl || 'https://via.placeholder.com/150' }} 
                style={styles.cropImage} 
              />
              <View style={styles.listingInfo}>
                <View style={styles.listingTopRow}>
                  <View style={[styles.statusTag, { backgroundColor: crop.status === 'SOLD' ? '#E5E7EB' : '#DCFCE7' }]}>
                    <Text style={[styles.statusText, { color: crop.status === 'SOLD' ? '#6B7280' : '#16A34A' }]}>
                      {crop.status || 'LIVE'}
                    </Text>
                  </View>
                  <Text style={styles.listingPrice}>₹{crop.price} <Text style={styles.unitText}>/q</Text></Text>
                </View>
                
                <Text style={styles.cropName}>{crop.name}</Text>
                <Text style={styles.quantityText}>Quantity: {crop.quantity} {crop.quantityUnit || 'Tons'}</Text>
                
                <View style={styles.listingStats}>
                  <View style={styles.statItem}>
                    <Eye size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{crop.views || 0} views</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Heart size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{crop.bids || 0} bids</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* --- Floating Action Button (FAB) --- */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="white" />
        <Text style={styles.fabText}>ADD CROP</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, backgroundColor: '#16A34A', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoLeaf: { fontSize: 18 },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#16A34A' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  locationChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
  locationText: { fontSize: 12, color: '#15803D', fontWeight: '600', marginLeft: 4 },
  profilePic: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#DCFCE7' },
  welcomeSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  insightCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, minHeight: 220 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aiTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  priceText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  priceSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, textAlign: 'right' },
  insightTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 20 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 60, marginBottom: 20, paddingHorizontal: 10 },
  bar: { width: width * 0.08, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4 },
  predictionFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: 12 },
  predictionText: { color: '#fff', fontSize: 12, flex: 1, lineHeight: 18 },
  holdButton: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  holdButtonText: { color: '#16A34A', fontSize: 10, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  actionCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  actionSub: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  viewAll: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  listingCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
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
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, zIndex: 10 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#94A3B8', marginTop: 4 }
});

export default FarmerHome;