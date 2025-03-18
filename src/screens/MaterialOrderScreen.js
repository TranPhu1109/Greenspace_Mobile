import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MaterialOrderScreen = ({ navigation }) => {
  const orders = [
    {
      id: '1',
      orderNumber: 'MO-2024001',
      date: '2024-03-15',
      status: 'Processing',
      total: '$299.99',
      items: 3,
    },
    {
      id: '2',
      orderNumber: 'MO-2024002',
      date: '2024-03-14',
      status: 'Processing',
      total: '$159.99',
      items: 2,
    },
    {
      id: '3',
      orderNumber: 'MO-2024003',
      date: '2024-03-13',
      status: 'Completed',
      total: '$499.99',
      items: 5,
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
      onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={20} color="#666" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="package-variant" size={20} color="#666" />
          <Text style={styles.detailText}>{item.items} items</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="cash" size={20} color="#666" />
          <Text style={styles.detailText}>{item.total}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => navigation.navigate('MaterialOrderDetail', { orderId: item.id })}
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

export default MaterialOrderScreen; 