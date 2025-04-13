import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform, PermissionsAndroid, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PaymentConfirmationModal, InsufficientBalanceModal } from '../components/PaymentModals';
import SuccessModal from '../components/SuccessModal';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';

const OrderScreen = ({ navigation, route }) => {
  const { designData, isCustomize } = route.params;
  //console.log(isCustomize);

  const [customImages, setCustomImages] = useState([]);
  const [description, setDescription] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { balance, updateBalance, addTransaction } = useWallet();

  useEffect(() => {
    if (!designData) {
      Alert.alert(
        'Error',
        'Design data is missing. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [designData]);

  if (!designData) {
    return null;
  }

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage to upload photos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"  
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to upload photos',
          [{ text: 'OK' }]
        );
        return;
      }

      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setCustomImages(prevImages => [...prevImages, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    setCustomImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Check if wallet has enough balance
    if (balance >= designData.totalPrice) {
      setShowPaymentModal(true);
    } else {
      setShowInsufficientModal(true);
    }
  };

  const handlePaymentConfirm = async () => {
    try {
      console.log('Starting payment confirmation process...');
      
      // First, process the payment
      updateBalance(-designData.totalPrice);
      console.log('Payment processed, balance updated');
      
      // Add transaction to history
      addTransaction({
        type: 'payment',
        amount: -designData.totalPrice,
        description: `Thanh toán thiết kế ${designData.name}${isCustomize ? ' (Tùy chỉnh)' : ''}`,
      });
      console.log('Transaction added to history');

      // Prepare request body based on isCustomize
      const requestBody = {
        userId: "0d3b359a-8d3c-40dd-9c5a-52b27142c9b2",
        designIdeaId: designData.id,
        address: "HCM",
        cusPhone: "0365552663",
        isCustom: isCustomize,
        designPrice: designData.designPrice,
        materialPrice: designData.materialPrice,
        totalCost: designData.totalPrice
      };

      // Add custom fields only if isCustomize is true
      if (isCustomize) {
        requestBody.length = Number(length) || 0;
        requestBody.width = Number(width) || 0;
        requestBody.description = description || "Custom design request";
        requestBody.image = {
          imageUrl: designData.image?.imageUrl || "string",
          image2: designData.image?.image2 || "string",
          image3: designData.image?.image3 || "string"
        };
      }

      console.log('Creating order with data:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post('http://10.0.2.2:8080/api/serviceorder', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Order creation response:', response);

      if (response.status === 200 || response.status === 201) {
        console.log('Order created successfully');
        setShowPaymentModal(false);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error in payment/order process:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      // If order creation fails, refund the payment
      updateBalance(designData.totalPrice);
      
      Alert.alert(
        'Lỗi',
        `Không thể tạo đơn hàng: ${error.response?.data?.message || error.message}. Số tiền đã được hoàn lại.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleTopUp = () => {
    setShowInsufficientModal(false);
    navigation.navigate('Account', {
      screen: 'Profile',
      params: {
        screen: 'TopUp'
      }
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Home');
  };

  const handleViewOrders = () => {
    setShowSuccessModal(false);
    navigation.navigate('Account', {
      screen: 'ServiceOrdersTab',
      params: {
        screen: 'ServiceOrders',
        initial: false
      }
    });
  };

  const InfoRow = ({ icon, text }) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color="#666" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
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
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="account" text="W20" />
            <InfoRow icon="phone" text="0365552663" />
            <InfoRow icon="map-marker" text="HCM" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thiết kế</Text>
          <View style={styles.infoContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tên thiết kế</Text>
              <Text style={styles.priceAmount}>{designData.name}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Loại đơn hàng</Text>
              <Text style={styles.priceAmount}>{isCustomize ? 'Tùy chỉnh' : 'Mua trực tiếp'}</Text>
            </View>
          </View>
        </View>

        {isCustomize && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin tùy chỉnh</Text>
            <View style={styles.infoContainer}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Chiều dài (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={length}
                  onChangeText={setLength}
                  keyboardType="numeric"
                  placeholder="Nhập chiều dài"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Chiều rộng (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="numeric"
                  placeholder="Nhập chiều rộng"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Mô tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Nhập mô tả chi tiết"
                />
              </View>
              <View style={styles.imageUploadSection}>
                <Text style={styles.inputLabel}>Hình ảnh tùy chỉnh</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Icon name="camera-plus" size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Thêm hình ảnh</Text>
                </TouchableOpacity>
                {customImages.length > 0 && (
                  <View style={styles.imagePreviewContainer}>
                    {customImages.map((image, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Icon name="close-circle" size={24} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá thiết kế</Text>
              <Text style={styles.priceAmount}>{designData.designPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá vật liệu</Text>
              <Text style={styles.priceAmount}>{designData.materialPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={[styles.priceLabel, styles.totalLabel]}>Tổng cộng</Text>
              <Text style={[styles.priceAmount, styles.totalAmount]}>
                {designData.totalPrice.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={designData.totalPrice}
        onConfirm={handlePaymentConfirm}
      />

      <InsufficientBalanceModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        required={designData.totalPrice}
        balance={balance}
        onTopUp={handleTopUp}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        onViewOrders={handleViewOrders}
      />
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageUploadSection: {
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

export default OrderScreen;