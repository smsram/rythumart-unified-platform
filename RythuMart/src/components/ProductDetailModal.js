import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Modal, 
  TextInput, Dimensions, Linking, StatusBar, Platform 
} from 'react-native';
import { 
  X, CheckCircle, Star, MessageSquare, Truck, Minus, Plus, Phone, ShoppingCart 
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width } = Dimensions.get('window');

const ProductDetailModal = ({ 
  visible, 
  onClose, 
  product, 
  onConfirmPurchase, // Triggers Payment Flow
  onAddToCart        // Triggers Add to Cart API
}) => {
  const [qty, setQty] = useState(0);
  const [manualQty, setManualQty] = useState('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
        setQty(product.quantity || 100);
        setManualQty((product.quantity || 100).toString());
    }
  }, [product]);

  // Handle Quantity Changes
  const handleQtyChange = (val) => {
    setManualQty(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) setQty(parsed);
  };

  const incrementQty = () => {
    const newQty = qty + 1;
    setQty(newQty);
    setManualQty(newQty.toString());
  };

  const decrementQty = () => {
    const newQty = Math.max(1, qty - 1);
    setQty(newQty);
    setManualQty(newQty.toString());
  };

  const handleCall = () => {
    if (product?.farmer?.phone) Linking.openURL(`tel:${product.farmer.phone}`);
  };

  if (!product) return null;

  const totalPrice = (product.price * qty).toFixed(0);

  // Safe Image Handling
  const heroImage = product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://via.placeholder.com/400' };
  const farmerImage = product.farmer?.profileImage ? { uri: product.farmer.profileImage } : { uri: 'https://via.placeholder.com/50' };

  // Helper for AI Bars
  const QualityBar = ({ label, value, color }) => (
    <View style={{marginBottom: 12, width: '48%'}}>
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 4}}>
            <Text style={{fontSize: 11, color: '#64748B', fontWeight:'600'}}>{label}</Text>
            <Text style={{fontSize: 11, fontWeight:'bold', color: '#0F172A'}}>{value}%</Text>
        </View>
        <View style={{height: 6, backgroundColor: '#F1F5F9', borderRadius: 3}}>
            <View style={{width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: 3}} />
        </View>
    </View>
  );

  return (
    <Modal 
        visible={visible} 
        animationType="slide" 
        transparent={false} 
        statusBarTranslucent={true} 
        onRequestClose={onClose}
    >
        <View style={styles.container}>
            {/* Transparent Status Bar for Immersive Image */}
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* --- Hero Image --- */}
            <View style={{height: 320, width: '100%', position: 'relative'}}>
                <Image 
                    source={heroImage} 
                    style={{width: '100%', height: '100%', resizeMode: 'cover'}} 
                />
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <X size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.imageOverlay} />
            </View>

            <ScrollView 
                style={styles.scrollContent} 
                contentContainerStyle={{padding: 24, paddingBottom: 140}} 
                showsVerticalScrollIndicator={false}
            >
                {/* Header Info */}
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 20}}>
                    <View style={{flex:1, paddingRight: 10}}>
                        <View style={styles.gradeTag}>
                            <Text style={styles.gradeText}>{product.aiGrade || "FRESH"}</Text>
                        </View>
                        <Text style={styles.title}>{product.name}</Text>
                        <Text style={styles.subTitle}>Heirloom Variety • Harvested 6h ago</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={styles.priceHeader}>₹{product.price}</Text>
                        <Text style={styles.unitHeader}>per {product.unit ? product.unit.replace('/','') : 'unit'}</Text>
                    </View>
                </View>

                {/* AI Quality Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.rowBetween}>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <CheckCircle size={18} color="#16A34A" style={{marginRight:6}}/>
                            <Text style={styles.sectionHeader}>AI Quality Analysis</Text>
                        </View>
                        <View style={styles.scanBadge}><Text style={styles.scanText}>Scanned Today</Text></View>
                    </View>
                    <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginTop: 15}}>
                        <QualityBar label="Ripeness" value={98} color="#22C55E" />
                        <QualityBar label="Blemish Free" value={95} color="#22C55E" />
                        <QualityBar label="Size Uniformity" value={92} color="#22C55E" />
                        <QualityBar label="Firmness" value={product.qualityScore || 88} color="#22C55E" />
                    </View>
                </View>

                {/* Producer Card */}
                <Text style={styles.sectionLabel}>Producer</Text>
                <View style={styles.producerCard}>
                    <Image source={farmerImage} style={styles.avatar} />
                    <View style={{flex:1, marginLeft: 12}}>
                        <Text style={styles.prodName}>{product.farmer?.name || "Verified Farmer"}</Text>
                        <Text style={styles.prodLoc}>{product.farmer?.location || "India"}</Text>
                        <View style={{flexDirection:'row', alignItems:'center', marginTop: 4}}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B"/>
                            <Text style={styles.rating}>
                                {product.farmer?.rating ? product.farmer.rating.toFixed(1) : 'New'} 
                                <Text style={{fontWeight: 'normal', color: '#94A3B8'}}> (Verified)</Text>
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.msgBtn} onPress={handleCall}>
                        <MessageSquare size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* Logistics Map */}
                <Text style={styles.sectionLabel}>Logistics & Location</Text>
                <View style={styles.mapCard}>
                    <MapView 
                        style={{width:'100%', height: 120}}
                        provider={PROVIDER_DEFAULT}
                        scrollEnabled={false}
                        initialRegion={{
                            latitude: product.latitude || 20.5937,
                            longitude: product.longitude || 78.9629,
                            latitudeDelta: 0.05, longitudeDelta: 0.05
                        }}
                    >
                        <Marker coordinate={{latitude: product.latitude || 20.5937, longitude: product.longitude || 78.9629}} />
                    </MapView>
                    <View style={styles.mapStats}>
                        <View><Text style={styles.msLabel}>PICKUP READY</Text><Text style={styles.msVal}>2 Hours</Text></View>
                        <View><Text style={styles.msLabel}>TRANSPORT</Text><Text style={[styles.msVal, {color:'#2563EB'}]}>Van / Truck</Text></View>
                        <View><Text style={styles.msLabel}>STOCK AVAIL.</Text><Text style={styles.msVal}>{product.quantity} {product.quantityUnit}</Text></View>
                    </View>
                </View>

                {/* Quantity Setter */}
                <Text style={styles.sectionLabel}>Set Quantity ({product.quantityUnit || 'Tons'})</Text>
                <View style={styles.qtyContainer}>
                    <View style={styles.qtyControl}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={decrementQty}><Minus size={20} color="#000"/></TouchableOpacity>
                        <TextInput 
                            value={manualQty} 
                            onChangeText={handleQtyChange} 
                            keyboardType="numeric"
                            style={styles.qtyInput} 
                        />
                        <TouchableOpacity style={styles.qtyBtn} onPress={incrementQty}><Plus size={20} color="#000"/></TouchableOpacity>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={styles.msLabel}>Total Cost</Text>
                        <Text style={{fontSize:18, fontWeight:'bold', color:'#16A34A'}}>₹{parseInt(totalPrice).toLocaleString()}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* --- Bottom Floating Bar --- */}
            <View style={styles.bottomBar}>
                {/* Price */}
                <View style={{flex: 1}}>
                    <Text style={{color:'#64748B', fontSize:12}}>Final Amount</Text>
                    <Text style={{fontSize:22, fontWeight:'bold', color:'#0F172A'}}>₹{parseInt(totalPrice).toLocaleString()}</Text>
                </View>

                {/* Actions Row */}
                <View style={{flexDirection: 'row', gap: 10}}>
                    
                    {/* 1. Call Button */}
                    <TouchableOpacity style={styles.iconBtnOutline} onPress={handleCall}>
                        <Phone size={22} color="#16A34A" />
                    </TouchableOpacity>

                    {/* 2. Add to Cart Button */}
                    <TouchableOpacity 
                        style={styles.iconBtnOutline} 
                        onPress={() => onAddToCart && onAddToCart({...product, selectedQty: qty, price: product.price})}
                    >
                        <ShoppingCart size={22} color="#16A34A" />
                    </TouchableOpacity>

                    {/* 3. Buy Now Button */}
                    <TouchableOpacity 
                        style={styles.confirmBtn} 
                        onPress={() => onConfirmPurchase({ ...product, selectedQty: qty, totalAmount: totalPrice })}
                    >
                        <Text style={styles.confirmText}>Buy Now</Text>
                        <Truck size={18} color="#FFF" style={{marginLeft:8}}/>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  
  closeBtn: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 40, 
    left: 20, 
    backgroundColor: '#FFF', 
    padding: 8, 
    borderRadius: 20, 
    zIndex: 10, 
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5
  },
  
  imageOverlay: { position: 'absolute', bottom: 0, height: 80, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' },
  
  scrollContent: { 
    marginTop: -30, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    backgroundColor: '#FFF',
    overflow: 'hidden'
  },
  
  /* Text Styles */
  gradeTag: { backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  gradeText: { color: '#16A34A', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  subTitle: { color: '#64748B', fontSize: 14, marginTop: 4 },
  priceHeader: { fontSize: 24, fontWeight: 'bold', color: '#16A34A' },
  unitHeader: { fontSize: 12, color: '#94A3B8' },

  /* Sections */
  sectionCard: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  scanBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scanText: { color: '#2563EB', fontSize: 10, fontWeight: 'bold' },

  sectionLabel: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: 25, marginBottom: 15 },
  
  producerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
  prodName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  prodLoc: { fontSize: 13, color: '#64748B' },
  rating: { fontSize: 14, fontWeight: 'bold', marginLeft: 4, color: '#0F172A' },
  msgBtn: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12 },

  mapCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', elevation: 2 },
  mapStats: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  msLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 4 },
  msVal: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },

  qtyContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 4 },
  qtyBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 8, elevation: 2 },
  qtyInput: { width: 70, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#0F172A' },

  /* Bottom Bar */
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 24, 
    paddingTop: 20, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  
  iconBtnOutline: { 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#16A34A', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F0FDF4'
  },
  confirmBtn: { 
    backgroundColor: '#16A34A', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12 
  },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});

export default ProductDetailModal;