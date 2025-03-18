import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from "../context/CartContext";

const CartScreen = ({ navigation }) => {
  const { cartItems, deleteCartItem, updateQuantity, totalPrice } = useContext(CartContext);

  const handleDeleteItem = async (id) => {
    await deleteCartItem(id);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={require('../assets/images/furniture.jpg')}
        style={styles.cartItemImage}
        resizeMode="cover"
      />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{item.price}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, -1)}
          >
            <Icon name="minus" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, 1)}
          >
            <Icon name="plus" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id)}
      >
        <Icon name="trash-can-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Icon name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartList}
            removeClippedSubviews={false}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ${totalPrice}</Text>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('CheckOut')}
            >
              <Icon name="credit-card-outline" size={24} color="#fff" />
              <Text style={styles.checkoutButtonText}>Mua hàng</Text>
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
    backgroundColor: '#fff',
  },
  cartList: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  cartItemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  cartItemPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  deleteButton: {
    padding: 8,
  },
  totalContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
});

export default CartScreen; 