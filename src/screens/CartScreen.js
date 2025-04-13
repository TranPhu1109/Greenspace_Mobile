import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from "../context/CartContext";

const CartScreen = ({ navigation }) => {
  const { cartItems, deleteCartItem, updateQuantity, totalPrice } = useContext(CartContext);

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

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
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
            onPress={() => updateQuantity(item.id, -1)}
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
            onPress={() => updateQuantity(item.id, 1)}
            disabled={item.quantity >= item.stock}
          >
            <Icon name="plus" size={20} color={item.quantity >= item.stock ? "#ccc" : "#e74c3c"} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id)}
      >
        <Icon name="trash-can-outline" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.header}>
     
      <Text style={styles.headerSubtitle}>
        {cartItems.length} sản phẩm
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Icon name="cart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
          <TouchableOpacity 
            style={styles.continueShopping}
            onPress={() => navigation.navigate('Shop')}
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
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('CheckOut')}
            >
              <Icon name="cart-arrow-right" size={24} color="#fff" />
              <Text style={styles.checkoutButtonText}>Tiến hành đặt hàng</Text>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
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
  cartItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default CartScreen; 