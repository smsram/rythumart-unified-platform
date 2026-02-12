import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ActivityIndicator, 
  Image,
  ScrollView,
  Dimensions,
  Keyboard
} from 'react-native';
import { X, UploadCloud, Search, Crosshair } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import axios from 'axios';
import { API_URL } from '../config/api';
import CustomAlert from './CustomAlert';

const { width } = Dimensions.get('window');

const AddCropModal = ({ visible, onClose, onCropAdded, userId }) => {
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  
  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);

  // --- Location States ---
  const [locationName, setLocationName] = useState('');
  const [region, setRegion] = useState({
    latitude: 20.5937, // Default India Center
    longitude: 78.9629,
    latitudeDelta: 15,
    longitudeDelta: 15,
  });
  const [selectedCoords, setSelectedCoords] = useState(null);

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '', message: '', onConfirm: () => setAlertVisible(false),
  });

  const showAlert = (title, message, onConfirm = null) => {
    setAlertConfig({ title, message, onConfirm: onConfirm || (() => setAlertVisible(false)) });
    setAlertVisible(true);
  };

  // --- 1. Get Current Location on Open ---
  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Allow location access to tag your farm.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      updateLocation(latitude, longitude, true); 
    } catch (error) {
      console.log("Loc Error:", error);
    }
  };

  // --- 2. Update Map & Animate ---
  const updateLocation = async (lat, long, animate = true) => {
    const newRegion = {
      latitude: lat,
      longitude: long,
      latitudeDelta: 0.05, 
      longitudeDelta: 0.05,
    };

    setRegion(newRegion);
    setSelectedCoords({ latitude: lat, longitude: long });

    if (animate && mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }

    try {
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: long });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const city = addr.city || addr.subregion || addr.region;
        const state = addr.region || addr.country;
        const formattedAddress = `${city}, ${state}`; 
        setLocationName(formattedAddress);
      }
    } catch (e) {
      console.log("Geocode Error");
    }
  };

  // --- 3. Search Location ---
  const handleSearchLocation = async () => {
    if (!locationName) return;
    Keyboard.dismiss(); 
    
    try {
      const geocoded = await Location.geocodeAsync(locationName);
      if (geocoded.length > 0) {
        const { latitude, longitude } = geocoded[0];
        updateLocation(latitude, longitude, true); 
      } else {
        showAlert("Not Found", "Could not find that location. Try a major city name.");
      }
    } catch (e) {
      showAlert("Error", "Search failed.");
    }
  };

  // --- Pick Image ---
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert("Permission Required", "Need photos access.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // --- Submit Logic ---
  const handleAddCrop = async () => {
    if (!name || !price || !quantity || !locationName) {
      showAlert("Missing Fields", "Please fill all fields including location.");
      return;
    }
    if (!image) {
      showAlert("Image Required", "Please upload a photo.");
      return;
    }

    setLoading(true);
    try {
      // Upload Image
      const formData = new FormData();
      formData.append('image', { uri: image, name: 'crop.jpg', type: 'image/jpeg' });

      const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const payload = {
        name,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        quantityUnit: 'kg', // <--- CHANGED TO KG
        farmerId: userId,
        imageUrl: uploadRes.data.imageUrl,
        aiGrade: 'Grade A',
        qualityScore: 88,
        
        // Location Data
        location: locationName,
        latitude: selectedCoords?.latitude,
        longitude: selectedCoords?.longitude
      };

      await axios.post(`${API_URL}/crops/add`, payload);

      showAlert("Success", "Crop listed successfully!", () => {
        setAlertVisible(false);
        setImage(null);
        setName('');
        setPrice('');
        setQuantity('');
        setLocationName('');
        if(onCropAdded) onCropAdded(); 
        onClose();
      });

    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to list crop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        singleButton={true}
      />

      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Add New Harvest</Text>
              <TouchableOpacity onPress={onClose}><X size={24} color="#64748B" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              
              {/* Basic Inputs */}
              <Text style={styles.label}>Crop Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Teja Chilli" value={name} onChangeText={setName} />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                  {/* Updated Label to KG */}
                  <Text style={styles.label}>Price (₹/kg)</Text>
                  <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
                <View style={{flex: 1}}>
                  {/* Updated Label to KG */}
                  <Text style={styles.label}>Quantity (kg)</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                </View>
              </View>

              {/* --- LOCATION SECTION --- */}
              <Text style={styles.label}>Farm Location</Text>
              
              {/* Search Box */}
              <View style={styles.searchRow}>
                <TextInput 
                  style={[styles.input, {flex: 1, marginBottom: 0}]} 
                  placeholder="Search City (e.g. Guntur)" 
                  value={locationName} 
                  onChangeText={setLocationName} 
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearchLocation}>
                  <Search size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Map View */}
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={region}
                  onPress={(e) => updateLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude, true)}
                >
                  {selectedCoords && <Marker coordinate={selectedCoords} title="Farm Location" />}
                </MapView>
                
                {/* Re-center Button */}
                <TouchableOpacity style={styles.gpsBtn} onPress={getCurrentLocation}>
                  <Crosshair size={24} color="#16A34A" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Tap map or search to pin location.</Text>


              {/* Image Upload */}
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <>
                    <UploadCloud size={24} color="#16A34A" />
                    <Text style={styles.uploadText}>Upload Crop Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCrop} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>List Crop to Market</Text>}
              </TouchableOpacity>
              
              <View style={{height: 20}} />
            </ScrollView>

          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  form: { flexGrow: 0 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A', marginBottom: 16 },
  row: { flexDirection: 'row' },
  
  /* Location Styles */
  searchRow: { flexDirection: 'row', marginBottom: 12 },
  searchBtn: { backgroundColor: '#16A34A', width: 50, borderRadius: 12, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  map: { width: '100%', height: '100%' },
  gpsBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#FFF', padding: 8, borderRadius: 20, elevation: 4 },
  hint: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },

  uploadBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#16A34A', borderRadius: 12, height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4', marginVertical: 20, overflow: 'hidden' },
  uploadText: { marginTop: 8, color: '#16A34A', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default AddCropModal;