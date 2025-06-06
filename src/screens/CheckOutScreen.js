import React, {useContext, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCart} from '../context/CartContext';
import {useWallet} from '../context/WalletContext';
import {useAuth} from '../context/AuthContext';
import {useLoading} from '../context/LoadingContext';
import Modal from '../components/Modal';
import {CommonActions} from '@react-navigation/native';
import Address from '../components/Address';
import axios from 'axios';
import API_URL from '../api/api01';

//const API_URL = 'http://10.0.2.2:8080/api';

//const API_URL = 'https://greenspace-webapi-container-app.graymushroom-37ee5453.southeastasia.azurecontainerapps.io/api';

const CheckOutScreen = ({navigation, route}) => {
  const {cartItems, totalPrice, clearCart, serverCartId} = useCart();
  const {balance, updateBalance, addTransaction} = useWallet();
  const {user} = useAuth();
  const {showLoading, hideLoading} = useLoading();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState({});
  const [streetAddress, setStreetAddress] = useState('');
  const [initialAddressData, setInitialAddressData] = useState(null);
  const [editableName, setEditableName] = useState(user?.name || '');
  const [editablePhone, setEditablePhone] = useState(user?.phone || '');
  const [shippingFee, setShippingFee] = useState(0);
  const [isLoadingShippingFee, setIsLoadingShippingFee] = useState(false);

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // --- Get selected items from route params ---
  const selectedItems = route.params?.selectedItems || []; // Default to empty array if not passed

  // --- Calculate total price based on SELECTED items ---
  const itemTotal = selectedItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Final total includes selected items total + shipping
  const finalTotal = itemTotal + shippingFee;

  useEffect(() => {
    if (user?.address) {
      //console.log('User Address String:', user.address);
      // console.log(
      //   'User object details:',
      //   JSON.stringify({
      //     id: user.id,
      //     wallet: user.wallet ? {id: user.wallet.id} : null,
      //     backendToken: user.backendToken
      //       ? user.backendToken.substring(0, 10) + '...'
      //       : null,
      //   }),
      // );

      const parts = user.address.split('|').map(part => part.trim());
      if (parts.length === 4) {
        const [street, wardName, districtName, provinceName] = parts;
        setStreetAddress(street);
        const initialData = {provinceName, districtName, wardName};
        //console.log('Setting Initial Address Data:', initialData);
        setInitialAddressData(initialData);

        // Set initial selected address
        const initialAddress = {
          provinceName,
          districtName,
          wardName,
        };
        setSelectedAddress(initialAddress);
      } else {
        console.warn('User address format is incorrect:', user.address);
        setInitialAddressData({}); // Set empty if format is wrong
      }
    } else {
      setInitialAddressData({}); // Set empty if no address string
    }

    // Initialize editable name if user name exists
    if (user?.name) {
      setEditableName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (user?.phone && !editablePhone) {
      setEditablePhone(user.phone);
    }
  }, [user, editablePhone]);

  useEffect(() => {
    // Log server cart ID on component mount
    //console.log('Current server cart ID:', serverCartId);
  }, [serverCartId]);

  const calculateShippingFee = async address => {
    // Validate address has all required fields
    if (
      !address ||
      !address.provinceName ||
      !address.districtName ||
      !address.wardName
    ) {
      //console.log('Incomplete address for shipping calculation:', address);
      setShippingFee(0);
      return;
    }

    setIsLoadingShippingFee(true);
    try {
      // Log the address being sent to the API
      //console.log('Sending address to calculateShippingFee API:', JSON.stringify(address));

      console.log('Calculating shipping fee for:', {
        toProvinceName: address.provinceName,
        toDistrictName: address.districtName,
        toWardName: address.wardName,
      });

      const response = await fetch(`${API_URL}/shipping/calculate-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          toProvinceName: address.provinceName,
          toDistrictName: address.districtName,
          toWardName: address.wardName,
        }),
      });

      // Check if response is OK first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from shipping API:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      //console.log('Shipping fee calculation result:', result);

      if (result.data && result.data.data) {
        const fee = parseInt(result.data.data.total) || 0;
        setShippingFee(fee);
        //console.log('Setting shipping fee to:', fee);
      } else {
        console.error('Unexpected response format:', result);
        Alert.alert(
          'Lỗi',
          'Định dạng phản hồi không đúng. Vui lòng thử lại sau.',
        );
        setShippingFee(0);
      }
    } catch (error) {
      console.error('Failed to calculate shipping fee:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tính phí vận chuyển. Vui lòng thử lại sau.',
      );
      setShippingFee(0);
    } finally {
      setIsLoadingShippingFee(false);
    }
  };

  const handleAddressChange = useCallback(address => {
    //console.log('Selected Address:', address);
    setSelectedAddress(address);
    calculateShippingFee(address);
  }, []);

  const handleStreetAddressChange = useCallback(
    text => {
      setStreetAddress(text);
      // Recalculate shipping fee with updated street address
      if (
        selectedAddress.provinceName &&
        selectedAddress.districtName &&
        selectedAddress.wardName
      ) {
        calculateShippingFee(selectedAddress);
      }
    },
    [selectedAddress],
  );

  const handleOrder = () => {
    // Validate that name is not empty
    if (!editableName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên người nhận.');
      return;
    }
    // Validate that we have all required address fields
    if (
      !selectedAddress.provinceName ||
      !selectedAddress.districtName ||
      !selectedAddress.wardName ||
      !streetAddress.trim()
    ) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng.');
      return;
    }

    // Validate phone number
    if (!editablePhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    // Validate cart items
    if (!selectedItems || selectedItems.length === 0) {
      Alert.alert('Lỗi', 'Không có sản phẩm nào được chọn để đặt hàng.');
      return;
    }
    setIsModalVisible(true);
  };

  const handleConfirmOrder = async () => {
    try {
      showLoading();

      // Ensure we have required fields
      if (!user || !user.id) {
        Alert.alert(
          'Lỗi',
          'Thông tin người dùng không đủ. Vui lòng đăng nhập lại.',
        );
        return;
      }

      // Verify we have a server cart ID
      if (!serverCartId) {
        console.error('Không tìm thấy ID giỏ hàng trên máy chủ');
        Alert.alert('Lỗi', 'Không thể xác nhận đơn hàng. Vui lòng thử lại.');
        return;
      }

      // Format the full address
      const fullAddress = `${streetAddress}|${selectedAddress.wardName}|${selectedAddress.districtName}|${selectedAddress.provinceName}`;
      // Use selectedItems to create the product list
      const productList = selectedItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      // Step 1: Create the order
      const orderProducts = {
        userId: user.id,
        userName: editableName,
        address: fullAddress,
        phone: editablePhone,
        shipPrice: parseInt(shippingFee), // Ensure shipPrice is an integer
        products: productList,
        cartId: serverCartId, // Include the server cart ID
      };

      //console.log('Creating order with:', JSON.stringify(orderProducts));

      const orderResponse = await axios.post(
        `${API_URL}/orderproducts`,
        orderProducts,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.backendToken}`,
          },
        },
      );

      console.log(
        'Order created successfully:',
        JSON.stringify(orderResponse.data),
      );

      // Get the order ID from the response
      if (
        !orderResponse.data ||
        !orderResponse.data.data ||
        !orderResponse.data.data.id
      ) {
        throw new Error('Invalid response from order creation API');
      }

      const orderId = orderResponse.data.data.id;

      // Step 2: Get wallet ID if not already available
      let walletId;

      if (user.wallet && user.wallet.id) {
        walletId = user.wallet.id;
        console.log('Using wallet ID from user object:', walletId);
      } else {
        console.log('Fetching wallet ID for user:', user.id);
        const walletResponse = await axios.get(
          `${API_URL}/wallets/user${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.backendToken}`,
            },
          },
        );
        console.log('Wallet response:', JSON.stringify(walletResponse.data));

        if (!walletResponse.data || !walletResponse.data.id) {
          throw new Error('Invalid response from wallet API');
        }

        walletId = walletResponse.data.id;
      }

      // Step 3: Create the bill
      const billData = {
        walletId: walletId,
        orderId: orderId,
        serviceOrderId: null,
        amount: parseInt(finalTotal), // Ensure amount is an integer
        description: 'Thanh toán đơn hàng',
      };

      console.log('Creating bill with:', JSON.stringify(billData));

      const billResponse = await axios.post(`${API_URL}/bill`, billData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.backendToken}`,
        },
      });

      console.log(
        'Bill created successfully:',
        JSON.stringify(billResponse.data),
      );

      // Update local state and balance
      updateBalance(-finalTotal);

      addTransaction({
        type: 'payment',
        amount: -finalTotal,
        description: 'Thanh toán đơn hàng',
      });

      setIsModalVisible(false);
      setIsSuccessModalVisible(true);

      clearCart();

      // setTimeout(() => {
      //   setIsSuccessModalVisible(false);

      //   // Use a safer navigation approach
      //   navigation.dispatch(
      //     CommonActions.reset({
      //       index: 0,
      //       routes: [{name: 'ShopMain'}],
      //     }),
      //   );
      // }, 2000);
    } catch (error) {
      console.error('Order Error:', error);

      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          'Error response data:',
          JSON.stringify(error.response.data),
        );
        console.error('Error response status:', error.response.status);

        Alert.alert(
          'Lỗi máy chủ',
          `Không thể xử lý thanh toán. Mã lỗi: ${error.response.status}. Vui lòng thử lại sau.`,
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', JSON.stringify(error.request));
        Alert.alert(
          'Lỗi kết nối',
          'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        Alert.alert('Lỗi', 'Không thể xử lý thanh toán: ' + error.message);
      }

      setIsModalVisible(false);
    } finally {
      hideLoading();
    }
  };

  const renderCartItem = ({item}) => (
    <View style={styles.orderItemContainer}>
      <Image
        source={{uri: item.image?.imageUrl || 'https://via.placeholder.com/80'}}
        style={styles.orderItemImage}
        resizeMode="cover"
      />
      <View style={styles.orderItemDetails}>
        <Text style={styles.orderItemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.orderItemPrice}>{formatCurrency(item?.price)}</Text>
      </View>
      <View style={styles.orderItemQuantityContainer}>
        <Text style={styles.orderItemQuantityLabel}>x</Text>
        <Text style={styles.orderItemQuantity}>{item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        removeClippedSubviews={false}>
        {/* Add padding at the top to avoid overlap with the back button */}
        {/* <View style={styles.topSpace}></View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>

          {/* Full Name Field (Editable) */}
          <View style={styles.infoFieldContainer}>
            <Text style={styles.label}>Tên khách hàng</Text>
            <TextInput
              style={styles.editableInfoInput}
              value={editableName}
              onChangeText={setEditableName}
              placeholder="Họ và tên"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Phone Field (Editable) */}
          <View style={styles.infoFieldContainer}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 22,
                fontSize: 16,
                color: '#2c3e50',
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
                width:150
              }}
              value={editablePhone}
              onChangeText={setEditablePhone}
              keyboardType="phone-pad"
              placeholder="Số điện thoại"
              placeholderTextColor="#999"
            />
          </View>

          {/* Address Component Integration */}
          {initialAddressData !== null &&
            !isModalVisible &&
            !isSuccessModalVisible && (
              <Address
                onAddressChange={handleAddressChange}
                initialAddress={initialAddressData}
              />
            )}

          <View style={styles.streetInputContainer}>
            <Text style={styles.label}>Số nhà, tên đường</Text>
            <TextInput
              style={styles.streetInput}
              value={streetAddress}
              onChangeText={handleStreetAddressChange}
              placeholder="Ví dụ: 123 Đường ABC"
              placeholderTextColor="#999"
            />
          </View>
          {selectedAddress.provinceName && (
            <Text style={styles.selectedAddressText}>
              Địa chỉ: {streetAddress}, {selectedAddress.wardName},{' '}
              {selectedAddress.districtName}, {selectedAddress.provinceName}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {/* Map over SELECTED items */}
          {selectedItems.map(item => (
            <View key={item.id} style={styles.itemContainer}>
              {renderCartItem({item})}
            </View>
          ))}
          {/* Adjust separator logic if needed based on selectedItems count */}
          {selectedItems.length > 1 &&
            selectedItems
              .slice(0, -1)
              .map((_, index) => (
                <View key={`separator-${index}`} style={styles.itemSeparator} />
              ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          {/* Display current balance first */}
          <View style={styles.balanceDisplayRow}>
            <Text style={styles.balanceLabel}>Số dư ví hiện tại:</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tổng tiền hàng</Text>
              <Text style={styles.paymentValue}>
                {/* Display total calculated from SELECTED items */}
                {formatCurrency(itemTotal)}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
              {isLoadingShippingFee ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.paymentValue}>
                  {formatCurrency(shippingFee)}
                </Text>
              )}
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(finalTotal)}
              </Text>
            </View>
          </View>

          {/* Conditionally render insufficient balance warning */}
          {balance < finalTotal && (
            <View style={styles.warningContainer}>
              <Icon name="alert-circle-outline" size={22} color="#e74c3c" />
              <Text style={styles.warningText}>
                Số dư không đủ để thanh toán.
              </Text>
              <TouchableOpacity
                style={styles.inlineTopUpButton}
                onPress={() =>
                  navigation.navigate('Account', {
                    screen: 'Profile',
                    params: {
                      screen: 'TopUp',
                    },
                  })
                }>
                <Text style={styles.inlineTopUpButtonText}>Nạp tiền</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.orderButton,
            // Keep the disabled style logic based on balance
            balance < finalTotal && styles.disabledButton,
          ]}
          onPress={handleOrder}
          // Ensure button is disabled if balance is insufficient
          disabled={balance < finalTotal}>
          <Text style={styles.orderButtonText}>
            {balance < finalTotal ? 'Số dư không đủ' : 'Đặt hàng'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        height="auto">
        <View style={styles.modalContent}>
          <Icon name="check-circle-outline" size={60} color="#4CAF50" />
          <Text style={styles.modalTitle}>Xác nhận đơn hàng</Text>
          <Text style={styles.modalText}>
            Xác nhận thanh toán đơn hàng với số tiền{' '}
            {/* Use finalTotal in modal confirmation */}
            {formatCurrency(finalTotal)}?
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalButtonTextCancel}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={handleConfirmOrder}>
              <Text style={styles.modalButtonTextConfirm}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSuccessModalVisible}
        onClose={() => {
          setIsSuccessModalVisible(false);
          // Navigate after closing modal
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'ShopMain'}],
            }),
          );
        }}
        height="auto"
        showCloseButton={false}>
        <View style={styles.successModalContent}>
          <Icon name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.successModalTitle}>Đặt hàng thành công!</Text>
          <Text style={styles.successModalText}>
            Đơn hàng của bạn đã được xác nhận
          </Text>
          <View style={styles.successModalButtonContainer}>
            <TouchableOpacity
              style={[styles.successModalButton, styles.successModalButtonAgree]}
              onPress={() => setIsSuccessModalVisible(false)}>
              <Text style={styles.successModalButtonTextAgree}>Đồng ý</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.successModalButton, styles.successModalButtonOrder]}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.navigate('Account', {
                  screen: 'MaterialOrdersTab',
                  params: {
                    screen: 'MaterialOrders',
                    initial: false,
                  },
                });
              }}>
              <Text style={styles.successModalButtonTextOrder}>Đơn mua</Text>
            </TouchableOpacity>
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
  streetInputContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
    flex: 1,
  },
  streetInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selectedAddressText: {
    marginTop: 15,
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  orderButton: {
    backgroundColor: '#4CAF50',
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
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonTextCancel: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#555',
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
  infoFieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  editableInfoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 22,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    width:180
  },
  orderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  orderItemQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  orderItemQuantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderItemQuantity: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSeparator: {
    height: 10,
  },
  itemContainer: {
    marginBottom: 10,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  topSpace: {
    height: 20, // Adjust this value based on the height of the back button
  },
  scrollContentContainer: {
    paddingBottom: 20, // Add padding to the bottom of the scroll view
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0', // Light red background
    borderRadius: 8,
    padding: 12,
    marginTop: 15, // Space above the warning
    borderWidth: 1,
    borderColor: '#e74c3c', // Red border
  },
  warningText: {
    flex: 1, // Allow text to wrap
    marginLeft: 8,
    fontSize: 14,
    color: '#c0392b', // Darker red text
  },
  inlineTopUpButton: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'green',
    borderRadius: 6,
  },
  inlineTopUpButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  balanceDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Space before payment details box
    paddingHorizontal: 5,
  },
  balanceLabel: {
    fontSize: 15,
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  successModalButtonContainer: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  successModalButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successModalButtonAgree: {
    backgroundColor: '#4CAF50',
  },
  successModalButtonOrder: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  successModalButtonTextAgree: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successModalButtonTextOrder: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckOutScreen;
