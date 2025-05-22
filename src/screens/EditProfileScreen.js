import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToCloudinary } from '../hooks/UploadToCloud';
import { api } from '../api/api';

const EditProfileScreen = ({ navigation }) => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePhoto = () => {
    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1200,
      maxHeight: 1200,
      includeBase64: false,
    }, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'An error occurred while picking the image');
      } else if (response.assets && response.assets.length > 0) {
        try {
          setIsLoading(true);
          const imageUrl = await uploadImageToCloudinary(response.assets[0]);
          setAvatarUrl(imageUrl);
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put(`/users/${user.id}`, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarUrl
      });

      // Update the user context with new information
      const updatedUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarUrl
      };
      login(updatedUser);

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.avatarContainer}>
          <Image
            source={avatarUrl && avatarUrl !== 'string' ? { uri: avatarUrl } : require('../assets/images/avatar.jpg')}
            style={styles.avatar}
            defaultSource={require('../assets/images/avatar.jpg')}
          />
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
            disabled={isLoading}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f0f0f0' }]}
              value={email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TouchableOpacity 
              style={[styles.input, styles.addressInput]}
              onPress={() => navigation.navigate('ShippingAddress')}
            >
              <Text style={address ? styles.addressText : styles.addressPlaceholder}>
                {address || 'Select your address'}
              </Text>
              <Icon name="chevron-right" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePhotoButton: {
    marginTop: 10,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  addressPlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
});

export default EditProfileScreen; 