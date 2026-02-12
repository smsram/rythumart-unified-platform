import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Linking, Image
} from 'react-native';
import { Search, TrendingUp, TrendingDown, Minus, Calculator, Phone, Check, X as XIcon, Store } from 'lucide-react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config/api';
import CustomAlert from '../components/CustomAlert';

// --- HELPER: SMART EMOJI SELECTOR ---
const getCropIcon = (cropName) => {
  const name = cropName ? cropName.toLowerCase() : '';
  if (name.includes('potato')) return '🥔';
  if (name.includes('onion')) return '🧅';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('brinjal') || name.includes('eggplant')) return '🍆';
  if (name.includes('carrot')) return '🥕';
  if (name.includes('garlic')) return '🧄';
  if (name.includes('rice')) return '🍚';
  if (name.includes('wheat')) return '🌾';
  return '🌱'; 
};

const FarmerMarketScreen = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]); 
  const [user, setUser] = useState(null);
  
  // Loading & Sync
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [priceLimit, setPriceLimit] = useState(10);

  // Calculator State
  const [calcWeight, setCalcWeight] = useState('100'); 

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [priceLimit]) 
  );

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchRequests(parsedUser.id);
        fetchMarketPrices();
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchRequests = async (farmerId) => {
    try {
      const res = await axios.get(`${API_URL}/requests/farmer/${farmerId}`);
      setRequests(res.data);
    } catch (error) { console.log("No requests"); }
  };

  const fetchMarketPrices = async () => {
    if (marketLoading) return;
    setMarketLoading(true);
    try {
        const res = await axios.get(`${API_URL}/market/prices?limit=${priceLimit}`);
        setMarketPrices(res.data);
    } catch (error) { console.error(error); } 
    finally { setMarketLoading(false); }
  };

  // --- ACTIONS ---
  const handleLimitChange = (newLimit) => {
    setPriceLimit(newLimit);
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
        setAlertConfig({ visible: true, title: "Sync Started", message: "Updating data from Govt API..." });
        setTimeout(() => { fetchMarketPrices(); setSyncing(false); }, 2000);
    } catch (err) { setSyncing(false); }
  };

  const handleCall = (phone) => { Linking.openURL(`tel:${phone}`); };
  
  const confirmRespond = (id, status) => {
      handleRespond(id, status);
  };

  const handleRespond = async (id, status) => {
      try {
          await axios.put(`${API_URL}/requests/status/${id}`, { status });
          setRequests(prev => prev.filter(r => r.id !== id));
          setAlertConfig({ visible: true, title: "Success", message: "Status updated" });
      } catch(e) { console.error(e); }
  };

  // --- FILTERING ---
  const filteredMarketPrices = useMemo(() => {
    return marketPrices.filter(item => {
      const matchesSearch = item.cropName.toLowerCase().includes(searchText.toLowerCase()) || 
                            item.marketName.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesCategory = true;
      if (activeFilter !== 'All') {
          const name = item.cropName.toLowerCase();
          if (activeFilter === 'Vegetables') matchesCategory = ['potato','onion','tomato','cabbage','brinjal','cauliflower'].some(k=>name.includes(k));
          else if (activeFilter === 'Fruits') matchesCategory = ['apple','banana','mango','orange','grape'].some(k=>name.includes(k));
          else if (activeFilter === 'Grains') matchesCategory = ['rice','wheat','maize','barley'].some(k=>name.includes(k));
          else if (activeFilter === 'Spices') matchesCategory = ['chilli','turmeric','ginger','garlic'].some(k=>name.includes(k));
      }
      return matchesSearch && matchesCategory;
    });
  }, [marketPrices, searchText, activeFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => req.crop.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [requests, searchText]);

  const filters = ['All', 'Vegetables', 'Fruits', 'Grains', 'Spices'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onConfirm={() => setAlertConfig({...alertConfig, visible: false})} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Rates</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput 
            placeholder="Search Mandi or Crop..." 
            placeholderTextColor="#9CA3AF" 
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
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

        {/* --- SECTION HEADER --- */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>Live Mandi Prices</Text>
          </View>
          <TouchableOpacity onPress={handleForceSync} disabled={syncing}>
            {syncing ? <ActivityIndicator size="small" color="#16A34A" /> : <Text style={styles.viewMapText}>Refresh</Text>}
          </TouchableOpacity>
        </View>

        {/* --- CONTROLS ROW: Limit & Weight Calculator --- */}
        <View style={styles.controlsRow}>
            {/* Limit Selector */}
            <View style={styles.limitContainer}>
                <Text style={styles.controlLabel}>Load:</Text>
                {[10, 50, 100].map(limit => (
                    <TouchableOpacity 
                        key={limit} 
                        style={[styles.limitBtn, priceLimit === limit && styles.activeLimitBtn]}
                        onPress={() => handleLimitChange(limit)}
                    >
                        <Text style={[styles.limitText, priceLimit === limit && styles.activeLimitText]}>{limit}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Weight Calculator Input */}
            <View style={styles.calcContainer}>
                <Calculator size={14} color="#64748B" style={{marginRight: 6}} />
                <Text style={styles.controlLabel}>Qty:</Text>
                <TextInput 
                    style={styles.calcInput}
                    value={calcWeight}
                    onChangeText={setCalcWeight}
                    keyboardType="numeric"
                    placeholder="100"
                />
                <Text style={styles.limitText}>kg</Text>
            </View>
        </View>
        
        {/* --- PRICE LIST --- */}
        <View style={styles.fixedHeightContainer}>
            {marketLoading ? (
                <View style={styles.center}><ActivityIndicator color="#16A34A" /><Text style={{color:'#94A3B8'}}>Loading prices...</Text></View>
            ) : filteredMarketPrices.length === 0 ? (
                <View style={styles.center}><Text style={{color:'#94A3B8'}}>No data available.</Text></View>
            ) : (
                <ScrollView nestedScrollEnabled={true}>
                    {filteredMarketPrices.map((item) => {
                        // Dynamic Calculation based on KG
                        const inputKg = parseFloat(calcWeight) || 100;
                        const calculatedPrice = item.price * inputKg;

                        return (
                            <View key={item.id} style={styles.priceCard}>
                                <View style={styles.priceLeft}>
                                    <View style={styles.emojiBox}>
                                        <Text style={{ fontSize: 24 }}>
                                            {getCropIcon(item.cropName)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.cardCropName}>{item.cropName}</Text>
                                        <Text style={styles.mandiLoc}>{item.marketName}</Text>
                                    </View>
                                </View>
                                <View style={styles.priceRight}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text style={[styles.priceValue, item.trend === 'down' && { color: '#EF4444' }]}>
                                            ₹{calculatedPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </Text>
                                        {item.trend === 'up' ? <TrendingUp size={16} color="#16A34A" style={{ marginLeft: 4 }} /> : 
                                         item.trend === 'down' ? <TrendingDown size={16} color="#EF4444" style={{ marginLeft: 4 }} /> : 
                                         <Minus size={16} color="#94A3B8" style={{ marginLeft: 4 }} />}
                                    </View>
                                    
                                    <Text style={styles.perQuintal}>
                                        for {inputKg} kg
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>

        {/* --- SECTION 2: BUYER REQUESTS --- */}
        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <Text style={styles.sectionTitle}>Active Buyer Requests</Text>
        </View>
        
        {/* REQUEST CARDS */}
        {filteredRequests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              {/* Header: Avatar + Name + Offer Badge */}
              <View style={styles.reqHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {req.buyer.profileImage ? (
                          <Image 
                            source={{ uri: req.buyer.profileImage }} 
                            style={styles.buyerAvatarImg} 
                          />
                      ) : (
                          <View style={[styles.buyerAvatarImg, {justifyContent:'center', alignItems:'center', backgroundColor:'#DCFCE7'}]}>
                              <Store size={20} color="#16A34A" />
                          </View>
                      )}
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.buyerName}>{req.buyer.businessName || req.buyer.name}</Text>
                        <Text style={styles.ratingText}>{req.buyer.phone}</Text>
                      </View>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>OFFER</Text>
                  </View>
              </View>

              {/* Body: Crop Image + Details */}
              <View style={styles.reqBody}>
                  <Image 
                    source={{ uri: req.crop.imageUrl || 'https://via.placeholder.com/60' }} 
                    style={styles.reqImage} 
                  />
                  <View style={styles.reqDetails}>
                    <Text style={styles.reqCropName}>{req.crop.name}</Text>
                    <Text style={styles.reqQuantity}>Qty: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{req.quantity} {req.crop.quantityUnit || 'kg'}</Text></Text>
                    <Text style={styles.reqOffer}>Offer: <Text style={{ fontWeight: 'bold', color: '#16A34A' }}>₹{req.offerPrice}/kg</Text></Text>
                  </View>
              </View>

              {/* Actions: Reject, Accept, Call */}
              <View style={styles.reqActions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmRespond(req.id, 'REJECTED')}>
                      <XIcon size={20} color="#EF4444" />
                      <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => confirmRespond(req.id, 'ACCEPTED')}>
                      <Check size={20} color="#FFF" />
                      <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(req.buyer.phone)}>
                      <Phone size={20} color="#16A34A" />
                  </TouchableOpacity>
              </View>
            </View>
        ))}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  searchWrapper: { paddingHorizontal: 20, marginVertical: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  
  filterScroll: { paddingLeft: 20, marginBottom: 25 },
  filterChip: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
  activeFilterChip: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeFilterText: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F87171', marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  viewMapText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },

  // Controls
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  limitContainer: { flexDirection: 'row', alignItems: 'center' },
  controlLabel: { color: '#64748B', fontSize: 12, marginRight: 6, fontWeight: '600' },
  limitBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 4, backgroundColor: '#FFF' },
  activeLimitBtn: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  limitText: { fontSize: 12, color: '#64748B' },
  activeLimitText: { color: '#FFF', fontWeight: 'bold' },

  calcContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  calcInput: { width: 40, paddingVertical: 0, fontSize: 14, fontWeight: 'bold', color: '#0F172A', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginRight: 4 },

  // Cards
  fixedHeightContainer: { 
    height: 320, 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    overflow: 'hidden' 
  },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  priceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emojiBox: { width: 48, height: 48, backgroundColor: '#FFF7ED', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardCropName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  mandiLoc: { fontSize: 12, color: '#94A3B8' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#16A34A' },
  perQuintal: { fontSize: 11, color: '#94A3B8', textAlign: 'right' },
  priceRight: { alignItems: 'flex-end', marginLeft: 10 },

  // Request Card Styles
  requestCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  buyerAvatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  buyerName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  ratingText: { fontSize: 12, color: '#64748B' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#DCFCE7' },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#16A34A' },
  
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
  acceptText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },
  callBtn: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
});

export default FarmerMarketScreen;