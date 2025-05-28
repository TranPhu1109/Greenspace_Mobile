import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import Address from '../components/Address';
import { api } from '../api/api';

const ShippingAddressScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New address form fields
  const [addressName, setAddressName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    if (!user?.id) {
      console.error('User ID not available');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/address/user/${user.id}`);
      setAddresses(response.data || response);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse address string from format "Street|Ward|District|Province"
  const parseAddress = (addressString) => {
    if (!addressString) return { street: '', ward: '', district: '', province: '' };
    
    const parts = addressString.split('|');
    return {
      street: parts[0] || '',
      ward: parts[1] || '',
      district: parts[2] || '',
      province: parts[3] || ''
    };
  };

  // Handle address change from Address component
  const handleAddressChange = (addressData) => {
    setAddressDetails(addressData);
  };

  // Add new address
  const addNewAddress = async () => {
    if (!addressName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên.');
      return;
    }
    
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }
    
    if (!streetAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ cụ thể.');
      return;
    }
    
    if (!addressDetails.wardName || !addressDetails.districtName || !addressDetails.provinceName) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ thông tin địa chỉ.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format address string as "Street|Ward|District|Province"
      const formattedAddress = `${streetAddress}|${addressDetails.wardName}|${addressDetails.districtName}|${addressDetails.provinceName}`;
      
      await api.post('/address', {
        userId: user.id,
        name: addressName,
        phone: phone,
        userAddress: formattedAddress
      });
      
      // Refresh address list
      fetchAddresses();
      
      // Reset form and close modal
      setAddressName('');
      setPhone('');
      setStreetAddress('');
      setAddressDetails({});
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Lỗi', 'Không thể thêm địa chỉ mới.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load addresses when component mounts
  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // New Address Modal
  const renderAddAddressModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm địa chỉ mới</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={addressName}
                onChangeText={setAddressName}
                placeholder="Nhập họ tên người nhận"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Địa chỉ chính xác</Text>
              <Address onAddressChange={handleAddressChange} />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Số nhà, tên đường</Text>
              <TextInput
                style={styles.input}
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="Nhập số nhà, tên đường"
                multiline
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={addNewAddress}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Lưu địa chỉ</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Address</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="map-marker-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào</Text>
            </View>
          ) : (
            addresses.map((address) => {
              const parsedAddress = parseAddress(address.userAddress);
              
              return (
                <View key={address.id} style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressTitle}>
                      <Text style={styles.addressName}>{address.name}</Text>
                    </View>
                    <TouchableOpacity>
                      <Icon name="pencil-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.phoneText}>{address.phone}</Text>
                  <Text style={styles.addressText}>{parsedAddress.street}</Text>
                  <Text style={styles.addressText}>
                    {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <TouchableOpacity 
        style={styles.addAddressButton}
        onPress={() => setShowAddModal(true)}
      >
        <Icon name="plus" size={24} color="#fff" />
        <Text style={styles.addAddressText}>Add New Address</Text>
      </TouchableOpacity>
      
      {renderAddAddressModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  addAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 0,
    maxHeight: '80%',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#b0c4de',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShippingAddressScreen; 