import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from '../context/CartContext';
import { WalletContext } from '../context/WalletContext';
import Modal from '../components/Modal';
import { CommonActions } from '@react-navigation/native';

const CheckOutScreen = ({ navigation }) => {
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);
  const { balance, updateBalance, addTransaction } = useContext(WalletContext);
  const [isPaymentMethodChecked, setIsPaymentMethodChecked] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  
  const shippingFee = 30000; // 30,000 VND shipping fee
  const discount = 20000; // 20,000 VND discount
  const finalTotal = totalPrice + shippingFee - discount;

  const handleOrder = () => {
    if (!isPaymentMethodChecked) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    // Check if user has enough balance
    if (balance < finalTotal) {
      Alert.alert(
        'Insufficient Balance',
        'Your wallet balance is not enough to complete this purchase. Please top up your wallet.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Top Up Wallet',
            onPress: () => navigation.navigate('TopUp')
          }
        ]
      );
      return;
    }

    setIsModalVisible(true);
  };

  const handleConfirmOrder = () => {
    try {
      // Deduct money from wallet
      updateBalance(-finalTotal);
      
      // Add transaction record
      addTransaction({
        type: 'payment',
        amount: -finalTotal,
        description: 'Thanh toán đơn hàng',
      });

      setIsModalVisible(false);
      setIsSuccessModalVisible(true);
      
      clearCart();
      
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Shop' }],
        });

        setTimeout(() => {
          navigation.getParent()?.navigate('Home');
        }, 100);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
      setIsModalVisible(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.image.imageUrl }}
        style={styles.cartItemImage}
        resizeMode="cover"
      />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{item.price.toLocaleString('vi-VN')} VND</Text>
        <Text style={styles.quantityText}>Quantity: {item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} removeClippedSubviews={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Shipping Address</Text>
              <Text style={styles.infoText}>123 Main Street</Text>
              <Text style={styles.infoText}>New York, NY 10001</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Icon name="map-marker-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            removeClippedSubviews={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setIsPaymentMethodChecked(!isPaymentMethodChecked)}
            >
              <Icon
                name={isPaymentMethodChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.checkboxText}>Ví cá nhân</Text>
            </TouchableOpacity>
            <View style={styles.walletContainer}>
              <Text style={styles.walletBalance}>
                Số dư hiện tại: {balance.toLocaleString('vi-VN')} VND
              </Text>
              <TouchableOpacity 
                style={styles.topUpButton}
                onPress={() => navigation.navigate('Account', {
                  screen: 'Profile',
                  params: {
                    screen: 'TopUp'
                  }
                })}
              >
                <Icon name="wallet-plus" size={20} color="#fff" />
                <Text style={styles.topUpButtonText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>{totalPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Shipping Fee</Text>
              <Text style={styles.paymentValue}>{shippingFee.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Discount</Text>
              <Text style={styles.paymentValue}>-{discount.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{finalTotal.toLocaleString('vi-VN')} VND</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.orderButton,
            balance < finalTotal && styles.disabledButton
          ]} 
          onPress={handleOrder}
          disabled={balance < finalTotal}
        >
          <Text style={styles.orderButtonText}>
            {balance < finalTotal ? 'Insufficient Balance' : 'Order'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        height="auto"
      >
        <View style={styles.modalContent}>
          <Icon name="check-circle-outline" size={60} color="#007AFF" />
          <Text style={styles.modalTitle}>Confirm Order</Text>
          <Text style={styles.modalText}>
            Xác nhận thanh toán đơn hàng với số tiền {finalTotal.toLocaleString('vi-VN')} VND?
          </Text>
          <Text style={styles.modalBalance}>
            Số dư sau thanh toán: {(balance - finalTotal).toLocaleString('vi-VN')} VND
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={handleConfirmOrder}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        height="auto"
        showCloseButton={false}
      >
        <View style={styles.successModalContent}>
          <Icon name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.successModalTitle}>Order Successful!</Text>
          <Text style={styles.successModalText}>
            Please wait for staff to confirm and prepare the goods for you.
          </Text>
          <View style={styles.loadingDots}>
            <Text style={styles.loadingText}>Redirecting</Text>
            <Text style={styles.dots}>...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#666',
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  editButton: {
    padding: 8,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  paymentDetails: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666',
  },
  paymentValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  modalBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f8f8',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  successModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  dots: {
    fontSize: 24,
    color: '#666',
    marginLeft: 4,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 34,
    marginRight: 10,
  },
  walletBalance: {
    fontSize: 14,
    color: '#666',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default CheckOutScreen;
