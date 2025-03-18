import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MaterialOrderDetailScreen = ({ navigation, route }) => {
  const orderDetails = {
    userInfo: {
      name: 'John Doe',
      address: '123 Main Street, New York, NY 10001',
      phone: '+1 234 567 890',
      orderTime: '10:00 AM',
      orderDate: '2024-03-15',
    },
    orderInfo: {
      orderNumber: 'MO-2024001',
      status: 'Processing',
    },
    products: [
      { 
        id: '1', 
        name: 'Modern Sofa', 
        quantity: 1, 
        price: 199.99,
        image: require('../assets/images/furniture.jpg') 
      },
      { 
        id: '2', 
        name: 'Coffee Table', 
        quantity: 1, 
        price: 89.99,
        image: require('../assets/images/furniture.jpg')
      },
      { 
        id: '3', 
        name: 'Floor Lamp', 
        quantity: 1, 
        price: 59.99,
        image: require('../assets/images/furniture.jpg')
      },
    ],
    payment: {
      subtotal: 349.97,
      shipping: 15.00,
      discount: 35.00,
      total: 329.97,
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return '#FF9500';
      case 'Completed':
        return '#4CAF50';
      default:
        return '#8E8E93';
    }
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

      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(orderDetails.orderInfo.status) }]}>
            {orderDetails.orderInfo.status}
          </Text>
          <Text style={styles.orderNumber}>Order #{orderDetails.orderInfo.orderNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="account" text={orderDetails.userInfo.name} />
            <InfoRow icon="phone" text={orderDetails.userInfo.phone} />
            <InfoRow icon="map-marker" text={orderDetails.userInfo.address} />
            <InfoRow icon="clock" text={`${orderDetails.userInfo.orderTime}, ${orderDetails.userInfo.orderDate}`} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.productsContainer}>
            {orderDetails.products.map((product) => (
              <View key={product.id} style={styles.productRow}>
                <Image 
                  source={product.image}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQuantity}>Quantity: {product.quantity}</Text>
                </View>
                <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentContainer}>
            <PaymentRow label="Subtotal" amount={`$${orderDetails.payment.subtotal.toFixed(2)}`} />
            <PaymentRow label="Shipping" amount={`$${orderDetails.payment.shipping.toFixed(2)}`} />
            <PaymentRow label="Discount" amount={`-$${orderDetails.payment.discount.toFixed(2)}`} isDiscount={true} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${orderDetails.payment.total.toFixed(2)}</Text>
            </View>
          </View>
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

const PaymentRow = ({ label, amount, isDiscount }) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={[
      styles.paymentAmount, 
      isDiscount ? styles.discountText : null
    ]}>
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
});

export default MaterialOrderDetailScreen; 