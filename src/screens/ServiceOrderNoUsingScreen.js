import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import OrderFilterBar from '../components/OrderFilterBar';

const API_BASE_URL_LOCALHOST = 'http://localhost:8080/api';
const API_BASE_URL_EMULATOR = 'http://10.0.2.2:8080/api';

// Helper function to format date
const formatDate = (dateString, compact = false) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (compact) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit'
      }) + ' ' + date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
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

const ServiceOrderNoUsingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterParams, setFilterParams] = useState({
    searchText: '',
    status: { id: 'all', name: 'Tất cả', value: null },
    dateFilter: { id: 'all', name: 'Tất cả' }
  });

  // Memoize the filter change handler to prevent recreating on each render
  const handleFilterChange = useCallback((newFilters) => {
    setFilterParams(newFilters);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      } else {
        setError("User not identified. Cannot load orders.");
        setLoading(false);
      }
      
      return () => {};
    }, [user])
  );

  // Apply filters when orders or filter params change
  useEffect(() => {
    applyFilters();
  }, [orders, filterParams]);

  const fetchOrders = async () => {
    if (!user?.id) {
        setError("User ID is missing.");
        setLoading(false);
        setRefreshing(false);
        return;
    }
    
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      
      const userId = user.id;
      const urlPath = `/serviceorder/userid-nousingidea/${userId}`;
      let response;

      try {
        response = await axios.get(`${API_BASE_URL_LOCALHOST}${urlPath}`, {
            headers: { 'Authorization': `Bearer ${user.backendToken}` },
            timeout: 5000
        });
      } catch (err) {
        console.warn("Localhost fetch failed, trying emulator URL...");
        response = await axios.get(`${API_BASE_URL_EMULATOR}${urlPath}`, {
            headers: { 'Authorization': `Bearer ${user.backendToken}` }
        });
      }

      const fetchedOrders = response.data || [];
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Filter orders based on filter parameters
  const applyFilters = () => {
    let result = [...orders];
    
    // Apply status filter - now handling both single values and arrays of values
    if (filterParams.status && filterParams.status.id !== 'all' && filterParams.status.value) {
      result = result.filter(order => {
        if (!order.status) return false;
        const orderStatus = order.status.toLowerCase();
        
        // Handle both string and array values
        if (Array.isArray(filterParams.status.value)) {
          return filterParams.status.value.includes(orderStatus);
        } else {
          return orderStatus === filterParams.status.value.toLowerCase();
        }
      });
    }
    
    // Apply date filter
    if (filterParams.dateFilter.id !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filterParams.dateFilter.id) {
        case 'today':
          result = result.filter(order => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= today;
          });
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          result = result.filter(order => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= weekStart;
          });
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          result = result.filter(order => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= monthStart;
          });
          break;
        case '3months':
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(today.getMonth() - 3);
          result = result.filter(order => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= threeMonthsAgo;
          });
          break;
      }
    }
    
    // Apply text search filter
    if (filterParams.searchText.trim() !== '') {
      const searchText = filterParams.searchText.toLowerCase().trim();
      result = result.filter(order => 
        (order.userName && order.userName.toLowerCase().includes(searchText)) ||
        (order.cusPhone && order.cusPhone.toLowerCase().includes(searchText)) ||
        (order.address && order.address.toLowerCase().includes(searchText)) ||
        (order.id && order.id.toLowerCase().includes(searchText))
      );
    }
    
    setFilteredOrders(result);
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { text: 'Chờ xử lý', color: '#FF9500', icon: 'credit-card-clock-outline' };
      case 'consultingandsketching':
        return { text: 'Đang tư vấn & phác thảo', color: '#5856D6', icon: 'pencil-outline' };
      case 'determiningdesignprice':
        return { text: 'Đang tư vấn & phác thảo', color: '#5856D6', icon: 'calculator-variant-outline' };
      case 'depositsuccessful':
        return { text: 'Đặt cọc thành công', color: '#34C759', icon: 'check-circle-outline' };
      case 'assigntodesigner':
        return { text: 'Đang trong quá trình thiết kế', color: '#007AFF', icon: 'account-switch-outline' };
      case 'determiningmaterialprice':
        return { text: 'Đang trong quá trình thiết kế', color: '#007AFF', icon: 'calculator-variant-outline' };
      case 'donedesign':
        return { text: 'Hoàn thành thiết kế', color: '#34C759', icon: 'check-outline' };
      case 'paymentsuccess':
        return { text: 'Thanh toán thành công', color: '#34C759', icon: 'credit-card-check-outline' };
      case 'processing':
        return { text: 'Đang xử lý', color: '#FF9500', icon: 'cogs' };
      case 'pickedpackageanddelivery':
        return { text: 'Đã lấy hàng & đang giao', color: '#5AC8FA', icon: 'truck-delivery-outline' };
      case 'deliveryfail':
        return { text: 'Giao hàng thất bại', color: '#FF3B30', icon: 'alert-circle-outline' };
      case 'redelivery':
        return { text: 'Giao lại', color: '#FF9500', icon: 'truck-fast-outline' };
      case 'deliveredsuccessfully':
        return { text: 'Đã giao hàng thành công', color: '#34C759', icon: 'truck-check-outline' };
      case 'completeorder':
        return { text: 'Hoàn thành đơn hàng', color: '#30A46C', icon: 'check-decagram-outline' };
      case 'ordercancelled':
        return { text: 'Đơn hàng đã bị hủy', color: '#FF3B30', icon: 'cancel' };
      case 'warning':
        return { text: 'Cảnh báo vượt 30%', color: '#FF3B30', icon: 'alert-outline' };
      case 'refund':
        return { text: 'Hoàn tiền', color: '#FF9500', icon: 'cash-refund' };
      case 'donerefund':
        return { text: 'Đã hoàn tiền', color: '#34C759', icon: 'cash-check' };
      case 'stopservice':
        return { text: 'Dừng dịch vụ', color: '#8E8E93', icon: 'stop-circle-outline' };
      case 'reconsultingandsketching':
        return { text: 'Phác thảo lại', color: '#5856D6', icon: 'pencil-outline' };
      case 'redesign':
        return { text: 'Thiết kế lại', color: '#5856D6', icon: 'pencil-outline' };
      case 'waitdeposit':
        return { text: 'Chờ đặt cọc', color: '#FF9500', icon: '' };
      case 'donedeterminingdesignprice':
        return { text: 'Hoàn thành tư vấn & phác thảo', color: '#34C759', icon: 'check-outline' };
      case 'donedeterminingmaterialprice':
        return { text: 'Chọn bản thiết kế', color: '#34C759', icon: 'check-outline' };
      case 'redeterminingdesignprice':
        return { text: 'Xác định lại giá thiết kế', color: '#5AC8FA', icon: 'calculator-variant-outline' };
      case 'exchangeprodcut':
        return { text: 'Đổi sản phẩm', color: '#FF9500', icon: 'swap-horizontal' };
      case 'waitforscheduling':
        return { text: 'Chờ lên lịch', color: '#FF9500', icon: 'calendar-clock' };
      case 'installing':
        return { text: 'Đang lắp đặt', color: '#007AFF', icon: 'hammer-wrench' };
      case 'doneinstalling':
        return { text: 'Đã lắp đặt xong', color: '#34C759', icon: 'check-outline' };
      case 'reinstall':
        return { text: 'Lắp đặt lại', color: '#FF9500', icon: 'hammer-wrench' };
      case 'customerconfirm':
        return { text: 'Khách hàng xác nhận', color: '#34C759', icon: 'check-circle-outline' };
      case 'successfully':
        return { text: 'Thành công', color: '#34C759', icon: 'check-decagram-outline' };
      default:
        return { text: status || 'Không xác định', color: '#8E8E93', icon: 'help-circle-outline' };
    }
  };

  const renderOrder = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const formattedDate = formatDate(item.creationDate, true);

    return (
        <TouchableOpacity 
          style={styles.orderCard}
          onPress={() => navigation.navigate('ServiceOrderNoUsingDetail', { orderId: item.id })}
        >
          <View style={styles.orderHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.orderTitleRow}>
                <Text style={styles.orderNumber} numberOfLines={1} ellipsizeMode="tail">
                  Đơn hàng #{item.id.substring(0, 8)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Text style={styles.statusText}>{statusInfo.text}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{formattedDate}</Text>
            </View>
          </View>
          
          <View style={styles.customerInfoSection}>
            <View style={styles.detailRow}>
              <Icon name="account-outline" size={18} color="#555" />
              <Text style={styles.detailText}>{item.userName || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="phone-outline" size={18} color="#555" />
              <Text style={styles.detailText}>{item.cusPhone || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="map-marker-outline" size={18} color="#555" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.address || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="ruler" size={18} color="#555" />
              <Text style={styles.detailText}>
                {item.length}m x {item.width}m
              </Text>
            </View>
          </View>
    
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate('ServiceOrderNoUsingDetail', { orderId: item.id })}
          >
            <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
            <Icon name="chevron-right" size={22} color="#007AFF" />
          </TouchableOpacity>
        </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#ff3b30" style={{ marginBottom: 15 }}/>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Icon name="refresh" size={18} color="#fff" style={{ marginRight: 8 }}/>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OrderFilterBar onFilterChange={handleFilterChange} />
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-outline" size={60} color="#ccc" style={{ marginBottom: 15 }}/>
            <Text style={styles.emptyText}>
              {orders.length > 0 
                ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'
                : 'Không tìm thấy đơn hàng.'}
            </Text>
            {orders.length > 0 && filterParams.status.id !== 'all' && (
              <TouchableOpacity 
                style={styles.resetFilterButton}
                onPress={() => setFilterParams({
                  searchText: '',
                  status: { id: 'all', name: 'Tất cả', value: null },
                  dateFilter: { id: 'all', name: 'Tất cả' }
                })}
              >
                <Text style={styles.resetFilterText}>Đặt lại bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
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
  listContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 0,
  },
  orderHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    width: '100%',
  },
  orderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
  },
  orderDate: {
    fontSize: 13,
    color: '#6c757d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  customerInfoSection: {
      marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
  },
  pricingSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 15,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
  },
  totalCostLabel: {
      fontSize: 14,
      color: '#6c757d',
      fontWeight: '500',
  },
  totalCostValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#007AFF',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: '#E9F5FF',
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  resetFilterButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resetFilterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ServiceOrderNoUsingScreen;
