import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  StatusBar 
} from 'react-native';
import { 
  Store, 
  MapPin, 
  CreditCard, 
  FileText, 
  Globe, 
  LogOut, 
  ChevronRight, 
  BadgeCheck 
} from 'lucide-react-native';

const RetailerProfile = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* --- Main Profile Card --- */}
        <View style={styles.profileCard}>
          {/* Top Section: Info */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Store size={32} color="#16A34A" />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.businessName}>Siva Traders</Text>
              <View style={styles.verifiedRow}>
                <BadgeCheck size={16} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedText}>Verified Retailer • Guntur Market Yard</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bottom Section: Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TOTAL SPENT</Text>
              <Text style={styles.statValue}>₹1.2L</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ORDERS</Text>
              <Text style={styles.statValue}>15</Text>
            </View>
          </View>
        </View>

        {/* --- Settings List --- */}
        <View style={styles.settingsContainer}>
          
          {/* Item 1: Delivery Address */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#64748B" />
            </View>
            <Text style={styles.settingTitle}>Manage Delivery Addresses</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Item 2: Payments */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}>
              <CreditCard size={20} color="#64748B" />
            </View>
            <Text style={styles.settingTitle}>Payment Methods</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Item 3: GST */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}>
              <FileText size={20} color="#64748B" />
            </View>
            <Text style={styles.settingTitle}>Business GST Details</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Item 4: Language */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}>
              <Globe size={20} color="#64748B" />
            </View>
            <Text style={styles.settingTitle}>Language Settings</Text>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Item 5: Logout */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={() => navigation.navigate('StartScreen')}
          >
            <View style={styles.iconBox}>
              <LogOut size={20} color="#EF4444" />
            </View>
            <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Logout</Text>
            <ChevronRight size={20} color="#FECACA" />
          </TouchableOpacity>

        </View>

        {/* --- Version Footer --- */}
        <Text style={styles.footerText}>AgriFlow v2.4.1 (Retailer Edition)</Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  /* Header */
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20 
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7', // Light Green bg
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E'
  },
  profileText: { marginLeft: 16, flex: 1 },
  businessName: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  
  /* Stats Section */
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  verticalLine: { width: 1, height: 40, backgroundColor: '#F1F5F9' },

  /* Settings List */
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: { marginRight: 15 },
  settingTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#334155' },

  /* Footer */
  footerText: { textAlign: 'center', color: '#94A3B8', fontSize: 12 },
});

export default RetailerProfile;