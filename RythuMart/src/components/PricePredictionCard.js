import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, TrendingUp, TrendingDown, Sparkles, History } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const PricePredictionCard = ({ 
  selectedCrop, 
  weight, 
  setWeight, 
  onOpenSearch, 
  onPredict,     
  loading, 
  historyData,   
  forecastData   
}) => {
  const [activeTab, setActiveTab] = useState('history'); 
  const [showResults, setShowResults] = useState(false);
  const [focusedDayIndex, setFocusedDayIndex] = useState(6); 

  useEffect(() => {
    const data = activeTab === 'history' ? historyData : forecastData;
    if (data && data.length > 0) {
        setFocusedDayIndex(activeTab === 'history' ? data.length - 1 : 0);
    }
  }, [activeTab, historyData, forecastData]);

  const handlePredictPress = () => {
    setShowResults(true);
    setActiveTab('forecast'); 
    onPredict();
  };

  const currentData = activeTab === 'history' ? historyData : forecastData;

  const getSelectedDayPrice = () => {
    if (!currentData || currentData.length === 0) return 0;
    const data = currentData[focusedDayIndex];
    // Price is already per KG in the backend now
    return data ? data.price : 0;
  };

  const getCalculatedTotal = () => {
    const pricePerKg = getSelectedDayPrice();
    const userWeight = parseFloat(weight) || 0;
    
    // FIX: Simple multiplication since everything is in KG now
    return Math.floor(pricePerKg * userWeight);
  };

  const getTrendInfo = () => {
    if (!currentData || currentData.length < 2) return { text: "Analyzing market data...", isUp: true };
    
    const start = currentData[0].price;
    const end = currentData[currentData.length - 1].price;
    const diff = end - start;
    const percent = start !== 0 ? ((diff / start) * 100).toFixed(1) : 0;

    if (activeTab === 'history') {
        if (diff > 0) return { text: `Prices ROSE by ${percent}% this past week.`, isUp: true };
        if (diff < 0) return { text: `Prices FELL by ${Math.abs(percent)}% this past week.`, isUp: false };
        return { text: "Market has been stable this week.", isUp: true };
    } else {
        if (diff > 0) return { text: `Prices expected to RISE by ${percent}% next week.`, isUp: true };
        if (diff < 0) return { text: `Prices expected to DROP by ${Math.abs(percent)}% next week.`, isUp: false };
        return { text: "Market expected to remain stable.", isUp: true };
    }
  };

  const trendInfo = getTrendInfo();
  
  // --- CHART SCALING ---
  const allPrices = currentData?.map(d => d.price) || [];
  const localMax = allPrices.length ? Math.max(...allPrices) : 1;
  const localMin = allPrices.length ? Math.min(...allPrices) : 0;
  const visualMin = localMin * 0.90; 
  const range = localMax - visualMin || 1;

  return (
    <LinearGradient
      colors={['#16A34A', '#15803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* --- TOP TABS --- */}
      <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('history')}
          >
              <History size={14} color={activeTab === 'history' ? '#16A34A' : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Past 7 Days</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'forecast' && styles.activeTabBtn]} 
            onPress={() => { setShowResults(true); setActiveTab('forecast'); if(!forecastData.length) onPredict(); }}
          >
              <Sparkles size={14} color={activeTab === 'forecast' ? '#16A34A' : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.tabText, activeTab === 'forecast' && styles.activeTabText]}>Predict 7 Days</Text>
          </TouchableOpacity>
      </View>

      {/* --- INPUTS --- */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.inputBox} onPress={onOpenSearch}>
            <Text style={styles.label}>Crop</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={styles.valueText} numberOfLines={1}>{selectedCrop}</Text>
                <ChevronDown size={16} color="#FFF" />
            </View>
        </TouchableOpacity>

        <View style={styles.inputBox}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput 
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={styles.textInput}
                placeholder="100"
                placeholderTextColor="rgba(255,255,255,0.5)"
            />
        </View>
      </View>

      {/* --- PREDICT BUTTON --- */}
      {!showResults && !historyData.length && (
          <TouchableOpacity style={styles.predictBtn} onPress={handlePredictPress}>
              <Text style={styles.predictBtnText}>Analyze Market Trends</Text>
          </TouchableOpacity>
      )}

      {/* --- RESULTS SECTION --- */}
      {(showResults || historyData.length > 0) && (
        <View style={styles.resultContainer}>
            {loading ? (
                <View style={{padding: 40, alignItems:'center'}}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={{color:'rgba(255,255,255,0.7)', marginTop:10}}>Analyzing 1 Year of Data...</Text>
                </View>
            ) : (
                <>
                    {/* Price Display */}
                    <View style={styles.priceDisplay}>
                        <View>
                            <Text style={styles.totalLabel}>Estimated Value</Text>
                            <Text style={styles.bigPrice}>₹{getCalculatedTotal().toLocaleString()}</Text>
                        </View>
                        <View style={{alignItems:'flex-end'}}>
                            <Text style={styles.unitPriceLabel}>
                                {currentData[focusedDayIndex]?.day || 'Date'} Rate
                            </Text>
                            {/* FIX: Display unit as /kg */}
                            <Text style={styles.unitPriceVal}>₹{getSelectedDayPrice().toFixed(1)}/kg</Text>
                        </View>
                    </View>

                    {/* Chart */}
                    <View style={styles.chartContainer}>
                        {currentData?.map((data, i) => {
                            const normalized = (data.price - visualMin) / range;
                            const barHeight = 15 + (normalized * 85); 
                            const isFocused = i === focusedDayIndex;

                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={styles.barWrapper} 
                                    activeOpacity={0.8}
                                    onPress={() => setFocusedDayIndex(i)}
                                >
                                    {isFocused && (
                                        <View style={styles.bubble}><Text style={styles.bubbleText}>{Math.floor(data.price)}</Text></View>
                                    )}
                                    <View style={[styles.bar, { height: barHeight, backgroundColor: isFocused ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
                                    <Text style={[styles.barLabel, isFocused && {color:'#FFF', fontWeight:'bold'}]}>
                                        {data.day.slice(0,3)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Footer Trend */}
                    <View style={styles.footer}>
                        {trendInfo.isUp ? <TrendingUp size={18} color="#66FF99" /> : <TrendingDown size={18} color="#FF9999" />}
                        <Text style={[styles.footerText, { color: trendInfo.isUp ? '#FFF' : '#FFD9D9' }]}>{trendInfo.text}</Text>
                    </View>
                </>
            )}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, borderRadius: 24, padding: 20, shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, overflow:'hidden' },
  
  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#FFF' },
  tabText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  activeTabText: { color: '#16A34A', fontWeight: 'bold' },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  inputBox: { width: '48%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: 12 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginBottom: 4, textTransform:'uppercase' },
  valueText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  textInput: { color: '#FFF', fontSize: 16, fontWeight: 'bold', padding: 0 },
  
  predictBtn: { backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 5 },
  predictBtnText: { color: '#16A34A', fontWeight: 'bold', fontSize: 14 },

  resultContainer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  priceDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  totalLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  bigPrice: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  unitPriceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  unitPriceVal: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: 20, paddingHorizontal: 5 },
  barWrapper: { alignItems: 'center', width: width * 0.08, justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 4, minHeight: 6 },
  barLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 6 },
  
  bubble: { position: 'absolute', top: -30, backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  bubbleText: { color: '#16A34A', fontSize: 10, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: 12 },
  footerText: { fontSize: 12, flex: 1, fontWeight: '600', marginLeft: 8 },
});

export default PricePredictionCard;