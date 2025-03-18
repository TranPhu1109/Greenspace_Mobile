import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ShippingAddressScreen = ({ navigation }) => {
  // fake data for addresses
  const addresses = [
    {
      id: '1',
      name: 'Home',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Office',
      address: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      isDefault: false,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Address</Text>
        <TouchableOpacity 
          onPress={() => {
            // Navigate to add new address screen
          }}
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressTitle}>
                <Text style={styles.addressName}>{address.name}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity>
                <Icon name="pencil-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>{address.address}</Text>
            <Text style={styles.addressText}>
              {address.city}, {address.state} {address.zipCode}
            </Text>

            {!address.isDefault && (
              <TouchableOpacity style={styles.setDefaultButton}>
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addAddressButton}>
        <Icon name="plus" size={24} color="#fff" />
        <Text style={styles.addAddressText}>Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  setDefaultButton: {
    marginTop: 12,
  },
  setDefaultText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  addAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ShippingAddressScreen; 