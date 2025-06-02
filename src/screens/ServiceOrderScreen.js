import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/api';

// Helper function to format date
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

const ServiceOrderScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      } else {
        setError("User not identified. Cannot load orders.");
        setLoading(false);
      }
    }, [user])
  );

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
      const response = await api.get(`/serviceorder/userid-usingidea/${userId}`);
      const fetchedOrders = response.data || response;
      
      setOrders(fetchedOrders);
      console.log(`Fetched ${fetchedOrders.length} orders.`);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Bạn chưa có đơn hàng nào!');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
      setRefreshing(true);
      fetchOrders();
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { text: 'Chờ xử lý', color: '#FF9500' };
      case 'processing':
        return { text: 'Đang xử lý', color: '#007AFF' };
      case 'installing':
        return { text: 'Đang lắp đặt', color: '#5AC8FA' };
      case 'doneinstalling':
        return { text: 'Hoàn tất lắp đặt', color: '#34C759' };
      case 'reinstall':
        return { text: 'Lắp đặt lại', color: '#FF9500' };
      case 'successfully':
        return { text: 'Hoàn tất đơn hàng', color: '#34C759' };
      case 'ordercancelled':
        return { text: 'Đã hủy', color: '#FF3B30' };
      default:
        return { text: status || 'Không xác định', color: '#8E8E93' };
    }
  };

  const renderOrder = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const formattedDate = formatDate(item.creationDate);

    return (
        <TouchableOpacity 
          style={styles.orderCard}
          onPress={() => navigation.navigate('ServiceOrderDetail', { orderId: item.id })}
        >
          <View style={styles.orderHeader}>
              <View style={styles.headerLeft}>
                  <Text style={styles.orderNumber} numberOfLines={1} ellipsizeMode="tail">
                    Đơn hàng #{item.id.substring(0, 8)}
                  </Text>
                  <Text style={styles.orderDate}>{formattedDate}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Icon name={statusInfo.icon} size={14} color="#fff" />
                  <Text style={styles.statusText}>{statusInfo.text}</Text>
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
              <Text style={styles.detailText} >
                  {item.address ? item.address.split('|').join(', ') : 'N/A'}
              </Text>
            </View>
          </View>
    
          <View style={styles.pricingSection}>
            <Text style={styles.totalCostLabel}>Tổng giá:</Text>
            <Text style={styles.totalCostValue}>{item.totalCost?.toLocaleString('vi-VN') || 0} VND</Text>
          </View>
    
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate('ServiceOrderDetail', { orderId: item.id })}
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
        {/* <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Icon name="refresh" size={18} color="#fff" style={{ marginRight: 8 }}/>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <Icon name="clipboard-text-outline" size={60} color="#ccc" style={{ marginBottom: 15 }}/>
                <Text style={styles.emptyText}>Không tìm thấy đơn hàng.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
      flex: 1,
      marginRight: 10,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 4,
  },
  orderDate: {
      fontSize: 12,
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
});

export default ServiceOrderScreen; 