import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar, Linking, ActivityIndicator, RefreshControl, Modal 
} from 'react-native';
import { Phone, Bell, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Star, X } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_URL } from '../config/api';
import CustomAlert from '../components/CustomAlert';

const RetailerOrders = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  // --- RATING STATE ---
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [starCount, setStarCount] = useState(5);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // --- 1. Load Data ---
  useEffect(() => { loadUserData(); }, []);

  useFocusEffect(
    useCallback(() => { if (user) fetchOrders(user.id); }, [user])
  );

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchOrders(parsedUser.id);
    }
  };

  const fetchOrders = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/orders/buyer/${userId}`);
      setOrders(res.data);
    } catch (error) { console.error("Orders Fetch Error:", error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (user) fetchOrders(user.id);
  };

  // --- 2. Action Handlers ---

  const handleUpdateStatus = async (order, newStatus) => {
    setAlertConfig({
        visible: true,
        title: newStatus === 'DELIVERED' ? 'Confirm Delivery' : 'Cancel Order',
        message: newStatus === 'DELIVERED' 
            ? "Has this order arrived safely?" 
            : "Are you sure you want to cancel?",
        showCancel: true,
        onConfirm: async () => {
            try {
                // Optimistic Update
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                setAlertConfig(prev => ({ ...prev, visible: false }));

                await axios.put(`${API_URL}/orders/${order.id}/status`, { status: newStatus });
                
                // IF DELIVERED -> OPEN RATING MODAL
                if (newStatus === 'DELIVERED') {
                    setTimeout(() => {
                        setSelectedOrderForRating(order);
                        setStarCount(5); // Reset stars
                        setRatingModalVisible(true);
                    }, 500);
                } else {
                    setTimeout(() => setAlertConfig({ visible: true, title: "Cancelled", message: "Order cancelled." }), 500);
                }

            } catch (err) {
                setAlertConfig({ visible: true, title: "Error", message: "Failed to update status." });
                if(user) fetchOrders(user.id); 
            }
        }
    });
  };

  const submitRating = async () => {
    if (!selectedOrderForRating) return;
    setRatingSubmitting(true);
    
    try {
        await axios.post(`${API_URL}/ratings/add`, {
            reviewerId: user.id,
            targetId: selectedOrderForRating.sellerId, // Farmer ID
            rating: starCount
        });
        
        setRatingModalVisible(false);
        setAlertConfig({ visible: true, title: "Thank You!", message: "Your rating has been submitted." });
        
    } catch (err) {
        setAlertConfig({ visible: true, title: "Error", message: "Could not submit rating." });
    } finally {
        setRatingSubmitting(false);
    }
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else setAlertConfig({ visible: true, title: "Error", message: "Number unavailable" });
  };

  // --- 3. Render ---
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Active') return ['PENDING', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status);
    return ['DELIVERED', 'CANCELLED'].includes(order.status);
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return { bg: '#DCFCE7', text: '#16A34A', icon: CheckCircle };
      case 'IN_TRANSIT': return { bg: '#DBEAFE', text: '#2563EB', icon: Truck };
      case 'PENDING': return { bg: '#FEF3C7', text: '#D97706', icon: Clock };
      case 'DELIVERED': return { bg: '#F1F5F9', text: '#64748B', icon: Package };
      case 'CANCELLED': return { bg: '#FEE2E2', text: '#EF4444', icon: XCircle };
      default: return { bg: '#F1F5F9', text: '#64748B', icon: Package };
    }
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
            else setAlertConfig({ ...alertConfig, visible: false });
        }}
        onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      {/* --- RATING MODAL --- */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.ratingCard}>
                <View style={{alignItems:'flex-end', width:'100%'}}>
                    <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                        <X size={24} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
                
                <Image 
                    source={{ uri: selectedOrderForRating?.crop?.farmer?.profileImage || 'https://via.placeholder.com/60' }} 
                    style={styles.farmerAvatar} 
                />
                <Text style={styles.rateTitle}>Rate Farmer</Text>
                <Text style={styles.rateSub}>How was your experience with {selectedOrderForRating?.crop?.farmer?.name}?</Text>

                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setStarCount(star)}>
                            <Star 
                                size={32} 
                                color="#F59E0B" 
                                fill={star <= starCount ? "#F59E0B" : "transparent"} 
                                style={{marginHorizontal: 4}}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={submitRating} disabled={ratingSubmitting}>
                    {ratingSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Rating</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Header & Tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={24} color="#1F2937" />
          {orders.some(o => o.status === 'PENDING') && <View style={styles.redDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {['Active', 'Past'].map(tab => (
            <TouchableOpacity 
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
                <Package size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
            </View>
        ) : (
            filteredOrders.map((item) => {
                const style = getStatusStyle(item.status);
                const StatusIcon = style.icon;
                
                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.orderId}>#{item.displayId || item.id.slice(0, 8).toUpperCase()}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                        <StatusIcon size={12} color={style.text} style={{marginRight:4}} />
                        <Text style={[styles.statusText, { color: style.text }]}>{item.status}</Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Image source={{ uri: item.crop?.imageUrl || 'https://via.placeholder.com/100' }} style={styles.prodImg} />
                      <View style={styles.info}>
                        <Text style={styles.prodName}>{item.crop?.name || "Unknown"}</Text>
                        
                        {/* UPDATED: Unit Display Logic (Default to 'kg') */}
                        <Text style={styles.qty}>Qty: {item.quantity} {item.unit || 'kg'}</Text>
                        
                        <Text style={styles.farmer}>Farmer: {item.crop?.farmer?.name || "Verified"}</Text>
                        <Text style={styles.price}>Total: ₹{item.totalPrice.toLocaleString()}</Text>
                      </View>
                    </View>

                    {activeTab === 'Active' && (
                        <View>
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={styles.trackBtn} onPress={() => setAlertConfig({visible:true, title:"Tracking", message: "Live tracking simulation enabled."})}>
                                    <Text style={styles.trackText}>Track</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.crop?.farmer?.phone)}>
                                    <Phone size={18} color="#FFF" />
                                    <Text style={styles.callText}>Call</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.deliveryActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleUpdateStatus(item, 'CANCELLED')}>
                                    <Text style={styles.cancelText}>Not Delivered</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deliverBtn} onPress={() => handleUpdateStatus(item, 'DELIVERED')}>
                                    <CheckCircle size={16} color="#FFF" style={{marginRight:6}} />
                                    <Text style={styles.deliverText}>Mark Delivered</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                  </View>
                );
            })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  iconBtn: { position: 'relative', padding: 4 },
  redDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#F8F9FA' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#0F172A' },

  card: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  orderId: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', marginBottom: 20 },
  prodImg: { width: 80, height: 80, borderRadius: 10, marginRight: 15, backgroundColor: '#F3F4F6' },
  info: { flex: 1, justifyContent: 'center' },
  prodName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  qty: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  farmer: { fontSize: 12, color: '#475569', fontWeight:'600' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#16A34A', marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  trackBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  trackText: { color: '#0F172A', fontWeight: 'bold', fontSize: 14 },
  callBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 10 },
  callText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },

  deliveryActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  deliverBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  deliverText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 },

  /* Rating Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  ratingCard: { backgroundColor: '#FFF', width: '80%', borderRadius: 20, padding: 20, alignItems: 'center' },
  farmerAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  rateTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  rateSub: { textAlign: 'center', color: '#64748B', marginVertical: 10 },
  starsRow: { flexDirection: 'row', marginBottom: 20 },
  submitBtn: { backgroundColor: '#16A34A', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default RetailerOrders;