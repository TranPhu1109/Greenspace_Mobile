import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StatusTracking from '../components/StatusTracking';
import StatusTrackingNoCustom from '../components/StatusTrackingNoCustom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatAddress = (addressString) => {
  if (!addressString) return 'N/A';
  return addressString.split('|').join(', ');
};

const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { text: 'Chờ xử lý', color: '#FF9500', icon: 'credit-card-clock-outline' };
      case 'paymentsuccess':
        return { text: 'Thanh toán thành công', color: '#007AFF', icon: 'credit-card-check-outline' };
      case 'processing':
        return { text: 'Đang xử lý', color: '#FF9500', icon: 'cogs' };
      case 'pickedpackageanddelivery':
        return { text: 'Đang giao hàng', color: '#5AC8FA', icon: 'truck-delivery-outline' };
      case 'deliveryfail':
        return { text: 'Giao hàng thất bại', color: '#FF3B30', icon: 'alert-circle-outline' };
      case 'redelivery':
        return { text: 'Giao hàng lại', color: '#FF9500', icon: 'truck-fast-outline' };
      case 'deliveredsuccessfully':
        return { text: 'Giao hàng thành công', color: '#34C759', icon: 'truck-check-outline' };
      case 'completeorder':
        return { text: 'Hoàn tất', color: '#30A46C', icon: 'check-decagram-outline' };
      case 'ordercancelled':
        return { text: 'Đã hủy', color: '#FF3B30', icon: 'cancel' };
      default:
        return { text: status || 'Không xác định', color: '#8E8E93', icon: 'help-circle-outline' };
    }
};
// --- End Helper Functions ---

const ServiceOrderDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orderId } = route.params;
  const [orderDetails, setOrderDetails] = useState(null);
  console.log("orderDetails", orderDetails);
  
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("Order ID not provided.");
      setLoading(false);
    }
  }, [orderId]);

  const fetchProductDetails = async (productId) => {
    if (!productId) return null;
    try {
      const response = await api.get(`/product/${productId}`);
      return response.data || response;
    } catch (err) {
      console.error(`Error fetching product ${productId}:`, err);
      return null;
    }
  };

  const fetchOrderDetails = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      
      const response = await api.get(`/serviceorder/${orderId}`);
      const orderData = response.data || response;

      if (!orderData) {
        throw new Error("Order data not found in response.");
      }
      setOrderDetails(orderData);
      
      if (orderData.serviceOrderDetails && orderData.serviceOrderDetails.length > 0) {
        const productPromises = orderData.serviceOrderDetails.map(detail => 
          fetchProductDetails(detail.productId)
        );
        const productResults = await Promise.all(productPromises);
        
        const productMap = {};
        orderData.serviceOrderDetails.forEach((detail, index) => {
          if (productResults[index]) {
            productMap[detail.productId] = productResults[index];
          }
        });
        setProducts(productMap);
        console.log("Fetched product details map:", productMap);
      } else {
        setProducts({});
      }
      
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Bạn chưa có đơn hàng nào!');
      setOrderDetails(null);
    } finally {
      if (!isRefreshing) setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails(true); // Pass refresh flag
  }, [orderId]); // Add dependencies if needed, like orderId

  // --- Recalculate Prices --- 
  const calculatedMaterialPrice = useMemo(() => {
    if (!orderDetails?.serviceOrderDetails) return 0;
    return orderDetails.serviceOrderDetails.reduce((sum, detail) => {
      return sum + (detail.totalPrice || 0);
    }, 0);
  }, [orderDetails]);

  const calculatedTotalCost = useMemo(() => {
    return (orderDetails?.designPrice || 0) + calculatedMaterialPrice;
  }, [orderDetails, calculatedMaterialPrice]);
  // --- End Recalculate Prices ---

  // --- Render Loading/Error States ---
  if (loading) {
    return (
      <View style={styles.container}> 
        <Header navigation={navigation} title="Đang tải đơn hàng..." />
        <View style={styles.centeredContainer}> 
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </View>
    );
  }

  if (error || !orderDetails) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="Error" />
        <View style={styles.centeredContainer}> 
          <Icon name="alert-circle-outline" size={60} color="#FF3B30" style={{ marginBottom: 15 }}/>
          <Text style={styles.errorText}>{error}</Text>
          {/* <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Icon name="refresh" size={18} color="#fff" style={{ marginRight: 8 }}/>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    );
  }
  // --- End Loading/Error States ---

  const statusInfo = getStatusInfo(orderDetails.status);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={`Đơn hàng #${orderId.substring(0, 8)}`} />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={ // Add RefreshControl
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#007AFF']} // Optional: customize spinner color
          />
        }
      >
        {/* Order Summary Header */}
        <View style={styles.orderSummaryHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Icon name={statusInfo.icon} size={16} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
          </View>
          <Text style={styles.orderDateText}>{formatDate(orderDetails.creationDate)}</Text>
        </View>

        {/* Customer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="account-outline" label="Tên" text={orderDetails.userName || 'N/A'} />
            <InfoRow icon="phone-outline" label="Số điện thoại" text={orderDetails.cusPhone || 'N/A'} />
            <InfoRow icon="map-marker-outline" label="Địa chỉ" text={formatAddress(orderDetails.address)} />
          </View>
        </View>

        {/* Service Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          <View style={styles.infoCard}>
            <InfoRow 
              icon={orderDetails.isCustom ? "pencil-ruler" : "lightbulb-on-outline"} 
              label="Loại dịch vụ" 
              text={orderDetails.isCustom ? "Thiết kế tùy chỉnh" : "Sử dụng ý tưởng thiết kế"} 
            />          
            {orderDetails.description && (
              <InfoRow icon="text-box-outline" label="Mô tả" text={orderDetails.description} />
            )}
          </View>
        </View>

        {/* Materials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách vật liệu</Text>
          <View style={styles.infoCard}> 
            {orderDetails.serviceOrderDetails && orderDetails.serviceOrderDetails.length > 0 ? (
              orderDetails.serviceOrderDetails.map((detail, index) => {
                const product = products[detail.productId];
                const unitPrice = detail.price || 0;
                const totalItemPrice = detail.totalPrice || (unitPrice * detail.quantity) || 0;
                
                return (
                  <View key={detail.productId || index} style={[styles.materialRow, index === orderDetails.serviceOrderDetails.length - 1 && styles.lastMaterialRow]}> 
                    {product?.image?.imageUrl ? (
                      <Image 
                        source={{ uri: product.image.imageUrl }} 
                        style={styles.materialImage} 
                        defaultSource={require('../assets/images/default_image.jpg')}
                      />
                    ) : (
                      <View style={styles.materialImagePlaceholder}>
                        <Icon name="image-off-outline" size={24} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialName} numberOfLines={2}>
                        {product ? product.name : `Product ID: ${detail.productId}`}
                      </Text>
                      <Text style={styles.materialMeta}>x{detail.quantity} | {unitPrice.toLocaleString('vi-VN')} VND</Text>
                    </View>
                    <Text style={styles.materialTotalPrice}>{totalItemPrice.toLocaleString('vi-VN')} VND</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noItemsText}>Không có vật liệu được liệt kê cho đơn hàng này.</Text>
            )}
          </View>
        </View>

        {/* Payment Details Section - USE CALCULATED VALUES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoCard}> 
            <PaymentRow 
              label="Giá thiết kế" 
              amount={`${(orderDetails.designPrice || 0).toLocaleString('vi-VN')} VND`} 
            />
            <PaymentRow 
              label="Giá vật liệu" 
              amount={`${calculatedMaterialPrice.toLocaleString('vi-VN')} VND`} // Use calculated value
              isLast={true} 
            />
            <View style={styles.totalPaymentRow}>
              <Text style={styles.totalLabel}>Tổng giá</Text>
              <Text style={styles.totalAmount}>
                {calculatedTotalCost.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>

        {/* Order Status Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
           
            <StatusTrackingNoCustom currentStatus={orderDetails.status} />
          
        </View>
      </ScrollView>
    </View>
  );
};

// --- Reusable Components ---
const Header = ({ navigation, title }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Icon name="chevron-left" size={28} color="#000" />
    </TouchableOpacity>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={{ width: 28 }} /> 
  </View>
);

const InfoRow = ({ icon, label, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color="#6c757d" style={styles.infoIcon}/>
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{text}</Text>
    </View>
  </View>
);

const PaymentRow = ({ label, amount, isLast = false }) => (
  <View style={[styles.paymentRow, isLast && styles.lastPaymentRow]}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={styles.paymentAmount}>{amount}</Text>
  </View>
);
// --- End Reusable Components ---

// --- Enhanced Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18, // Slightly smaller
    fontWeight: '600',
    color: '#343a40',
    textAlign: 'center',
    flex: 1, // Allow title to take space
    marginHorizontal: 10,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 17,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
  },
  statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15, // Pill shape
  },
  statusBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff', 
      marginLeft: 6,
  },
  orderDateText: {
      fontSize: 13,
      color: '#6c757d',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8, // Thicker separator
    borderBottomColor: '#F0F2F5',
  },
  sectionTitle: {
    fontSize: 17, // Slightly larger
    fontWeight: '700', // Bolder
    color: '#343a40',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon top
    marginBottom: 18,
  },
  infoIcon: {
    marginRight: 14,
    marginTop: 2, // Align icon better with text
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
      fontSize: 12,
      color: '#6c757d',
      marginBottom: 4,
      textTransform: 'uppercase', // Style label
      letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#343a40',
    lineHeight: 21, // Improve readability
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  lastMaterialRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  materialImage: {
    width: 60, // Slightly smaller
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F8F9FA',
  },
  materialImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  materialMeta: {
    fontSize: 13,
    color: '#6c757d',
  },
  materialTotalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginLeft: 10,
    textAlign: 'right',
  },
  noItemsText: {
      fontSize: 14,
      color: '#6c757d',
      textAlign: 'center',
      paddingVertical: 20,
      fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  lastPaymentRow: {
      borderBottomWidth: 0,
      paddingBottom: 0,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#343a40',
    fontWeight: '500',
  },
  totalPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default ServiceOrderDetailScreen;