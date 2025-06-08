import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import SearchHeader from '../components/SearchHeader';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import {useCart} from '../context/CartContext';
import API_URL from '../api/api01';

//const API_URL = 'http://10.0.2.2:8080/api';
//const API_URL = 'http://192.168.1.2:8080/api';

//const API_URL = 'https://greenspace-webapi-container-app.graymushroom-37ee5453.southeastasia.azurecontainerapps.io/api';

const ShoppingScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigation = useNavigation();
  const {cartItems} = useCart();

  // Calculate cart count - number of unique products
  const cartCount = cartItems.length;

  // Define fetchCategories in component scope using useCallback
  const fetchCategories = useCallback(async () => {
    try {
      // Note: Don't reset error/loading here if called alongside fetchProducts
      const response = await axios.get(`${API_URL}/categories`);
      // Add "All" category as the first option
      setCategories([{id: null, name: 'Tất cả'}, ...response.data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(
        'Failed to load categories. Please check your connection and try again.',
      );
      Alert.alert('Error', 'Failed to load categories.', [{text: 'OK'}]);
    }
    // Note: Loading state is handled centrally below
  }, []);

  // Define fetchProducts in component scope using useCallback
  const fetchProducts = useCallback(async (page = 0, append = false) => {
    try {
      const response = await axios.get(`${API_URL}/product`, {
        params: {
          pageNumber: page,
          pageSize: 10
        }
      });
      
      const newProducts = response.data;
      
      // Check if we have more products to load
      setHasMore(newProducts.length === 10);
      
      if (append) {
        setProducts(prevProducts => [...prevProducts, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(
        'Failed to load products. Please check your connection and try again.',
      );
      Alert.alert('Error', 'Failed to load products.', [{text: 'OK'}]);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      setPageNumber(0);
      // Use Promise.all to fetch in parallel
      await Promise.all([fetchCategories(), fetchProducts(0, false)]);
      setIsLoading(false);
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependencies empty for mount-only fetch

  // Load more products when scrolling
  const loadMoreProducts = async () => {
    if (!hasMore || isLoadingMore || selectedCategory) return;
    
    setIsLoadingMore(true);
    const nextPage = pageNumber + 1;
    await fetchProducts(nextPage, true);
    setPageNumber(nextPage);
    setIsLoadingMore(false);
  };

  // Filter products by category
  useEffect(() => {
    if (selectedCategory && selectedCategory.id === null) {
      // If selectedCategory.id is null (Tất cả), show all products
      setFilteredProducts(products);
    } else if (selectedCategory && products.length > 0) {
      const filtered = products.filter(
        product => product.categoryId === selectedCategory.id,
      );
      setFilteredProducts(filtered);
    } else if (products.length > 0 && selectedCategory === null) {
      // Handle initial load where no category is selected, but 'Tất cả' is implicitly the default
      setFilteredProducts(products);
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

  const renderCategoryItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategory,
      ]}
      onPress={() => {
        setSelectedCategory(item);
        setIsCategoryModalVisible(false);
      }}>
      <Text
        style={[
          styles.categoryName,
          selectedCategory?.id === item.id && styles.selectedCategoryText,
        ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const CategoryDropdown = () => (
    <TouchableOpacity
      style={styles.dropdownButton}
      onPress={() => setIsCategoryModalVisible(true)}>
      <Text style={styles.dropdownButtonText}>
        {selectedCategory?.name || 'Tất cả'}
      </Text>
      <Icon name="chevron-down" size={20} color="#666" />
    </TouchableOpacity>
  );

  const CategoryModal = () => (
    <Modal
      visible={isCategoryModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsCategoryModalVisible(false)}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <TouchableOpacity
              onPress={() => setIsCategoryModalVisible(false)}
              style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id?.toString() || 'all'}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderProductItem = ({item}) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() =>
        navigation.navigate('ProductDetails', {productId: item.id})
      }>
      <Image
        source={{uri: item.image.imageUrl}}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Giá:</Text>
          <Text style={styles.productPrice}>
            {item.price.toLocaleString('vi-VN')}
            <Text style={styles.currencyText}> VND</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <>
      {/* <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/sale.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </View> */}

      <Text style={[styles.sectionTitle, styles.categoryTitle]}>Sản phẩm</Text>
      <View style={styles.dropdownContainer}>
        <CategoryDropdown />
        <CategoryModal />
      </View>
    </>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more products...</Text>
      </View>
    );
  };

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
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
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
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
  dropdownContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalList: {
    padding: 10,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCategory: {
    backgroundColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '500',
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
    shadowOffset: {width: 0, height: 2},
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default ShoppingScreen;
