import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { CreditCard, Landmark, Wallet, Check } from 'lucide-react-native';

const PaymentModal = ({ visible, amount, onClose, onPay }) => {
  const [method, setMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay(method); // Trigger the API call in parent
    }, 2000); // 2 second mock delay
  };

  const Option = ({ id, icon: Icon, label }) => (
    <TouchableOpacity 
      style={[styles.option, method === id && styles.selected]} 
      onPress={() => setMethod(id)}
    >
      <View style={{flexDirection:'row', alignItems:'center'}}>
        <Icon size={24} color={method === id ? '#16A34A' : '#64748B'} />
        <Text style={[styles.optText, method === id && {color:'#16A34A', fontWeight:'bold'}]}>{label}</Text>
      </View>
      {method === id && <Check size={20} color="#16A34A" />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Secure Payment</Text>
          <Text style={styles.amount}>₹{parseInt(amount).toLocaleString()}</Text>
          <Text style={styles.sub}>to AgriFlow Escrow (Refundable)</Text>

          <View style={{marginVertical: 20}}>
            <Option id="UPI" icon={Wallet} label="UPI / GPay / PhonePe" />
            <Option id="NET" icon={Landmark} label="Net Banking" />
            <Option id="CARD" icon={CreditCard} label="Credit / Debit Card" />
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={processing}>
            {processing ? <ActivityIndicator color="#FFF"/> : <Text style={styles.payText}>PAY NOW</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={{marginTop:15, alignItems:'center'}} onPress={onClose} disabled={processing}>
            <Text style={{color:'#94A3B8'}}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0F172A' },
  amount: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#16A34A', marginTop: 10 },
  sub: { textAlign: 'center', color: '#64748B', fontSize: 12, marginBottom: 10 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 },
  selected: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  optText: { marginLeft: 12, fontSize: 16, color: '#334155' },
  payBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center' },
  payText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});

export default PaymentModal;