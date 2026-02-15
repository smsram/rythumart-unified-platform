import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Dimensions 
} from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import { X, Mic, StopCircle, Volume2 } from 'lucide-react-native';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

const VoiceAssistantModal = ({ visible, onClose, userId }) => {
  const [recording, setRecording] = useState();
  const [status, setStatus] = useState('idle'); // idle | recording | processing | playing
  const [messages, setMessages] = useState([]); // { text, sender }
  const [sound, setSound] = useState();

  // Cleanup on close
  useEffect(() => {
    if (!visible) {
      stopAndReset();
    }
  }, [visible]);

  const stopAndReset = async () => {
    if (sound) await sound.unloadAsync();
    if (recording) await recording.stopAndUnloadAsync();
    setMessages([]);
    setStatus('idle');
    setRecording(undefined);
    setSound(undefined);
  };

  // --- RECORDING LOGIC ---
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setStatus('recording');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setStatus('processing');
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(undefined);
    
    // Send to Backend
    sendAudio(uri);
  }

  // --- API LOGIC ---
  const sendAudio = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a', 
        name: 'voice.m4a',
      });
      formData.append('farmerId', userId);

      const res = await axios.post(`${API_URL}/assistant/chat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { userText, botText, audioBase64 } = res.data;

      // Update UI with text conversation
      setMessages([
        { text: userText, sender: 'user' },
        { text: botText, sender: 'bot' }
      ]);

      // Play Audio Response
      if (audioBase64) {
        setStatus('playing');
        const { sound } = await Audio.Sound.createAsync(
            { uri: audioBase64 }
        );
        setSound(sound);
        await sound.playAsync();
        
        // When finished playing, go back to idle
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                setStatus('idle');
            }
        });
      } else {
        setStatus('idle');
      }

    } catch (error) {
      console.error(error);
      setMessages([{ text: "Sorry, I couldn't connect to the server.", sender: 'bot' }]);
      setStatus('idle');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <View style={styles.botIcon}><Text style={{fontSize:20}}>🤖</Text></View>
                <Text style={styles.title}>AgriFlow Assistant</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={24} color="#64748B"/></TouchableOpacity>
          </View>

          {/* Chat Area */}
          <View style={styles.chatBox}>
            {messages.length === 0 && status === 'idle' && (
                <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderTitle}>Try asking...</Text>
                    <Text style={styles.placeholderText}>"How many orders are pending?"</Text>
                    <Text style={styles.placeholderText}>"Which of my crops are sold?"</Text>
                </View>
            )}
            
            {messages.map((m, i) => (
                <View key={i} style={[
                    styles.msgBubble, 
                    m.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}>
                    <Text style={[
                        styles.msgText, 
                        m.sender === 'user' ? styles.userText : styles.botText
                    ]}>{m.text}</Text>
                </View>
            ))}

            {status === 'processing' && (
                <View style={styles.loaderRow}>
                    <ActivityIndicator color="#16A34A" />
                    <Text style={styles.loaderText}>Processing...</Text>
                </View>
            )}
            
            {status === 'playing' && (
                <View style={styles.loaderRow}>
                    <Volume2 size={20} color="#16A34A" />
                    <Text style={styles.loaderText}>Speaking...</Text>
                </View>
            )}
          </View>

          {/* Microphone Control */}
          <View style={styles.footer}>
            {status === 'recording' ? (
                <View style={styles.recordingContainer}>
                    <Text style={styles.listeningText}>Listening...</Text>
                    <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                        <StopCircle size={32} color="#FFF" fill="#FFF" />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity 
                    style={[styles.micBtn, status !== 'idle' && styles.disabledBtn]} 
                    onPress={startRecording}
                    disabled={status !== 'idle'}
                >
                    <Mic size={32} color="#FFF" />
                </TouchableOpacity>
            )}
            {status === 'idle' && <Text style={styles.hintText}>Tap to Speak</Text>}
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '60%', padding: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  botIcon: { width: 40, height: 40, backgroundColor: '#DCFCE7', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  
  chatBox: { flex: 1, marginBottom: 20 },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.6 },
  placeholderTitle: { fontWeight: 'bold', marginBottom: 10, color: '#64748B' },
  placeholderText: { fontSize: 14, color: '#94A3B8', marginBottom: 5, fontStyle: 'italic' },

  msgBubble: { padding: 12, borderRadius: 12, maxWidth: '80%', marginBottom: 10 },
  userBubble: { backgroundColor: '#F1F5F9', alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  botBubble: { backgroundColor: '#DCFCE7', alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  msgText: { fontSize: 15 },
  userText: { color: '#0F172A' },
  botText: { color: '#14532D' },

  loaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 5 },
  loaderText: { marginLeft: 8, color: '#16A34A', fontWeight: '600' },

  footer: { alignItems: 'center', justifyContent: 'center', height: 100 },
  micBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  stopBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  
  recordingContainer: { alignItems: 'center' },
  listeningText: { marginBottom: 10, color: '#EF4444', fontWeight: 'bold', letterSpacing: 1 },
  hintText: { marginTop: 10, color: '#94A3B8', fontSize: 12 }
});

export default VoiceAssistantModal;