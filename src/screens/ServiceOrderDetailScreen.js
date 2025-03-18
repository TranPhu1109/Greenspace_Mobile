import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ServiceOrderDetailScreen = ({ navigation, route }) => {
  
  const orderDetails = {
    
    userInfo: {
      name: 'John Doe',
      address: '123 Main Street, New York, NY 10001',
      phone: '+1 234 567 890',
      orderTime: '10:00 AM',
      orderDate: '2024-03-15',
    },
    
    serviceInfo: {
      serviceName: 'Customize ban công',
      orderNumber: 'SO-2024001',
      designArea: '15 m²',
      status: 'Completed',
    },
    
    materials: [
      { 
        id: '1', 
        name: 'Wooden Flooring', 
        quantity: '15 m²', 
        price: '$450', 
        image: require('../assets/images/furniture.jpg') 
      },
      { 
        id: '2', 
        name: 'LED Lights', 
        quantity: '5 pieces', 
        price: '$100',
        image: require('../assets/images/furniture.jpg')
      },
      { 
        id: '3', 
        name: 'Paint', 
        quantity: '2 gallons', 
        price: '$80',
        image: require('../assets/images/furniture.jpg')
      },
      { 
        id: '4', 
        name: 'Plant Pots', 
        quantity: '3 pieces', 
        price: '$90',
        image: require('../assets/images/furniture.jpg')
      },
    ],
    
    payment: {
      designPrice: 150,
      materialPrice: 720,
      totalPrice: 870,
      paid: 870,
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
          <Text style={[styles.statusText, { color: getStatusColor(orderDetails.serviceInfo.status) }]}>
            {orderDetails.serviceInfo.status}
          </Text>
          <Text style={styles.orderNumber}>Order #{orderDetails.serviceInfo.orderNumber}</Text>
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
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="brush" text={orderDetails.serviceInfo.serviceName} />
            <InfoRow icon="ruler-square" text={`Design Area: ${orderDetails.serviceInfo.designArea}`} />
          </View>
        </View>

       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          <View style={styles.materialsContainer}>
            {orderDetails.materials.map((material) => ( 
              <View key={material.id} style={styles.materialRow}>
                {/* <Image 
                  source={material.image || require('../assets/images/default-material.png')}
                  style={styles.materialImage}
                  defaultSource={require('../assets/images/default-material.png')}
                /> */}
                <Image 
                  source={material.image}
                  style={styles.materialImage}
                  
                />
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>{material.quantity}</Text>
                </View>
                <Text style={styles.materialPrice}>{material.price}</Text>
              </View>
            ))}
          </View>
        </View>

        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentContainer}>
            <PaymentRow label="Design Price" amount={`$${orderDetails.payment.designPrice}`} />
            <PaymentRow label="Materials Price" amount={`$${orderDetails.payment.materialPrice}`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${orderDetails.payment.totalPrice}</Text>
            </View>
            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Paid Amount</Text>
              <Text style={styles.paidAmount}>${orderDetails.payment.paid}</Text>
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
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  paidLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  paidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default ServiceOrderDetailScreen; 