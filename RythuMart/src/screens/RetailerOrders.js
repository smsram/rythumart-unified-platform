import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  StatusBar 
} from 'react-native';
import { Phone, Bell } from 'lucide-react-native';

const RetailerOrders = () => {
  const [activeTab, setActiveTab] = useState('Active');

  const orders = [
    {
      id: 'ORD-4829',
      status: 'CONFIRMED',
      statusColor: '#DCFCE7', // Light Green
      statusText: '#16A34A',
      name: 'Organic Tomatoes - 100kg',
      farmer: 'Rajesh Kumar',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
    },
    {
      id: 'ORD-4752',
      status: 'CONFIRMED',
      statusColor: '#DCFCE7',
      statusText: '#16A34A',
      name: 'Russet Potatoes - 250kg',
      farmer: 'Anita Devi',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
    },
    {
      id: 'ORD-4691',
      status: 'IN TRANSIT',
      statusColor: '#FEF3C7', // Light Orange
      statusText: '#D97706',
      name: 'Bell Peppers - 50kg',
      farmer: 'Samuel P.',
      image: 'https://images.unsplash.com/photo-1563565375-f3fdf5dbc240?auto=format&fit=crop&q=80&w=100',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={24} color="#1F2937" />
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      {/* --- Tabs --- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Active' && styles.activeTabBtn]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Past' && styles.activeTabBtn]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past Orders</Text>
        </TouchableOpacity>
      </View>

      {/* --- Orders List --- */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {orders.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                <Text style={[styles.statusText, { color: item.statusText }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Image source={{ uri: item.image }} style={styles.prodImg} />
              <View style={styles.info}>
                <Text style={styles.prodName}>{item.name}</Text>
                <Text style={styles.farmer}>Farmer: {item.farmer}</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.trackBtn}>
                <Text style={styles.trackText}>Track Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <Phone size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.callText}>Call Farmer</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  iconBtn: { position: 'relative', padding: 4 },
  redDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', borderWidth: 1, borderColor: '#F8F9FA' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#0F172A' },

  card: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  orderId: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  cardBody: { flexDirection: 'row', marginBottom: 20 },
  prodImg: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  info: { flex: 1, justifyContent: 'center' },
  prodName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  farmer: { fontSize: 13, color: '#64748B', marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: 10 },
  trackBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  trackText: { color: '#0F172A', fontWeight: 'bold', fontSize: 14 },
  callBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 10 },
  callText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});

export default RetailerOrders;