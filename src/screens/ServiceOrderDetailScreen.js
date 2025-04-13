import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StatusTracking from '../components/StatusTracking';
import StatusTrackingNoCustom from '../components/StatusTrackingNoCustom';
import axios from 'axios';

const ServiceOrderDetailScreen = ({ navigation, route }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  console.log(orderDetails);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState({});
  const { orderId } = route.params;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchProductDetails = async (productId) => {
    try {
      const response = await axios.get(`http://10.0.2.2:8080/api/product/${productId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching product ${productId}:`, err);
      return null;
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://10.0.2.2:8080/api/serviceorder/${orderId}`);
      console.log(response.data);
      
      const orderData = response.data; // Now it's a single object, not an array
      setOrderDetails(orderData);
      
      // Fetch product details for each service order detail
      const productPromises = orderData.serviceOrderDetails.map(detail => 
        fetchProductDetails(detail.productId)
      );
      const productResults = await Promise.all(productPromises);
      
      // Create a map of productId to product details
      const productMap = {};
      orderData.serviceOrderDetails.forEach((detail, index) => {
        productMap[detail.productId] = productResults[index];
      });
      
      setProducts(productMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return 'Pending';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !orderDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Order details not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      <ScrollView style={styles.content} removeClippedSubviews={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="account" text={orderDetails.userName} />
            <InfoRow icon="phone" text={orderDetails.cusPhone} />
            <InfoRow icon="map-marker" text={orderDetails.address} />
            {orderDetails.isCustom && (
              <InfoRow icon="ruler-square" text={`${orderDetails.length}m x ${orderDetails.width}m`} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="brush" text={orderDetails.isCustom ? "Custom Design" : "Using Design Idea"} />
            {orderDetails.description && (
              <InfoRow icon="text-box" text={orderDetails.description} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          <View style={styles.materialsContainer}>
            {orderDetails.serviceOrderDetails.map((detail) => {
              const product = products[detail.productId];
              return (
                <View key={detail.productId} style={styles.materialRow}>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>
                      {product ? product.name : `Product ID: ${detail.productId}`}
                    </Text>
                    <Text style={styles.materialQuantity}>Quantity: {detail.quantity}</Text>
                    <Text style={styles.materialPrice}>
                      {detail.totalPrice.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentContainer}>
            <PaymentRow 
              label="Design Price" 
              amount={`${orderDetails.designPrice.toLocaleString('vi-VN')} VND`} 
            />
            <PaymentRow 
              label="Materials Price" 
              amount={`${orderDetails.materialPrice.toLocaleString('vi-VN')} VND`} 
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                {orderDetails.totalCost.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          {orderDetails.isCustom ? (
            <StatusTracking currentStatus={getStatusText(orderDetails.status)} />
          ) : (
            <StatusTrackingNoCustom currentStatus={getStatusText(orderDetails.status)} />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const PaymentRow = ({ label, amount }) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={styles.paymentAmount}>{amount}</Text>
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
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
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceOrderDetailScreen;