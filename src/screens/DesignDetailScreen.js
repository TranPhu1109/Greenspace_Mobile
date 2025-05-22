import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/api';

const { width } = Dimensions.get('window');

const DesignDetailScreen = ({ navigation, route }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [designData, setDesignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const scrollViewRef = useRef(null);
  
  const { designId } = route.params;
  const { isAuthenticated, user } = useAuth();

  // Use useFocusEffect to check authentication status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && route.params?.fromLogin) {
        handleBuyDesign();
        navigation.setParams({ fromLogin: undefined });
      }
    }, [isAuthenticated, route.params?.fromLogin])
  );

  useEffect(() => {
    fetchDesignDetails();
  }, [designId]);

  const fetchDesignDetails = async () => {  
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching design details for ID: ${designId}`);
      const response = await api.get(`/designidea/${designId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      console.log('Design details fetched successfully + response:', response);
      setDesignData(response);
      
      if (response.productDetails && response.productDetails.length > 0) {
        fetchMaterials(response.productDetails);
      }
    } catch (err) {
      console.error('Error fetching design details:', err);
      setError('Failed to load design details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (productDetails) => {
    
    if (!productDetails || productDetails.length === 0) return;
    
    setLoadingMaterials(true);
    try {
      const materialsPromises = productDetails.map(async (detail) => {
        const response = await api.get(`/product/${detail.productId}`);
        return {
          ...response,
          quantity: detail.quantity
        };
      });

      const materialsData = await Promise.all(materialsPromises);
      console.log("materialsData trong fetchMaterials:", materialsData);
      
      setMaterials(materialsData);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / width);
    setActiveImageIndex(currentIndex);
  };

  // New function to handle buying design
  const handleBuyDesign = () => {
    if (!isAuthenticated) {
      // Show login modal if user is not authenticated
      setShowLoginModal(true);
    } else {
      // User is authenticated, proceed to order screen
      navigation.navigate('Order', { designData, isCustomize: false });
    }
  };

  // Function to navigate to login screen
  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('Login', { 
      returnTo: 'DesignDetail',
      params: { 
        designId,
        fromLogin: true 
      }
    });
  };

  // Login Modal Component
  const LoginModal = () => (
    <Modal
      visible={showLoginModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLoginModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="account-lock-outline" size={60} color="#007AFF" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Đăng nhập yêu cầu</Text>
          <Text style={styles.modalMessage}>
            Bạn cần đăng nhập để tiếp tục mua thiết kế này
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalLoginButton]} 
              onPress={navigateToLogin}
            >
              <Text style={styles.modalLoginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show loading indicator while fetching design details
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin thiết kế...</Text>
      </View>
    );
  }

  // Show error message if fetch failed
  if (error || !designData) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ff3b30" />
        <Text style={styles.errorText}>{error || 'Không thể tải thông tin thiết kế'}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchDesignDetails}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare images array from design data
  const images = [
    designData.image?.imageUrl,
    designData.image?.image2,
    designData.image?.image3
  ].filter(Boolean); // Remove any null or undefined values

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{designData.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            removeClippedSubviews={false}
          >
            {images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.mainImage}
                defaultSource={require('../assets/images/default_image.jpg')}
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        </View>

        {/* Design Info Section */}
        <View style={styles.infoPanel}>
          <View style={styles.headingRow}>
            <Text style={styles.designName}>{designData.name}</Text>
            {designData.categoryName && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{designData.categoryName}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.description}>{designData.description}</Text>
          
          {/* Price Summary Cards */}
          <View style={styles.priceCardsContainer}>
            <View style={styles.priceCard}>
              <Icon name="palette-outline" size={22} color="#8A2BE2" style={styles.priceIcon} />
              <Text style={styles.priceLabel}>Thiết kế</Text>
              <Text style={styles.priceValue}>{designData.designPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
            
            <View style={[styles.priceCard, {backgroundColor: '#F0FFF0'}]}>
              <Icon name="package-variant" size={22} color="#228B22" style={styles.priceIcon} />
              <Text style={styles.priceLabel}>Vật liệu</Text>
              <Text style={styles.priceValue}>{designData.materialPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
            
            <View style={[styles.priceCard, {backgroundColor: '#F0F8FF'}]}>
              <Icon name="cash-multiple" size={22} color="#0000CD" style={styles.priceIcon} />
              <Text style={styles.priceLabel}>Tổng cộng</Text>
              <Text style={[styles.priceValue, {color: '#0000CD'}]}>{designData.totalPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        </View>

        {/* Materials Section */}
        <View style={styles.materialSection}>
          <View style={styles.sectionHeader}>
            <Icon name="package-variant-closed" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Danh sách vật liệu</Text>
          </View>
          
          {loadingMaterials ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.materialsLoading} />
          ) : materials.length > 0 ? (
            <View style={styles.materialsContainer}>
              {materials.map((material, index) => {
                const productDetail = designData.productDetails.find(p => p.productId === material.id);
                const unitPrice = material.price || (productDetail?.price || 0);
                const totalItemPrice = unitPrice * material.quantity;
                
                return (
                  <View key={index} style={styles.materialCard}>
                    <Image 
                      source={{ uri: material.image?.imageUrl }} 
                      style={styles.materialImage}
                      defaultSource={require('../assets/images/furniture.jpg')}
                    />
                    <View style={styles.materialDetails}>
                      <Text style={styles.materialName} numberOfLines={2}>{material.name}</Text>
                      
                      <View style={styles.materialMetaRow}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaText}>x{material.quantity}</Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Icon name="cash" size={16} color="#666" />
                          <Text style={styles.metaText}>{unitPrice.toLocaleString('vi-VN')} ₫</Text>
                        </View>
                      </View>
                      
                      <View style={styles.totalPriceTag}>
                        <Text style={styles.totalPriceText}>{totalItemPrice.toLocaleString('vi-VN')} ₫</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noMaterialsText}>Không có vật liệu</Text>
          )}
        </View>

        {/* Price Info Section */}
        <View style={styles.priceInfoSection}>
          <View style={styles.sectionHeader}>
            <Icon name="information-outline" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Chi tiết giá</Text>
          </View>
          
          <View style={styles.priceInfoCard}>
            <View style={styles.priceInfoRow}>
              <Text style={styles.priceInfoLabel}>Giá thiết kế cơ bản</Text>
              <Text style={styles.priceInfoValue}>{designData.designPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
            
            <View style={styles.priceInfoRow}>
              <View style={styles.priceInfoLabelContainer}>
                <Text style={styles.priceInfoLabel}>Chi phí vật liệu</Text>
                <Text style={styles.priceInfoSubLabel}>({materials.length} sản phẩm)</Text>
              </View>
              <Text style={styles.priceInfoValue}>{designData.materialPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalPriceLabel}>Tổng cộng</Text>
              <Text style={styles.totalPriceValue}>{designData.totalPrice?.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={handleBuyDesign}
          >
            <Icon name="cart-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Mua thiết kế này</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={styles.customizeButton}
            onPress={() => navigation.navigate('Order', { designData, isCustomize: true })}
          >
            <Icon name="pencil-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Tùy chỉnh thiết kế</Text>
          </TouchableOpacity> */}
        </View>

        {/* Add login modal */}
        <LoginModal />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  // New modern styling
  infoPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  designName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#E6F7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0070f3',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginVertical: 12,
  },
  
  // Price cards
  priceCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priceIcon: {
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  
  // Materials section
  materialSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  materialsContainer: {
    marginTop: 8,
  },
  materialCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    overflow: 'hidden',
  },
  materialImage: {
    width: 90,
    height: 90,
    backgroundColor: '#F5F5F5',
  },
  materialDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  materialName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  materialMetaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  totalPriceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  materialsLoading: {
    padding: 20,
  },
  noMaterialsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  
  // Action section
  actionSection: {
    padding: 16,
    marginBottom: 24,
  },
  buyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  customizeButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Price Info section
  priceInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceInfoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  priceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  priceInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInfoSubLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888',
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#f1f2f6',
  },
  modalLoginButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  modalLoginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default DesignDetailScreen;