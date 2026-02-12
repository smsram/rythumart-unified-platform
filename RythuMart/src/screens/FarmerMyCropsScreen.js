import React, { useState, useCallback } from 'react';
import { 
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { Eye, Gavel, CheckCircle, XCircle, Clock, PackageCheck } from 'lucide-react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config/api';

const FarmerMyCropsScreen = () => {
  const [activeTab, setActiveTab] = useState('Active'); // 'Active', 'Sold', 'Requests'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); 
  const [user, setUser] = useState(null);

  // --- Load Data ---
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (!userData) return;
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          let url = '';
          if (activeTab === 'Requests') {
             url = `${API_URL}/requests/history/${parsedUser.id}`;
          } else {
             url = `${API_URL}/crops/farmer/${parsedUser.id}`;
          }

          const res = await axios.get(url);
          
          if (activeTab === 'Requests') {
            setData(res.data);
          } else {
            // Filter Crops
            const filtered = res.data.filter(item => 
              activeTab === 'Active' ? item.status === 'ACTIVE' : item.status === 'SOLD'
            );
            setData(filtered);
          }

        } catch (err) {
          console.error("Data Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [activeTab])
  );

  // --- Mark as Sold ---
  const handleMarkSold = async (id) => {
    try {
      await axios.put(`${API_URL}/crops/sold/${id}`);
      Alert.alert("Success", "Crop marked as Sold!");
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      Alert.alert("Error", "Could not update status");
    }
  };

  // --- Helper to determine Status UI for History ---
  const getHistoryStatusUI = (item) => {
    // 1. Rejected at Request Stage
    if (item.status === 'REJECTED') {
        return { text: 'Request Rejected', color: '#EF4444', icon: XCircle, bg: '#FEF2F2' };
    }
    
    // 2. Accepted - Check Order Status
    const orderStatus = item.orderStatus || 'CONFIRMED';
    
    if (orderStatus === 'DELIVERED') {
        return { text: 'Deal Completed', color: '#16A34A', icon: PackageCheck, bg: '#DCFCE7' };
    } else if (orderStatus === 'CANCELLED') {
        return { text: 'Order Cancelled', color: '#EF4444', icon: XCircle, bg: '#FEF2F2' };
    } else {
        return { text: 'Deal In Progress', color: '#F59E0B', icon: Clock, bg: '#FEF3C7' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.logoBox}><Text style={{fontSize:18}}>🍃</Text></View>
          <Text style={styles.headerTitle}>My Listings</Text>
        </View>
        {/* REMOVED PLUS ICON HERE */}
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabContainer}>
        {['Active', 'Sold', 'Requests'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'Requests' ? 'History' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- CONTENT LIST --- */}
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <ActivityIndicator size="large" color="#16A34A" style={{marginTop: 50}} />
        ) : data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{color: '#94A3B8'}}>No items found in {activeTab}.</Text>
          </View>
        ) : (
          data.map((item) => {
            
            // --- 1. REQUEST HISTORY CARD ---
            if (activeTab === 'Requests') {
              const cropImg = item.crop?.imageUrl || 'https://via.placeholder.com/50';
              const cropName = item.crop?.name || 'Unknown Crop';
              const buyerName = item.buyer?.businessName || item.buyer?.name || 'Unknown Buyer';
              const buyerPhone = item.buyer?.phone || '';
              
              const statusUI = getHistoryStatusUI(item);
              const StatusIcon = statusUI.icon;

              return (
                <View key={item.id} style={styles.reqCard}>
                  <View style={[styles.reqHeader, { backgroundColor: statusUI.bg }]}>
                    <Text style={[styles.reqTitle, { color: statusUI.color }]}>
                      {statusUI.text}
                    </Text>
                    <StatusIcon size={18} color={statusUI.color} />
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16, paddingBottom: 16}}>
                    <Image source={{ uri: cropImg }} style={styles.smallImg} />
                    <View style={{marginLeft: 12}}>
                      <Text style={styles.cropName}>{cropName}</Text>
                      <Text style={styles.qty}>Buyer: <Text style={{fontWeight:'bold', color:'#334155'}}>{buyerName}</Text></Text>
                      <Text style={styles.qty}>Phone: {buyerPhone}</Text>
                    </View>
                  </View>
                </View>
              );
            }

            // --- 2. CROP CARD (Active/Sold) ---
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.cardImg} />
                  <View style={styles.cardInfo}>
                    <View style={{flexDirection:'row', flexWrap:'wrap', alignItems:'center'}}>
                        <Text style={styles.cropName}>{item.name} </Text>
                        <Text style={styles.price}>₹{item.price}<Text style={styles.unit}>/{item.quantityUnit}</Text></Text>
                    </View>
                    <Text style={styles.qty}>Qty: {item.quantity} {item.quantityUnit}</Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}><Eye size={14} color="#94A3B8" /><Text style={styles.statText}>{item.views || 0} views</Text></View>
                      <View style={styles.statItem}><Gavel size={14} color="#94A3B8" /><Text style={styles.statText}>{item.bids || 0} bids</Text></View>
                    </View>
                  </View>
                </View>

                {/* Active Actions */}
                {activeTab === 'Active' && (
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.soldBtn} onPress={() => handleMarkSold(item.id)}>
                        <Text style={styles.soldBtnText}>Mark as Sold</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Sold Tag */}
                {activeTab === 'Sold' && (
                    <View style={styles.soldTag}>
                        <CheckCircle size={16} color="#FFF" />
                        <Text style={{color:'#FFF', fontWeight:'bold', marginLeft:5}}>SOLD OUT</Text>
                    </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      
      {/* REMOVED FAB */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 15,
    backgroundColor: '#fff'
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 32, height: 32, backgroundColor: '#16A34A', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#16A34A' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 20, marginTop: 10 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#16A34A', fontWeight: 'bold' },
  
  // Cards
  card: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  cardImg: { width: 80, height: 80, borderRadius: 12, marginRight: 15, backgroundColor: '#F1F5F9' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cropName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#16A34A' },
  unit: { fontSize: 12, color: '#94A3B8', fontWeight: 'normal' },
  qty: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  statText: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#FFF' },
  editBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  soldBtn: { flex: 1.5, paddingVertical: 10, borderRadius: 8, backgroundColor: '#16A34A', alignItems: 'center' },
  soldBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  soldTag: { marginTop: 5, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  // Request History Card
  reqCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  reqTitle: { fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
  smallImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#E2E8F0' },

  emptyState: { alignItems: 'center', marginTop: 40 }
});

export default FarmerMyCropsScreen;