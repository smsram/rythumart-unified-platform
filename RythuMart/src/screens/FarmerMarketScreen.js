import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar, Dimensions, Alert, ActivityIndicator 
} from 'react-native';
import { Search, TrendingUp, TrendingDown, Plus, Phone, Check, X as XIcon } from 'lucide-react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCropModal from '../components/AddCropModal';
import { API_URL } from '../config/api';

const FarmerMarketScreen = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Load User & Fetch Data ---
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchRequests(parsedUser.id);
          }
        } catch (e) {
          console.error("Init Error:", e);
        } finally {
          setLoading(false);
        }
      };
      init();
    }, [])
  );

  const fetchRequests = async (farmerId) => {
    try {
      const res = await axios.get(`${API_URL}/requests/farmer/${farmerId}`);
      setRequests(res.data);
    } catch (error) {
      console.log("No requests found or server error");
    }
  };

  // --- 2. Action Handlers ---
  const handleRespond = async (id, status) => {
    try {
      // Optimistic Update
      setRequests(prev => prev.filter(r => r.id !== id));
      await axios.put(`${API_URL}/requests/respond/${id}`, { status });
      Alert.alert("Success", `Request ${status.toLowerCase()}!`);
    } catch (error) {
      Alert.alert("Error", "Action failed. Check internet.");
      if(user) fetchRequests(user.id);
    }
  };

  const handleCall = (phone) => {
    Alert.alert("Calling Buyer...", `Dialing ${phone}...`);
  };

  // --- Mock Mandi Data ---
  const mandiPrices = [
    { id: 1, name: 'Tomato', location: 'Guntur Mandi, AP', price: '₹2,450', trend: 'up', icon: '🍅' },
    { id: 2, name: 'Dry Chilli', location: 'Khammam Market, TS', price: '₹18,200', trend: 'up', icon: '🌶️' },
    { id: 3, name: 'Onion', location: 'Lasalgaon, MH', price: '₹1,850', trend: 'down', icon: '🧅' },
  ];
  const filters = ['All', 'Vegetables', 'Fruits', 'Grains', 'Spices'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* ADD CROP MODAL */}
      {user && (
        <AddCropModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onCropAdded={() => Alert.alert("Success", "Crop Listed!")} 
          userId={user.id} 
        />
      )}

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Rates</Text>
        <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.profilePic} />
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput placeholder="Search Mandi or Crop..." placeholderTextColor="#9CA3AF" style={styles.searchInput} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter, index) => (
            <TouchableOpacity key={index} style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]} onPress={() => setActiveFilter(filter)}>
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- SECTION 1: LIVE MANDI PRICES (MOVED UP) --- */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>Live Mandi Prices</Text>
          </View>
          <TouchableOpacity><Text style={styles.viewMapText}>View Maps</Text></TouchableOpacity>
        </View>
        
        <View style={styles.cardContainer}>
          {mandiPrices.map((item) => (
            <View key={item.id} style={styles.priceCard}>
              <View style={styles.priceLeft}>
                <View style={styles.emojiBox}><Text style={{ fontSize: 24 }}>{item.icon}</Text></View>
                <View>
                  <Text style={styles.cardCropName}>{item.name}</Text>
                  <Text style={styles.mandiLoc}>{item.location}</Text>
                </View>
              </View>
              <View style={styles.priceRight}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text style={[styles.priceValue, item.trend === 'down' && { color: '#EF4444' }]}>{item.price}</Text>
                  {item.trend === 'up' ? <TrendingUp size={16} color="#16A34A" style={{ marginLeft: 4 }} /> : <TrendingDown size={16} color="#EF4444" style={{ marginLeft: 4 }} />}
                </View>
                <Text style={styles.perQuintal}>per quintal</Text>
              </View>
            </View>
          ))}
        </View>

        {/* --- SECTION 2: BUYER REQUESTS (MOVED DOWN) --- */}
        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <Text style={styles.sectionTitle}>Active Buyer Requests</Text>
          <TouchableOpacity><Text style={styles.viewMapText}>See All</Text></TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#16A34A" style={{margin: 20}} />
        ) : requests.length === 0 ? (
          <View style={{padding: 20, alignItems: 'center'}}>
            <Text style={{color: '#94A3B8'}}>No pending requests.</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              {/* Header */}
              <View style={styles.reqHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image 
                    source={{ uri: req.buyer.profileImage || 'https://via.placeholder.com/40' }} 
                    style={styles.buyerAvatarImg} 
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.buyerName}>{req.buyer.businessName || req.buyer.name}</Text>
                    <Text style={styles.ratingText}>{req.buyer.phone}</Text>
                  </View>
                </View>
                <View style={[styles.tagBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.tagText, { color: '#16A34A' }]}>OFFER</Text>
                </View>
              </View>

              {/* Body */}
              <View style={styles.reqBody}>
                <Image 
                  source={{ uri: req.crop.imageUrl || 'https://via.placeholder.com/60' }} 
                  style={styles.reqImage} 
                />
                <View style={styles.reqDetails}>
                  <Text style={styles.reqCropName}>{req.crop.name}</Text>
                  <Text style={styles.reqQuantity}>Qty: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{req.quantity} {req.crop.quantityUnit || 'Tons'}</Text></Text>
                  <Text style={styles.reqOffer}>Offer: <Text style={{ fontWeight: 'bold', color: '#16A34A' }}>₹{req.offerPrice}</Text></Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.reqActions}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(req.id, 'REJECTED')}>
                  <XIcon size={20} color="#EF4444" />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(req.id, 'ACCEPTED')}>
                  <Check size={20} color="#FFF" />
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(req.buyer.phone)}>
                  <Phone size={20} color="#16A34A" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  profilePic: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#DCFCE7' },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12 },
  searchInput: { marginLeft: 10, fontSize: 16, color: '#334155', flex: 1 },
  filterScroll: { paddingLeft: 20, marginBottom: 25 },
  filterChip: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
  activeFilterChip: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeFilterText: { color: '#fff' },
  
  /* Section Header */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F87171', marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  viewMapText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  
  /* Mandi Cards */
  cardContainer: { paddingHorizontal: 20, backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, paddingVertical: 10 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  priceLeft: { flexDirection: 'row', alignItems: 'center' },
  emojiBox: { width: 48, height: 48, backgroundColor: '#FFF7ED', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardCropName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  mandiLoc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#16A34A' },
  perQuintal: { fontSize: 11, color: '#94A3B8', textAlign: 'right' },
  
  /* Request Card */
  requestCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  buyerAvatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  buyerName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  ratingText: { fontSize: 12, color: '#64748B' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  reqBody: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 15 },
  reqImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E2E8F0' },
  reqDetails: { marginLeft: 12, justifyContent: 'center' },
  reqCropName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  reqQuantity: { fontSize: 13, color: '#64748B', marginTop: 2 },
  reqOffer: { fontSize: 13, color: '#64748B', marginTop: 2 },
  reqActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  rejectText: { color: '#EF4444', fontWeight: 'bold', marginLeft: 6 },
  acceptBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#16A34A' },
  acceptText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  callBtn: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});

export default FarmerMarketScreen;