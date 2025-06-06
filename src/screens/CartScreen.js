import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CommonActions, useFocusEffect } from '@react-navigation/native';

const CartScreen = ({ navigation, route }) => {
  const {
    cartItems,
    deleteCartItem,
    updateQuantity,
    totalPrice, // Now reflects selected items' total
    ensureServerCart,
    isSyncing,
    selectedItemIds,   // Get selected IDs
    toggleItemSelection, // Get toggle function
    selectAllItems,    // Get select all function
    deselectAllItems, // Get deselect all function
  } = useCart();
  
  const { isAuthenticated } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [shouldProceedToCheckout, setShouldProceedToCheckout] = useState(false);

  // --- Helper to check if all items are selected ---
  const areAllItemsSelected = cartItems.length > 0 && selectedItemIds.length === cartItems.length;

  // --- Toggle Select All --- 
  const handleToggleSelectAll = () => {
    if (areAllItemsSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };
  // --- End Select All Logic ---

  // When screen comes into focus, check if we should proceed to checkout
  useFocusEffect(
    React.useCallback(() => {
      // If user is authenticated and we previously wanted to checkout
      if (isAuthenticated && shouldProceedToCheckout) {
        setShouldProceedToCheckout(false); // Reset the flag
        // Proceed with checkout
        handleCheckout(true);
      }
    }, [isAuthenticated, shouldProceedToCheckout])
  );

  const navigateToLogin = () => {
    setShowLoginModal(false);
    // Set flag to indicate we should proceed to checkout when returning
    setShouldProceedToCheckout(true);
    // Navigate to Login screen with simple returnTo parameter
    navigation.navigate('Login', { returnTo: true });
  };

  const handleDeleteItem = async (id) => {
    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        { 
          text: "Xóa", 
          onPress: () => deleteCartItem(id),
          style: 'destructive'
        }
      ]
    );
  };

  const handleCheckout = async (skipAuthCheck = false) => {
    // Check if any items are SELECTED
    if (selectedItemIds.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một sản phẩm để đặt hàng");
      return;
    }

    // Check authentication status if not skipped
    if (!skipAuthCheck && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsCheckingOut(true);
      
      // Ensure cart is synced to server before navigating to checkout
      await ensureServerCart();
      
      // Prepare selected items data for checkout
      const selectedItemsData = cartItems
        .filter(item => selectedItemIds.includes(item.id))
        .map(item => ({ 
          id: item.id, 
          quantity: item.quantity, 
          price: item.price, 
          name: item.name, // Pass necessary info
          image: item.image // Pass image info
        }));

      // Navigate to checkout screen WITH SELECTED ITEMS
      navigation.navigate('CheckOut', { selectedItems: selectedItemsData });
    } catch (error) {
      console.error('Error preparing checkout:', error);
      
      // Show appropriate error message
      if (error.message === 'User not authenticated') {
        setShowLoginModal(true);
      } else {
        Alert.alert("Lỗi", `Không thể tiến hành đặt hàng: ${error.message}`);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Modal to prompt login
  const LoginModal = () => (
    <Modal
      visible={showLoginModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLoginModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="account-lock-outline" size={60} color="#4CAF50" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.modalMessage}>
            Bạn cần đăng nhập để tiếp tục đặt hàng
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalCancelButton]} 
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalLoginButton]} 
              onPress={navigateToLogin}
            >
              <Text style={styles.modalLoginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCartItem = ({ item }) => {
    const isSelected = selectedItemIds.includes(item.id);
    
    return (
      // Wrap item in TouchableOpacity to allow toggling selection by tapping anywhere on the item
      <TouchableOpacity 
        style={styles.cartItemContainer} 
        onPress={() => toggleItemSelection(item.id)} 
        activeOpacity={0.8}
      >
        <View style={styles.selectionIndicator}>
          <Icon 
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={26}
            color={isSelected ? '#4CAF50' : '#bdc3c7'}
          />
        </View>
        <View style={[styles.cartItem, isSelected ? {} : styles.cartItemUnselected]}>
          <Image 
            source={{ uri: item.image.imageUrl }}
            style={styles.cartItemImage}
            resizeMode="cover"
          />
          <View style={styles.cartItemDetails}>
            <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.cartItemPrice}>
              {item.price.toLocaleString('vi-VN')} VNĐ
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={[
                  styles.quantityButton,
                  item.quantity <= 1 && styles.quantityButtonDisabled
                ]}
                onPress={(e) => { 
                  e.stopPropagation(); // Prevent triggering item selection
                  updateQuantity(item.id, -1);
                }}
                disabled={item.quantity <= 1}
              >
                <Icon name="minus" size={20} color={item.quantity <= 1 ? "#ccc" : "#e74c3c"} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity 
                style={[
                  styles.quantityButton,
                  item.quantity >= item.stock && styles.quantityButtonDisabled
                ]}
                onPress={(e) => { 
                  e.stopPropagation(); // Prevent triggering item selection
                  updateQuantity(item.id, 1); 
                }}
                disabled={item.quantity >= item.stock}
              >
                <Icon name="plus" size={20} color={item.quantity >= item.stock ? "#ccc" : "#e74c3c"} />
              </TouchableOpacity>
            </View>
            {/* Add Stock Warning Text */}
            {item.quantity >= item.stock && (
              <Text style={styles.stockWarningText}>
                Tối đa sản phẩm trong kho
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => { 
              e.stopPropagation(); // Prevent triggering item selection
              handleDeleteItem(item.id); 
            }}
          >
            <Icon name="trash-can-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <View style={styles.selectAllRow}> 
        <TouchableOpacity onPress={handleToggleSelectAll} style={styles.selectAllButton}>
          <Icon 
            name={areAllItemsSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={areAllItemsSelected ? '#4CAF50' : '#7f8c8d'} 
          />
          <Text style={styles.selectAllText}> 
            {areAllItemsSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({cartItems.length} sản phẩm)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Login Modal */}
      <LoginModal />

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Icon name="cart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
          <TouchableOpacity 
            style={styles.continueShopping}
            onPress={() => navigation.navigate('ShopMain')}
          >
            <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartList}
            ListHeaderComponent={ListHeaderComponent}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tạm tính:</Text>
              <Text style={styles.totalAmount}>
                {totalPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.checkoutButton,
                // Disable if checking out, syncing, OR no items selected
                (isCheckingOut || isSyncing || selectedItemIds.length === 0) && styles.checkoutButtonDisabled 
              ]}
              onPress={() => handleCheckout()}
              disabled={isCheckingOut || isSyncing || selectedItemIds.length === 0} // Add selection check to disabled
            >
              {(isCheckingOut || isSyncing) ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.checkoutButtonText}>Đang xử lý...</Text>
                </View>
              ) : (
                <>
                  <Icon name="cart-arrow-right" size={24} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Tiến hành đặt hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingBottom: 10, // Adjusted padding
    paddingHorizontal: 15, // Match list padding
    backgroundColor: '#f5f6fa', // Match container background
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Added padding
    borderBottomWidth: 1, // Add separator
    borderBottomColor: '#eee',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  cartList: {
    padding: 15,
  },
  cartItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden', // Ensure corners are rounded
  },
  selectionIndicator: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch', // Make it take full height
    backgroundColor: '#f8f9fa', // Slightly different background
  },
  cartItem: {
    flex: 1, // Take remaining space
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cartItemUnselected: {
    // Optional: Slightly fade unselected items
    // opacity: 0.8,
  },
  cartItemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    height: 90,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  cartItemPrice: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  quantityButtonDisabled: {
    backgroundColor: '#f1f2f6',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    color: '#2c3e50',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  totalContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#4CAF50', // Lighter red for disabled state
    opacity: 0.7, // Add opacity for disabled state
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 24,
  },
  continueShopping: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
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
    color: '#2c3e50',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#f1f2f6',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalLoginButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalCancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  modalLoginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  stockWarningText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default CartScreen; 