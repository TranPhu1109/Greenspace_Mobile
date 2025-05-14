import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useWallet } from '../context/WalletContext';

const UserInfoScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const { refreshWallet } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [walletDataPrefetched, setWalletDataPrefetched] = useState(false);

  // Check authentication status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always reset the modal visibility based on authentication status
      // when the screen comes into focus
      setShowLoginModal(!isAuthenticated);
      
      // If authenticated, prefetch wallet data to improve navigation performance
      if (isAuthenticated && !walletDataPrefetched) {
        // Call refreshWallet but don't await it - let it run in background
        refreshWallet(false); // false means don't force refresh if data is recent
        setWalletDataPrefetched(true);
      }
    }, [isAuthenticated, walletDataPrefetched, refreshWallet])
  );

  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('Login', { returnTo: true });
  };

  // Close modal and navigate to the home tab instead of going back
  const handleDismiss = () => {
    setShowLoginModal(false);
    navigation.navigate('Home');
  };

  // Prefetch wallet data when user clicks the Wallet option
  const handleWalletPress = () => {
    // This is an additional optimization - start loading wallet data before navigation
    refreshWallet(false).then(() => {
      navigation.navigate('Wallet');
    }).catch(() => {
      // Even if there's an error, still navigate to the Wallet screen
      // The wallet screen will handle the error display
      navigation.navigate('Wallet');
    });
  };

  // Login Modal Component
  const LoginModal = () => (
    <Modal
      visible={showLoginModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss} // Use handleDismiss instead of navigation.goBack
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="account-lock-outline" size={60} color="#007AFF" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.modalMessage}>
            Bạn cần đăng nhập để xem thông tin tài khoản
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={handleDismiss} // Use handleDismiss instead of navigation.goBack
            >
              <Text style={styles.modalCancelButtonText}>Quay lại</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalLoginButton]} 
              onPress={navigateToLogin}
            >
              <Text style={styles.modalLoginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Always render the modal, but it will only be visible when showLoginModal is true */}
      <LoginModal />

      {isAuthenticated ? (
        <ScrollView>
          <View style={styles.profileHeader}>
            <Image
              source={require('../assets/images/avatar.jpg')}
              style={styles.avatar}
              defaultSource={require('../assets/images/avatar.jpg')}
            />
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.option}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Icon name="account-edit-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Cập nhật thông tin</Text>
              <Icon name="chevron-right" size={24} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option}
              onPress={() => navigation.navigate('ShippingAddress')}
            >
              <Icon name="map-marker-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Địa chỉ giao hàng</Text>
              <Icon name="chevron-right" size={24} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option}
              onPress={handleWalletPress}
            >
              <Icon name="wallet-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Ví</Text>
              <Icon name="chevron-right" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // Placeholder container when not authenticated
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#f1f2f6',
  },
  modalLoginButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  modalLoginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default UserInfoScreen; 