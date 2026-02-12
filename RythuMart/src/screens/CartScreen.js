import React, { useState, useCallback } from 'react';
import { 
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_URL } from '../config/api';
import PaymentModal from '../components/PaymentModal';
import CustomAlert from '../components/CustomAlert';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Payment State
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const res = await axios.get(`${API_URL}/cart/${parsedUser.id}`);
        setCartItems(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---
  const updateQuantity = async (id, newQty) => {
    if (newQty < 1) return;
    // Optimistic Update
    setCartItems(prev => prev.map(item => item.id === id ? {...item, quantity: newQty} : item));
    try {
      await axios.put(`${API_URL}/cart/${id}`, { quantity: newQty });
    } catch(err) { console.error("Update qty failed"); }
  };

  const removeItem = async (id) => {
    Alert.alert("Remove Item", "Are you sure?", [
        { text: "Cancel" },
        { 
            text: "Remove", style: 'destructive', 
            onPress: async () => {
                setCartItems(prev => prev.filter(item => item.id !== id));
                await axios.delete(`${API_URL}/cart/${id}`);
            }
        }
    ]);
  };

  const handleCheckout = async (method) => {
    setPaymentVisible(false);
    setLoading(true);
    try {
        await axios.post(`${API_URL}/cart/checkout`, {
            buyerId: user.id,
            items: cartItems,
            paymentMethod: method
        });
        
        setCartItems([]); // Clear UI
        setAlertConfig({ 
            visible: true, 
            title: "Order Placed!", 
            message: "Your requests have been sent to the farmers." 
        });
    } catch (err) {
        setAlertConfig({ visible: true, title: "Error", message: "Checkout failed." });
    } finally {
        setLoading(false);
    }
  };

  // Calculate Total
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% fee
  const total = subtotal + tax;

  if (loading && cartItems.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A"/></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        singleButton={true}
        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      <PaymentModal 
        visible={paymentVisible}
        amount={total}
        onClose={() => setPaymentVisible(false)}
        onPay={handleCheckout}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart ({cartItems.length})</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
            <ShoppingCart size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Market')}>
                <Text style={styles.browseText}>Browse Market</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{paddingBottom: 200}} showsVerticalScrollIndicator={false}>
            {cartItems.map(item => (
                <View key={item.id} style={styles.card}>
                    <Image source={{ uri: item.crop.imageUrl }} style={styles.img} />
                    <View style={styles.info}>
                        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                            <Text style={styles.name}>{item.crop.name}</Text>
                            <TouchableOpacity onPress={() => removeItem(item.id)}>
                                <Trash2 size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.farmer}>Sold by: {item.crop.farmer.name}</Text>
                        <Text style={styles.price}>₹{item.price} <Text style={styles.unit}>/ {item.crop.unit?.replace('/','')}</Text></Text>
                        
                        <View style={styles.qtyRow}>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                                <Minus size={16} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                                <Plus size={16} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.itemTotal}>Total: ₹{(item.price * item.quantity).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billVal}>₹{subtotal.toLocaleString()}</Text>
            </View>
            <View style={[styles.billRow, {marginBottom: 15}]}>
                <Text style={styles.billLabel}>Platform Fee (5%)</Text>
                <Text style={styles.billVal}>₹{tax.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
                <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalVal}>₹{total.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => setPaymentVisible(true)}>
                    <Text style={styles.checkoutText}>Checkout</Text>
                </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 15 },
  browseBtn: { marginTop: 20, backgroundColor: '#16A34A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  browseText: { color: '#FFF', fontWeight: 'bold' },

  card: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 15, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  img: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  farmer: { fontSize: 12, color: '#64748B' },
  price: { fontSize: 14, fontWeight: 'bold', color: '#16A34A' },
  unit: { fontSize: 12, color: '#94A3B8', fontWeight: 'normal' },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 6 },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold', fontSize: 14 },
  itemTotal: { marginLeft: 'auto', fontSize: 14, fontWeight: 'bold', color: '#0F172A' },

  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { color: '#64748B', fontSize: 14 },
  billVal: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#64748B', fontSize: 12 },
  totalVal: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  checkoutBtn: { backgroundColor: '#16A34A', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default CartScreen;