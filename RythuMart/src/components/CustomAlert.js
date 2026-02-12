import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  cancelText = "Cancel", 
  confirmText = "OK",
  singleButton = false // If true, hides the Cancel button
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          
          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.btnRow}>
            
            {!singleButton && (
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.confirmBtn, singleButton && { width: '100%' }]} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: width - 60,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center'
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B'
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    elevation: 2
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF'
  }
});

export default CustomAlert;