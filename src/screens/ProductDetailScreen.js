import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from '../context/CartContext';
import axios from 'axios';


const API_URL = 'http://10.0.2.2:8080/api';

const ProductDetailScreen = ({ route, navigation }) => {
  const { addToCartItem } = useContext(CartContext);
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/product/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details. Please try again.');
        Alert.alert(
          'Error',
          'Failed to load product details. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // fake feedback data (you can replace this with an API call if you have feedback endpoints)
  const feedbacks = [
    {
      id: 1,
      userName: 'User 1',
      rating: 5,
      comment: 'Sản phẩm ok lắm',
    },
    {
      id: 2,
      userName: 'User 2',
      rating: 5,
      comment: 'Chất lượng sản phẩm tốt nhưng giá mắc quá',
    },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Icon
        key={index}
        name="star"
        size={16}
        color={index < rating ? '#FFD700' : '#E5E5EA'}
        style={{ marginRight: 2 }}
      />
    ));
  };

  const handleAddToCart = async () => {
    try {
      setIsSyncing(true);
      await addToCartItem(product);
      Alert.alert(
        'Thành công',
        'Đã thêm sản phẩm vào giỏ hàng',
        [
          {
            text: 'Tiếp tục mua sắm',
            style: 'cancel',
          },
          {
            text: 'Đi đến giỏ hàng',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert(
        'Lỗi',
        'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.',
        [{ text: 'Đồng ý' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy sản phẩm'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} removeClippedSubviews={false}>
        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {product.image.imageUrl && (
            <Image 
              source={{ uri: product.image.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
          {product.image.image2 && product.image.image2.trim() !== '' && (
            <Image 
              source={{ uri: product.image.image2 }}
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
          {product.image.image3 && product.image.image3.trim() !== '' && (
            <Image 
              source={{ uri: product.image.image3 }}
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
        </ScrollView>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price.toLocaleString('vi-VN')} VNĐ</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>Thông số kỹ thuật</Text>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Tên sản phẩm</Text>
              <Text style={styles.specValue}>{product.name}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Giá bán</Text>
              <Text style={styles.specValue}>{product.price.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Danh mục</Text>
              <Text style={styles.specValue}>{product.categoryName}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Số lượng kho</Text>
              <Text style={styles.specValue}>{product.stock} sản phẩm</Text>
            </View>
            
          </View>

          {/* Feedback Section */}
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>Đánh giá sản phẩm</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllFeedback', { productId: product.id })}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            
            {feedbacks.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackItem}>
                <View style={styles.userInfo}>
                  <Icon name="account-circle" size={24} color="#666" />
                  <Text style={styles.userName}>{feedback.userName}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  {renderStars(feedback.rating)}
                </View>
                <Text style={styles.feedbackComment}>{feedback.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[
            styles.cartButton,
            product.stock === 0 && styles.disabledButton,
            isSyncing && styles.syncingButton
          ]} 
          onPress={handleAddToCart}
          disabled={product.stock === 0 || isSyncing}
        >
          <Icon name="cart-outline" size={24} color="#fff" />
          <Text style={styles.cartButtonText}>
            {product.stock === 0 ? 'Hết hàng' : 
             isSyncing ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    height: 350,
    backgroundColor: '#fff',
  },
  productImage: {
    width: Dimensions.get('window').width,
    height: 350,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 28,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  description: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
  },
  specsContainer: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  specsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  specLabel: {
    fontSize: 15,
    color: '#7f8c8d',
    flex: 1,
  },
  specValue: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cartButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  feedbackContainer: {
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  feedbackItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    color: '#2c3e50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncingButton: {
    backgroundColor: '#95a5a6',
  },
});

export default ProductDetailScreen; 