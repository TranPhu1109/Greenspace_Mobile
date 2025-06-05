import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import CustomModal from '../components/Modal';
import { api } from '../api/api';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { addToCartItem, cartItems } = useCart();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  
  // Calculate cart count - number of unique products, not the total quantity
  const cartCount = cartItems.length;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Toast animation function
  const showToastWithAnimation = () => {
    setShowToast(true);
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    
    // Run parallel animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    // Hide after delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowToast(false);
      });
    }, 2000);
  };

  // --- Feedback State ---
  const [feedbacks, setFeedbacks] = useState([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState(null);
  // --- End Feedback State ---

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', buttons: [], icon: null });

  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchProductDetailsAndFeedback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setFeedbackError(null); // Reset feedback error
        setIsFeedbackLoading(true); // Start feedback loading
        
        // Fetch Product Details
        const productResponse = await api.get(`/product/${productId}`);
        setProduct(productResponse);
        
        // Fetch Feedback after product details are loaded
        try {
          const feedbackResponse = await api.get(`/productfeedback/${productId}/products`);
          setFeedbacks(feedbackResponse || []); // Assuming API returns array directly
          setFeedbackError(null);
        } catch (feedbackErr) {
          
          if (feedbackErr.message?.includes("No productFeedback found")) {
            setFeedbacks([]); 
            setFeedbackError(null); // Treat as no data, not an error
          } else {
            // Handle other types of errors (network, server, etc.)
            setFeedbackError('Chưa có đánh giá nào cho sản phẩm này');
            setFeedbacks([]); // Ensure feedbacks is empty on general error
          }
        } finally {
          setIsFeedbackLoading(false); // Stop feedback loading
        }

      } catch (error) {
        //console.error('Error fetching product details:', error);
        const errorMessage = 'Failed to load product details. Please try again.';
        setError(errorMessage);
        setModalConfig({
          title: 'Lỗi tải sản phẩm',
          message: errorMessage,
          buttons: [{ text: 'Quay lại', onPress: () => { setIsModalVisible(false); navigation.goBack(); } }]
        });
        setIsModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetailsAndFeedback(); // Call the combined function
  }, [productId]);

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
      
      // Show toast notification instead of modal
      showToastWithAnimation();
      
      // We keep error handling with the modal
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Configure and show error modal
      const errorConfig = {
        icon: { name: 'alert-circle-outline', color: '#e74c3c' }, // Error Icon
        title: 'Lỗi thêm vào giỏ',
        message: 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.',
        buttons: [{ text: 'Đồng ý', onPress: () => setIsModalVisible(false), style: 'confirm' }]
      };
      setModalConfig(errorConfig);
      setIsModalVisible(true);
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

  if (error && !product && !isModalVisible) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return null;
  }


  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastWrapper}>
          <Animated.View 
            style={[
              styles.toastContainer,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <Icon name="cart" size={24} color="#FFFFFF" />
            <Text style={styles.toastText}>Đã thêm sản phẩm vào giỏ hàng!</Text>
          </Animated.View>
        </View>
      )}
      
      {/* Header with back button, title and cart icon */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.cartIconContainer}>
            <Icon name="cart-outline" size={24} color="#000" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} removeClippedSubviews={false} nestedScrollEnabled={true}>
        {/* Image Gallery - Add key to make sure we recreate the component when needed */}
        <View style={styles.imageGalleryContainer}>
          <ScrollView
            key="imageGallery"
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
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
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price.toLocaleString('vi-VN')} VNĐ</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
            {product.description ? (
              <RenderHtml
                contentWidth={width}
                source={{ html: product.description }}
                tagsStyles={styles.htmlTagsStyles}
              />
            ) : (
              <Text style={styles.description}>Không có mô tả sản phẩm.</Text>
            )}
          </View>

          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>Thông tin sản phẩm</Text>
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
              <Text style={styles.feedbackTitle}>Đánh giá từ người dùng</Text>
              {/* <TouchableOpacity onPress={() => navigation.navigate('AllFeedback', { productId: product.id })}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity> */}
            </View>
            
            {/* Feedback Loading/Error/Content */}
            {isFeedbackLoading ? (
              <ActivityIndicator style={{ marginTop: 15 }} size="small" color="#007AFF" />
            ) : feedbackError ? (
              <Text style={styles.feedbackErrorText}>{feedbackError}</Text>
            ) : feedbacks.length === 0 ? (
              <Text style={styles.noFeedbackText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
            ) : (
              feedbacks.map((feedback) => (
                <View key={feedback.id} style={styles.feedbackItem}>
                  <View style={styles.userInfo}>
                    <Icon name="account-circle" size={24} color="#666" />
                    <Text style={styles.userName}>{feedback.userName|| 'Người dùng ẩn danh'}</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    {renderStars(feedback.rating)}
                  </View>
                  <Text style={styles.feedbackComment}>{feedback.description}</Text>
                </View>
              ))
            )}
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

      <CustomModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContentContainer}> 
          {/* Add Icon Rendering */}
          {modalConfig.icon && (
            <Icon name={modalConfig.icon.name} size={50} color={modalConfig.icon.color || '#007AFF'} style={styles.modalIcon} />
          )}
          {modalConfig.title ? (
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
          ) : null}
          {modalConfig.message ? (
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
          ) : null}
          <View style={styles.modalButtonContainer}>
            {modalConfig.buttons && modalConfig.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalButton,
                  button.style === 'cancel' ? styles.modalButtonCancel : {},
                  button.style === 'confirm' ? styles.modalButtonConfirm : {}
                ]}
                onPress={button.onPress}
              >
                <Text style={[
                  styles.modalButtonText,
                  button.style === 'cancel' ? styles.modalButtonTextCancel : {},
                  button.style === 'confirm' ? styles.modalButtonTextConfirm : {}
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  imageGalleryContainer: {
    height: 350,
    backgroundColor: '#fff',
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
    backgroundColor: '#4CAF50',
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
  modalContentContainer: {
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalButtonCancel: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalButtonTextCancel: {
     color: '#555',
  },
   modalButtonTextConfirm: {
     color: '#fff',
   },
   // Feedback specific styles
   noFeedbackText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
   },
   feedbackErrorText: {
     fontSize: 14,
     color: '#e74c3c',
     textAlign: 'center',
     marginTop: 15,
   },
   toastWrapper: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1000,
     pointerEvents: 'none',
   },
   toastContainer: {
     backgroundColor: 'rgba(60, 60, 60, 0.92)',
     paddingVertical: 12,
     paddingHorizontal: 20,
     borderRadius: 8,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
     elevation: 4,
     maxWidth: screenWidth * 0.8,
   },
   toastText: {
     color: '#fff',
     fontSize: 15,
     fontWeight: '600',
     marginLeft: 10,
   },
   cartIconContainer: {
     position: 'relative',
     width: 24,
     height: 24,
   },
   cartBadge: {
     position: 'absolute',
     top: -8,
     right: -10,
     backgroundColor: '#e74c3c',
     borderRadius: 10,
     minWidth: 18,
     height: 18,
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: 4,
     borderWidth: 1.5,
     borderColor: '#fff',
   },
   cartBadgeText: {
     color: '#fff',
     fontSize: 10,
     fontWeight: 'bold',
     textAlign: 'center',
   },
   htmlTagsStyles: {
    body: {
      margin: 0,
      padding: 0,
      fontSize: 15,
      color: '#34495e',
      lineHeight: 22,
    },
    p: {
        marginBottom: 10,
    }
  },
});

export default ProductDetailScreen; 