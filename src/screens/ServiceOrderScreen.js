import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ServiceOrderScreen = ({ navigation }) => {
  
  const orders = [
    {
      id: '1',
      orderNumber: 'SO-2024001',
      date: '2024-03-15',
      status: 'Completed',
      service: 'Customize ban công',
      time: '10:00 AM',
      price: '$150.00',
    },
    {
      id: '2',
      orderNumber: 'SO-2024002',
      date: '2024-03-14',
      status: 'Completed',
      service: 'Full Customize',
      time: '2:30 PM',
      price: '$85.00',
    },
    {
      id: '3',
      orderNumber: 'SO-2024003',
      date: '2024-03-16',
      status: 'Processing',
      service: 'hello',
      time: '11:30 AM',
      price: '$75.00',
    },
  ];

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

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('ServiceOrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Icon name="briefcase" size={20} color="#666" />
          <Text style={styles.detailText}>{item.service}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={20} color="#666" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="clock" size={20} color="#666" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="cash" size={20} color="#666" />
          <Text style={styles.detailText}>{item.price}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => navigation.navigate('ServiceOrderDetail', { orderId: item.id })}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
        <Icon name="chevron-right" size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
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
  status: {
    fontSize: 14,
    fontWeight: '600',
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
});

export default ServiceOrderScreen; 