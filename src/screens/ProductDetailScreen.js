import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from '../context/CartContext';

const ProductDetailScreen = ({ route, navigation }) => {
  const { addToCartItem } = useContext(CartContext);
  const { product } = route.params;

  // fake  data 
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
      await addToCartItem(product);
      navigation.navigate('Cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <Image 
          source={require('../assets/images/furniture.jpg')}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
          </View>

          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>Specifications</Text>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Tên sản phẩm</Text>
              <Text style={styles.specValue}>Product name</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Giá</Text>
              <Text style={styles.specValue}>price</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>Category</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Chất liệu</Text>
              <Text style={styles.specValue}>Chất liệu</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Kích thước</Text>
              <Text style={styles.specValue}>Kích thước</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Trọng lượng</Text>
              <Text style={styles.specValue}>Trọng lượng</Text>
            </View>
          </View>

          {/* Feedback Section */}
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllFeedback')}>
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
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
          <Icon name="cart-outline" size={24} color="#fff" />
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  productImage: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  detailsContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  productPrice: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  specsContainer: {
    marginBottom: 20,
  },
  specsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  specLabel: {
    fontSize: 16,
    color: '#666',
  },
  specValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cartButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
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
    marginTop: 20,
    marginBottom: 20,
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
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  feedbackItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ProductDetailScreen; 