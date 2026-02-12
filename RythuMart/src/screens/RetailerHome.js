import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, 
  StatusBar, Dimensions, ActivityIndicator, RefreshControl, Linking, Modal, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { Search, Bell, SlidersHorizontal, Phone, CheckCircle, X } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config/api';
import CustomAlert from '../components/CustomAlert';
import ProductDetailModal from '../components/ProductDetailModal';
import PaymentModal from '../components/PaymentModal';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 20;
const GAP = 15;
const CARD_WIDTH = (width - (CONTAINER_PADDING * 2) - GAP) / 2;

const RetailerHome = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  
  // Modals
  const [detailVisible, setDetailVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null); 

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const filters = ['All', 'Vegetables', 'Fruits', 'Grains', 'Spices'];

  useEffect(() => {
    loadUser();
    fetchMarketData();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchMarketData = async () => {
    try {
      const response = await axios.get(`${API_URL}/crops/market`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchMarketData(); };

  useEffect(() => {
    let result = products;
    if (activeFilter !== 'All') {
       result = result.filter(p => (p.category === activeFilter) || p.name.includes(activeFilter));
    }
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || p.farmer?.name?.toLowerCase().includes(lower));
    }
    setFilteredProducts(result);
  }, [searchText, activeFilter, products]);

  // --- ACTIONS ---

  const handleCardPress = (item) => {
    setSelectedProduct(item);
    setDetailVisible(true);
  };

  // 1. ADD TO CART LOGIC
  const handleAddToCart = async (data) => {
    if (!user) {
        setAlertConfig({ visible: true, title: "Login Required", message: "Please login to use cart." });
        return;
    }
    try {
        await axios.post(`${API_URL}/cart/add`, {
            buyerId: user.id,
            cropId: data.id,
            quantity: data.selectedQty,
            price: data.price
        });
        setAlertConfig({ visible: true, title: "Added to Cart", message: `${data.name} added successfully!` });
    } catch (err) {
        setAlertConfig({ visible: true, title: "Error", message: "Could not add to cart." });
    }
  };

  // 2. BUY NOW CLICKED (Opens Payment ON TOP of Detail)
  const onConfirmPurchase = (data) => {
    if (!user) {
        setAlertConfig({ visible: true, title: "Login Required", message: "Please login to buy." });
        return;
    }
    setCheckoutData(data);
    setPaymentVisible(true); 
  };

  // 3. PAYMENT COMPLETED
  const onPaymentComplete = async (method) => {
    setPaymentVisible(false); 
    
    try {
        await axios.post(`${API_URL}/requests/add`, {
            cropId: checkoutData.id,
            buyerId: user.id,
            offerPrice: checkoutData.price,
            quantity: checkoutData.selectedQty,
            totalAmount: checkoutData.totalAmount
        });
        
        setDetailVisible(false); 
        setAlertConfig({ 
            visible: true, 
            title: "Success!", 
            message: `Request sent to farmer via ${method}.` 
        });
    } catch (err) {
        setAlertConfig({ visible: true, title: "Transaction Error", message: "Please try again." });
    }
  };

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

      {/* --- Detail Modal --- */}
      <ProductDetailModal 
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        product={selectedProduct}
        onConfirmPurchase={onConfirmPurchase}
        onAddToCart={handleAddToCart}
      />

      {/* --- Payment Modal (Shows on top of Detail) --- */}
      <PaymentModal 
        visible={paymentVisible}
        amount={checkoutData?.totalAmount || '0'}
        onClose={() => setPaymentVisible(false)}
        onPay={onPaymentComplete}
      />

      {/* --- Main Content --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={24} color="#1F2937" />
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        stickyHeaderIndices={[1]} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search & Filter UI */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput placeholder="Search crops..." placeholderTextColor="#9CA3AF" style={styles.searchInput} value={searchText} onChangeText={setSearchText} />
          </View>
        </View>

        <View style={{ backgroundColor: '#F8F9FA' }}> 
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
            <TouchableOpacity style={styles.filterBtnActive}><SlidersHorizontal size={16} color="#FFF" style={{ marginRight: 6 }} /><Text style={styles.filterTextActive}>Sort</Text></TouchableOpacity>
            {filters.map((filter, index) => (
              <TouchableOpacity key={index} style={[styles.filterBtn, activeFilter === filter && styles.filterBtnSelected]} onPress={() => setActiveFilter(filter)}>
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextSelected]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>FRESH HARVESTS</Text>
          <Text style={styles.resultsCount}>{filteredProducts.length} Results</Text>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#16A34A" style={{marginTop: 50}} />
        ) : (
            <View style={styles.gridContainer}>
            {filteredProducts.map((item) => (
                <TouchableOpacity key={item.id} style={styles.card} onPress={() => handleCardPress(item)}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImg} />
                        {item.aiGrade && (
                            <View style={styles.gradeBadge}><CheckCircle size={10} color="#16A34A" style={{ marginRight: 4 }} /><Text style={styles.gradeText}>{item.aiGrade}</Text></View>
                        )}
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.farmerName} numberOfLines={1}>{item.farmer?.name || "Verified Farmer"}</Text>
                        
                        {/* UPDATED: Unit */}
                        <Text style={styles.price}>
                            ₹{item.price} <Text style={styles.unit}>/kg</Text>
                        </Text>
                        
                        <TouchableOpacity style={styles.buyBtn} onPress={() => handleCardPress(item)}>
                            <Text style={styles.buyBtnText}>View Deal</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            ))}
            </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  iconBtn: { position: 'relative', padding: 4 },
  redDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#F8F9FA' },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: '#0F172A' },
  filterScrollContainer: { paddingHorizontal: 20, paddingBottom: 10 },
  filterBtnActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterTextActive: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  filterBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnSelected: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  filterText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  filterTextSelected: { color: '#FFF' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  resultsTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', letterSpacing: 0.5 },
  resultsCount: { fontSize: 12, color: '#16A34A', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: CONTAINER_PADDING },
  card: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  imageContainer: { position: 'relative' },
  cardImg: { width: '100%', height: 130, resizeMode: 'cover', backgroundColor: '#F3F4F6' },
  gradeBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  gradeText: { fontSize: 10, fontWeight: 'bold', color: '#0F172A' },
  cardContent: { padding: 12 },
  prodName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 2 },
  farmerName: { fontSize: 11, color: '#64748B', marginBottom: 8 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  unit: { fontSize: 12, color: '#64748B', fontWeight: 'normal' },
  buyBtn: { backgroundColor: '#22C55E', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});

export default RetailerHome;