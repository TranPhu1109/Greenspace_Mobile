import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform, PermissionsAndroid, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PaymentConfirmationModal, InsufficientBalanceModal } from '../components/PaymentModals';
import { useWallet } from '../context/WalletContext';

const OrderScreen = ({ navigation, route }) => {
  const { designId, isCustomize } = route.params;
  const [customImages, setCustomImages] = useState([]);
  const [description, setDescription] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const { balance, updateBalance, addTransaction } = useWallet();

  // In a real app, you would get this data from an API
  const orderDetails = {
    // User Info
    userInfo: {
      name: 'John Doe',
      phone: '+1 234 567 890',
      address: '123 Main Street, New York, NY 10001',
    },
    // Design Info
    designInfo: {
      name: 'Modern Living Room',
      code: 'DL-2024001',
      area: {
        length: '5.5m',
        width: '4.2m',
        total: '23.1m²'
      }
    },
    // Materials List
    materials: [
      {
        id: '1',
        name: 'Modern Sofa',
        quantity: '1 piece',
        price: 1299.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '2',
        name: 'Coffee Table',
        quantity: '1 piece',
        price: 399.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '3',
        name: 'Floor Lamp',
        quantity: '2 pieces',
        price: 199.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '4',
        name: 'Wall Art',
        quantity: '3 pieces',
        price: 149.99,
        image: require('../assets/images/furniture.jpg')
      }
    ],
    // Pricing
    pricing: {
      materials: 2449.95,
      design: 500.00,
      total: 2949.95
    }
  };

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
    if (balance >= orderDetails.pricing.total) {
      setShowPaymentModal(true);
    } else {
      setShowInsufficientModal(true);
    }
  };

  const handlePaymentConfirm = () => {
    // Process the payment
    updateBalance(-orderDetails.pricing.total);
    
    // Add transaction to history
    addTransaction({
      type: 'payment',
      amount: -orderDetails.pricing.total,
      description: `Thanh toán đơn hàng ${orderDetails.designInfo.code}`,
    });

    setShowPaymentModal(false);
    Alert.alert(
      'Thanh toán thành công',
      'Đơn hàng của bạn đã được xác nhận',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="account" text={orderDetails.userInfo.name} />
            <InfoRow icon="phone" text={orderDetails.userInfo.phone} />
            <InfoRow icon="map-marker" text={orderDetails.userInfo.address} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="brush" text={orderDetails.designInfo.name} />
            <InfoRow icon="barcode" text={`Design Code: ${orderDetails.designInfo.code}`} />
            <InfoRow icon="ruler-square" text={`Length: ${orderDetails.designInfo.area.length}`} />
            <InfoRow icon="ruler-square" text={`Width: ${orderDetails.designInfo.area.width}`} />
            <InfoRow icon="ruler-square" text={`Total Area: ${orderDetails.designInfo.area.total}`} />
          </View>
        </View>

        {isCustomize && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customization Details</Text>
            <View style={styles.customizationContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Icon name="camera-plus" size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Upload Photos</Text>
              </TouchableOpacity>
              
              <View style={styles.imagePreviewContainer}>
                {customImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewWrapper}>
                    <Image 
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Icon name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TextInput
                style={styles.descriptionInput}
                placeholder="Enter your customization requirements..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          <View style={styles.materialsContainer}>
            {orderDetails.materials.map((material) => (
              <View key={material.id} style={styles.materialRow}>
                <Image 
                  source={material.image}
                  style={styles.materialImage}
                />
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>{material.quantity}</Text>
                </View>
                <Text style={styles.materialPrice}>${material.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingContainer}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Materials Cost</Text>
              <Text style={styles.pricingAmount}>${orderDetails.pricing.materials.toFixed(2)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Design Cost</Text>
              <Text style={styles.pricingAmount}>${orderDetails.pricing.design.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalAmount}>${orderDetails.pricing.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={orderDetails.pricing.total}
        onConfirm={handlePaymentConfirm}
      />

      <InsufficientBalanceModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        required={orderDetails.pricing.total}
        balance={balance}
        onTopUp={handleTopUp}
      />
    </View>
  );
};

const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

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
  customizationContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  descriptionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  materialsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 12,
    color: '#666',
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  pricingContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
});

export default OrderScreen;