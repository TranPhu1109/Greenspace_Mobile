import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import SearchHeader from '../components/SearchHeader';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useCart } from '../context/CartContext';

// Replace 'YOUR_IP_ADDRESS' with your computer's IP address
// Example: const API_URL = 'http://192.168.1.5:8080/api';
const API_URL = 'http://192.168.1.2:8080/api'; // Use this for Android Emulator
// const API_URL = 'http://localhost:8080/api'; // Use this for iOS Simulator

const ShoppingScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { cartItems } = useCart();
  
  // Calculate cart count - number of unique products
  const cartCount = cartItems.length;

  // Define fetchCategories in component scope using useCallback
  const fetchCategories = useCallback(async () => {
    try {
      // Note: Don't reset error/loading here if called alongside fetchProducts
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
      // Set initial selected category only if categories were empty before
      if (categories.length === 0 && response.data.length > 0) {
         setSelectedCategory(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please check your connection and try again.');
      Alert.alert('Error', 'Failed to load categories.', [{ text: 'OK' }]);
    }
    // Note: Loading state is handled centrally below
  }, [categories.length]); // Dependency ensures initial selection logic runs correctly

  // Define fetchProducts in component scope using useCallback
  const fetchProducts = useCallback(async () => {
    try {
      // Note: Don't reset error/loading here
      const response = await axios.get(`${API_URL}/product`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please check your connection and try again.');
      Alert.alert('Error', 'Failed to load products.', [{ text: 'OK' }]);
    }
    // Note: Loading state is handled centrally below
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        setError(null);
        // Use Promise.all to fetch in parallel
        await Promise.all([fetchCategories(), fetchProducts()]);
        setIsLoading(false);
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependencies empty for mount-only fetch

  // Filter products by category
  useEffect(() => {
    if (selectedCategory && products.length > 0) {
      const filtered = products.filter(
        product => product.categoryId === selectedCategory.id
      );
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  // Retry handler
  const handleRetry = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      // Fetch both again
      await Promise.all([fetchCategories(), fetchProducts()]);
      setIsLoading(false);
  }, [fetchCategories, fetchProducts]);

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryName,
        selectedCategory?.id === item.id && styles.selectedCategoryText
      ]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={{ uri: item.image.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Giá:</Text>
          <Text style={styles.productPrice}>
            {item.price.toLocaleString('vi-VN')}
            <Text style={styles.currencyText}> VNĐ</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <>
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/furniture.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Summer Sale</Text>
          <Text style={styles.bannerSubtitle}>Sale up to 50% off</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.categoryTitle]}>Categories</Text>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        removeClippedSubviews={false}
      />

      {selectedCategory && (
        <Text style={[styles.sectionTitle, styles.productsTitle]}>{selectedCategory.name}</Text>
      )}
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchHeader title="Cửa hàng" cartCount={cartCount} />
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        removeClippedSubviews={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  bannerContainer: {
    height: 200,
    marginBottom: 20,
    position: 'relative',
  },
  bannerImage: {
    width: Dimensions.get('window').width,
    height: 200,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
  },
  categoryTitle: {
    marginBottom: 10,
  },
  productsTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryItem: {
    marginRight: 15,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  selectedCategory: {
    backgroundColor: '#e6f2ff',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  productsList: {
    paddingVertical: 10,
  },
  productItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
    height: 40,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#7f8c8d',
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShoppingScreen;