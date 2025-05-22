import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext'; // Import useAuth
import axios from 'axios'; // Import axios
import {useFocusEffect} from '@react-navigation/native'; // Import useFocusEffect

const API_URL = 'http://192.168.1.2:8080/api'; // Adjust if needed

const MaterialOrderScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {user} = useAuth(); // Get user from auth context

  const fetchOrders = useCallback(async () => {
    if (!user || !user.backendToken) {
      setError('Người dùng chưa đăng nhập.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(
        `Fetching orders from ${API_URL}/orderproducts for user: ${user.id}`,
      );
      const response = await axios.get(`${API_URL}/orderproducts/user`, {
        headers: {
          Authorization: `Bearer ${user.backendToken}`,
        },
        params: {
          // Assuming you want to fetch orders for the current user
          userId: user.id,
        },
      });
      console.log('Orders fetched successfully:', response.data);
      // Assuming the API returns the array directly or nested under a 'data' key
      setOrders(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể tải danh sách đơn hàng.',
      );
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Use useFocusEffect to refetch orders when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const getStatusColor = status => {
    switch (status?.toString()) {
      case '0': // Pending
        return '#FFB700'; // Bright Orange
      case '1': // Processing
        return '#60A99D'; // Purple
      case '2': // Done
        return '#4CAF50'; // Green
      case '3': // Cancelled
        return '#E74C3C'; // Red
      case '4': // Refund
        return '#F39C12'; // Orange
      case '5': // DoneRefund
        return '#4CAF50'; // Green
      case '6': // PickedPackageAndDelivery
        return '#3498DB'; // Blue
      case '7': // DeliveryFail
        return '#E74C3C'; // Red
      case '8': // ReDelivery
        return '#F39C12'; // Lighter Orange/Yellow
      case '9': // DeliveredSuccessfully
        return '#2ECC71'; // Light Green
      case '10': // Completed
        return '#4CAF50'; // Darker Green
      default:
        return '#8E8E93'; // Grey for unknown
    }
  };

  const getStatusText = status => {
    switch (
      status?.toString() // Use toString() for safety
    ) {
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

  // Helper to format date string (YYYY-MM-DDTHH:mm:ss...) to YYYY-MM-DD
  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      return dateString.substring(0, 10);
    } catch {
      return dateString; // Fallback
    }
  };

  const renderOrder = ({item}) => {
    if (!item || typeof item.id !== 'string') {
      console.warn('Invalid item passed to renderOrder:', item);
      return null;
    }

    const statusString = item.status?.toString();
    const statusText = getStatusText(statusString) || '';
    const statusColor = getStatusColor(statusString) || '#8E8E93';

    const formattedDate = formatDate(item.creationDate) || '';
    const deliveryCode = item.deliveryCode || 'Mã vận chuyển';

    const itemCount = item.orderDetails?.length || 0;

    const totalAmount = item.totalAmount?.toLocaleString('vi-VN') || '0';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate('MaterialOrderDetail', {orderId: item.id})
        }>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>MĐH: {item.id.split('-')[0]}</Text>
          <View
            style={[styles.statusContainer, {backgroundColor: statusColor}]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="truck-delivery" size={20} color="#666" />
            <Text style={styles.detailText}>{deliveryCode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="package-variant" size={20} color="#666" />
            <Text style={styles.detailText}>
              {typeof itemCount === 'number'
                ? `${itemCount} sản phẩm`
                : '0 sản phẩm'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="cash" size={20} color="#666" />
            <Text style={styles.detailText}>
              {typeof totalAmount === 'string' ? `${totalAmount} VNĐ` : '0 VNĐ'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() =>
            navigation.navigate('MaterialOrderDetail', {orderId: item.id})
          }>
          <Text style={styles.viewButtonText}>Xem chi tiết</Text>
          <Icon name="chevron-right" size={20} color="#007AFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007AFF" style={styles.centered} />
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="clipboard-text-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Không có đơn hàng vật liệu nào.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchOrders}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    paddingHorizontal: 8,
    borderRadius: 5,
    overflow: 'hidden',
    marginLeft: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    paddingVertical: 3,
    textAlign: 'center',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 5,
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
});

export default MaterialOrderScreen;
