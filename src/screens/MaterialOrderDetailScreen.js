import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {useWallet} from '../context/WalletContext';
import axios from 'axios';
import StatusTrackingMaterial from '../components/StatusTrackingMaterial';
import {isContentSafe} from '../utils/isContentSafe';
import API_URL from '../api/api01';

//const API_URL = 'http://10.0.2.2:8080/api';

//const API_URL = 'https://greenspace-webapi-container-app.graymushroom-37ee5453.southeastasia.azurecontainerapps.io/api';

const MaterialOrderDetailScreen = ({navigation, route}) => {
  const {orderId} = route.params;
  //console.log("orderId", orderId);

  const {user} = useAuth();
  const {refreshWallet, updateBalance} = useWallet();
  const [orderDetails, setOrderDetails] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- Rating State ---
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedProductForRating, setSelectedProductForRating] =
    useState(null);
  const [currentRating, setCurrentRating] = useState(0); // 0 means no rating yet
  const [ratingDescription, setRatingDescription] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  // --- End Rating State ---

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!user || !user.backendToken) {
      setError('Người dùng chưa đăng nhập.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/orderproducts/${orderId}`, {
        headers: {
          Authorization: `Bearer ${user.backendToken}`,
        },
      });

      console.log('Order details fetched successfully:', response.data);
      const orderData = response.data.data || response.data;
      setOrderDetails(orderData);

      // Fetch product details for each product in the order
      if (orderData.orderDetails && orderData.orderDetails.length > 0) {
        await fetchProductDetails(orderData.orderDetails);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể tải chi tiết đơn hàng.',
      );
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!user || !user.backendToken || !orderDetails) {
      Alert.alert('Lỗi', 'Không thể xác nhận đơn hàng. Vui lòng thử lại sau.');
      return;
    }

    // Show confirmation modal before proceeding
    Alert.alert(
      'Xác nhận đã nhận hàng',
      'Bạn đã nhận được đơn hàng và muốn xác nhận hoàn tất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setConfirmLoading(true);
            try {
              const response = await axios.put(
                `${API_URL}/orderproducts/status/${orderId}`,
                {
                  status: 10,
                  deliveryCode: orderDetails.deliveryCode,
                },
              );
              if (response.data === 'Update Successfully!') {
                console.log(
                  'Order status updated successfully:',
                  response.data,
                );
                Alert.alert('Thành công', 'Đã xác nhận nhận hàng thành công!', [
                  {text: 'OK', onPress: () => fetchOrderDetails()},
                ]);
              } else {
                Alert.alert(
                  'Lỗi',
                  'Không thể xác nhận đơn hàng. Vui lòng thử lại sau.',
                );
              }
            } catch (err) {
              console.error('Error confirming order receipt:', err);
              Alert.alert(
                'Lỗi',
                err.response?.data?.message ||
                  err.message ||
                  'Không thể xác nhận đơn hàng. Vui lòng thử lại sau.',
              );
            } finally {
              setConfirmLoading(false);
            }
          },
        },
      ],
    );
  };

  const fetchProductDetails = async orderItems => {
    const productDetailsObj = {};

    try {
      // Create an array of promises for all product API calls
      const productPromises = orderItems.map(async item => {
        try {
          const productResponse = await axios.get(
            `${API_URL}/product/${item.productId}`,
            {
              headers: {
                Authorization: `Bearer ${user.backendToken}`,
              },
            },
          );

          console.log(
            `Product details fetched for ${item.productId}:`,
            productResponse.data,
          );
          const productData = productResponse.data.data || productResponse.data;

          // Store product data in the object with productId as key
          productDetailsObj[item.productId] = productData;
        } catch (productErr) {
          console.error(
            `Error fetching product ${item.productId}:`,
            productErr,
          );
          // Continue with other products even if one fails
        }
      });

      // Wait for all product API calls to complete
      await Promise.all(productPromises);

      // Update state with all product details
      setProductDetails(productDetailsObj);
    } catch (err) {
      console.error('Error in fetchProductDetails:', err);
      // We don't set the main error state here to allow the order to still display
    }
  };

  const getStatusColor = status => {
    switch (status?.toString()) {
      case '0': // Pending
        return '#FFB700';
      case '1': // Processing
        return '#60A99D';
      case '2': // Done
        return '#4CAF50';
      case '3': // Cancelled
        return '#E74C3C';
      case '4': // Refund
        return '#F39C12';
      case '5': // DoneRefund
        return '#4CAF50';
      case '6': // PickedPackageAndDelivery
        return '#3498DB';
      case '7': // DeliveryFail
        return '#E74C3C';
      case '8': // ReDelivery
        return '#F39C12';
      case '9': // DeliveredSuccessfully
        return '#2ECC71';
      case '10': // Completed
        return '#4CAF50';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = status => {
    switch (status?.toString()) {
      case '0':
        return 'Chờ xử lý';
      case '1':
        return 'Đang xử lý';
      case '2':
        return 'Đã xử lý';
      case '3':
        return 'Đã hủy';
      case '4':
        return 'Hoàn tiền';
      case '5':
        return 'Đã hoàn tiền xong';
      case '6':
        return 'Đã lấy hàng & đang giao';
      case '7':
        return 'Giao hàng thất bại';
      case '8':
        return 'Giao lại';
      case '9':
        return 'Đã giao hàng thành công';
      case '10':
        return 'Hoàn tất';
      default:
        return 'Không xác định';
    }
  };

  // Format date to show in UI
  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Format time to show in UI
  const formatTime = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // --- Rating Functions ---
  const handleOpenRatingModal = (product, productInfo) => {
    setSelectedProductForRating({
      productId: product.productId,
      productName: productInfo.name || 'Sản phẩm không xác định',
    });
    setCurrentRating(0); // Reset rating
    setRatingDescription(''); // Reset description
    setIsRatingModalVisible(true);
  };

  const handleCloseRatingModal = () => {
    setIsRatingModalVisible(false);
    setSelectedProductForRating(null);
    // Keep rating/description state in case modal is just hidden, reset on open
  };

  const handleSubmitRating = async () => {
    if (currentRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!user || !user.id || !selectedProductForRating) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
      return;
    }

    // ✅ KIỂM DUYỆT NGÔN TỪ (local + AI)
    if (ratingDescription.trim().length > 0) {
      try {
        const result = await isContentSafe(ratingDescription);

        if (!result.ok) {
          const msg =
            result.reason +
            (result.flaggedBy === 'openai' && result.categories
              ? '\n\nChi tiết:\n' +
                Object.entries(result.categories)
                  .filter(([_, val]) => val === true)
                  .map(([cat]) => `• ${cat}`)
                  .join('\n')
              : '');

          Alert.alert('⚠️ Nội dung không phù hợp', msg);
          return;
        }
      } catch (err) {
        console.warn('Lỗi kiểm duyệt ngôn từ:', err);
        // Cho phép gửi tiếp nếu AI lỗi mạng
      }
    }

    // ✅ Gửi đánh giá nếu hợp lệ
    setIsSubmittingRating(true);
    try {
      const payload = {
        userId: user.id,
        productId: selectedProductForRating.productId,
        rating: currentRating,
        description: ratingDescription,
      };

      const response = await axios.post(`${API_URL}/productfeedback`, payload, {
        headers: {
          Authorization: `Bearer ${user.backendToken}`,
        },
      });

      Alert.alert('✅ Thành công', 'Cảm ơn bạn đã đánh giá sản phẩm!');
      handleCloseRatingModal();
    } catch (err) {
      console.error(
        'Error submitting rating:',
        err.response?.data || err.message,
      );
      Alert.alert(
        'Lỗi',
        err.response?.data?.message ||
          err.message ||
          'Không thể gửi đánh giá. Vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // --- End Rating Functions ---

  // Move the actual cancel logic here
  const actuallyCancelOrder = async () => {
    setIsCancelling(true);
    try {
      // Step 1: Refund
      const refundResponse = await axios.post(
        `${API_URL}/wallets/refund-order?id=${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.backendToken}`,
          },
          timeout: 10000,
        },
      );
      console.log("refundResponse", refundResponse.error);
      
      if (refundResponse.data !== 'Refund successful.') {
        throw new Error(refundResponse.data || 'Hoàn tiền không thành công.');
      }
      // Step 2: Update Order Status to Cancelled (3)
      const updateResponse = await axios.put(
        `${API_URL}/orderproducts/status/${orderId}`,
        {
          status: 3,
          deliveryCode: orderDetails.deliveryCode || '',
        },
        {
          headers: {
            Authorization: `Bearer ${user.backendToken}`,
          },
        },
      );
      console.log("updateResponse", updateResponse);
      
      if (updateResponse.data !== 'Update Successfully!') {
        Alert.alert(
          'Cảnh báo',
          'Đã hoàn tiền thành công nhưng không thể cập nhật trạng thái đơn hàng. Vui lòng liên hệ hỗ trợ.',
        );
        fetchOrderDetails();
        await refreshWallet();
      } else {
        await refreshWallet();
        Alert.alert(
          'Thành công',
          'Đã hủy đơn hàng thành công và hoàn tiền vào ví của bạn.',
          [{text: 'OK', onPress: () => fetchOrderDetails()}],
        );
      }
    } catch (err) {
      console.log("err", err);
      
      Alert.alert(
        'Lỗi hủy đơn hàng',
        err.response?.data?.message ||
          err.message ||
          'Đã xảy ra lỗi trong quá trình hủy đơn. Vui lòng thử lại.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Replace Alert with modal trigger
  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity
          onPress={fetchOrderDetails}
          style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!orderDetails) {
    return (
      <View style={styles.centered}>
        <Icon name="clipboard-text-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy thông tin đơn hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(orderDetails.status) + '22' } // 22 for light background
          ]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(orderDetails.status) }
              ]}
            >
              {getStatusText(orderDetails.status)}
            </Text>
          </View>

          
        </View>

        <View style={styles.trackingContainer}>
          <Text style={styles.orderNumber}>
            Mã vận chuyển: {orderDetails.deliveryCode || 'Chưa có'}
          </Text>

          <StatusTrackingMaterial currentStatus={orderDetails.status} />

          {orderDetails.status === '9' && (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirmLoading && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmReceived}
              disabled={confirmLoading}>
              {confirmLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
              ) : (
                <View style={styles.confirmButtonContent}>
                  <Icon
                    name="check-circle-outline"
                    size={24}
                    color="#fff"
                    style={styles.confirmIcon}
                  />
                  <Text style={styles.confirmButtonText}>
                    Xác nhận đã nhận hàng
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Cancel Button - Only shows for Pending status */}
          {orderDetails.status === '0' && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isCancelling && styles.cancelButtonDisabled,
              ]}
              onPress={handleCancelOrder}
              disabled={isCancelling}>
              {isCancelling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoContainer}>
            <InfoRow
              icon="account"
              text={orderDetails.userName || 'Không có thông tin'}
            />
            <InfoRow
              icon="phone"
              text={orderDetails.phone || 'Không có thông tin'}
            />
            <InfoRow
              icon="map-marker"
              text={orderDetails.address || 'Không có thông tin'}
            />
            <InfoRow
              icon="clock"
              text={`${formatTime(orderDetails.creationDate)}, ${formatDate(
                orderDetails.creationDate,
              )}`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <View style={styles.productsContainer}>
            {orderDetails.orderDetails &&
              orderDetails.orderDetails.map(product => {
                // Get associated product details if available
                const productInfo = productDetails[product.productId] || {};

                return (
                  <View key={product.productId} style={styles.productRow}>
                    <Image
                      source={{uri: productInfo.image.imageUrl}}
                      defaultSource={require('../assets/images/furniture.jpg')}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {productInfo.name || 'Sản phẩm không xác định'}
                      </Text>
                      <Text style={styles.productQuantity}>
                        Số lượng: {product.quantity}
                      </Text>
                      {productInfo.categoryName && (
                        <Text style={styles.productCategory}>
                          {productInfo.categoryName}
                        </Text>
                      )}
                      {/* --- Rating Button --- */}
                      {orderDetails.status === '10' && (
                        <TouchableOpacity
                          style={styles.rateButton}
                          onPress={() =>
                            handleOpenRatingModal(product, productInfo)
                          }>
                          <Icon name="star-outline" size={16} color="#4CAF50" />
                          <Text style={styles.rateButtonText}>Đánh giá</Text>
                        </TouchableOpacity>
                      )}
                      {/* --- End Rating Button --- */}
                    </View>
                    <Text style={styles.productPrice}>
                      {formatCurrency(product.price)} 
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.paymentContainer}>
            <PaymentRow
              label="Tổng tiền hàng"
              amount={formatCurrency(
                orderDetails.totalAmount - orderDetails.shipPrice)}
            />
            <PaymentRow
              label="Phí vận chuyển"
              amount={formatCurrency(orderDetails.shipPrice)}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(orderDetails.totalAmount)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Rating Modal --- */}
      {selectedProductForRating && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isRatingModalVisible}
          onRequestClose={handleCloseRatingModal}>
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
              <Text style={styles.modalProductName}>
                {selectedProductForRating.productName}
              </Text>

              {/* Star Rating Input */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Pressable key={star} onPress={() => setCurrentRating(star)}>
                    <Icon
                      name={star <= currentRating ? 'star' : 'star-outline'}
                      size={32}
                      color={star <= currentRating ? '#FFB700' : '#ccc'}
                      style={styles.starIcon}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Description Input */}
              <TextInput
                style={styles.ratingInput}
                placeholder="Viết đánh giá của bạn (không bắt buộc)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={ratingDescription}
                onChangeText={setRatingDescription}
              />

              {/* Action Buttons */}
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleCloseRatingModal}
                  disabled={isSubmittingRating}>
                  <Text style={styles.modalButtonTextCancel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonSubmit,
                    isSubmittingRating && styles.modalButtonDisabled,
                  ]}
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}>
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextSubmit}>
                      Gửi đánh giá
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* --- End Rating Modal --- */}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Xác nhận hủy đơn hàng</Text>
            <Text style={{ fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 24 }}>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Tiền sẽ được hoàn lại vào ví của bạn.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#f0f0f0',
                  padding: 12,
                  borderRadius: 8,
                  marginRight: 8,
                  alignItems: 'center'
                }}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#E74C3C',
                  padding: 12,
                  borderRadius: 8,
                  marginLeft: 8,
                  alignItems: 'center'
                }}
                onPress={async () => {
                  setShowCancelModal(false);
                  await actuallyCancelOrder();
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Hủy đơn hàng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoRow = ({icon, text}) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const PaymentRow = ({label, amount, isDiscount}) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text
      style={[styles.paymentAmount, isDiscount ? styles.discountText : null]}>
      {amount}
    </Text>
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
  statusContainer: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 0,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    // color will be set dynamically
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
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
  productsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  paymentContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountText: {
    color: '#4CAF50',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  trackingContainer: {
    backgroundColor: '#fff',
    paddingLeft: 20,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  confirmButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 0,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    marginRight: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Rating Button Styles
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#E8F5E9', // Lighter green background
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignSelf: 'flex-start', // Align button to the left
  },
  rateButtonText: {
    marginLeft: 4,
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
  },
  // Modal Styles
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalProductName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingInput: {
    height: 100,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top', // Align text to top for multiline
    marginBottom: 20,
    fontSize: 14,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1, // Make buttons share space
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    marginHorizontal: 5, // Add space between buttons
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSubmit: {
    backgroundColor: '#4CAF50',
  },
  modalButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  modalButtonTextCancel: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtonTextSubmit: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Cancel Button Styles
  cancelButton: {
    backgroundColor: '#E74C3C', // Red color for cancellation
    borderRadius: 8,
    paddingVertical: 8,         // Smaller vertical padding
    paddingHorizontal: 24,      // Smaller horizontal padding
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',        // Center the button horizontally
    minWidth: 0,                // Remove minWidth or set to 0
  },
  cancelButtonDisabled: {
    backgroundColor: '#F5B7B1', // Lighter red when disabled
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default MaterialOrderDetailScreen;
