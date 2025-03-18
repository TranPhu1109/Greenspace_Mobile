import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserInfoScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={require('../assets/images/avatar.jpg')}
          style={styles.avatar}
          defaultSource={require('../assets/images/avatar.jpg')}
        />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="account-edit-outline" size={24} color="#007AFF" />
          <Text style={styles.optionText}>Edit Profile</Text>
          <Icon name="chevron-right" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('ShippingAddress')}
        >
          <Icon name="map-marker-outline" size={24} color="#007AFF" />
          <Text style={styles.optionText}>Shipping Address</Text>
          <Icon name="chevron-right" size={24} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="credit-card-outline" size={24} color="#007AFF" />
          <Text style={styles.optionText}>Wallet</Text>
          <Icon name="chevron-right" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserInfoScreen; 