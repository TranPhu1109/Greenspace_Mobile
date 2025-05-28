import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  PaymentConfirmationModal,
  InsufficientBalanceModal,
} from '../components/PaymentModals';
import SuccessModal from '../components/SuccessModal';
import {useWallet} from '../context/WalletContext';
import {useAuth} from '../context/AuthContext';
import { api } from '../api/api';
import Address from '../components/Address';

const {width} = Dimensions.get('window');

const OrderScreen = ({navigation, route}) => {
  const {designData: initialDesignData} = route.params;
  const {user} = useAuth();
  //console.log("user", user);

  const {balance, updateBalance, addTransaction} = useWallet();

  // Use state for design data to make prices mutable
  const [designData, setDesignData] = useState(initialDesignData);

  // User information states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Address states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressList, setAddressList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Materials states
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // New address modal states
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddressName, setNewAddressName] = useState(user?.name || '');
  const [newAddressPhone, setNewAddressPhone] = useState(user?.phone || '');
  const [addressDetails, setAddressDetails] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [streetError, setStreetError] = useState('');

  // Replacement Modal States
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [materialToReplace, setMaterialToReplace] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // Store all fetched products
  const [replacementOptions, setReplacementOptions] = useState([]); // Filtered products for replacement
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [replaceSearchTerm, setReplaceSearchTerm] = useState('');

  // Payment modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // State for calculated prices
  const [calculatedMaterialPrice, setCalculatedMaterialPrice] = useState(
    designData.materialPrice,
  );
  const [calculatedTotalCost, setCalculatedTotalCost] = useState(
    designData.totalPrice,
  );

  // Fetch product details when component mounts
  useEffect(() => {
    if (
      initialDesignData &&
      initialDesignData.productDetails &&
      initialDesignData.productDetails.length > 0
    ) {
      fetchMaterials(initialDesignData.productDetails);
    }
  }, [initialDesignData]);

  // Recalculate prices whenever materials change
  useEffect(() => {
    if (materials.length > 0) {
      const newMaterialPrice = materials.reduce((sum, material) => {
        // Use unitPrice for calculation
        const unitPrice =
          material.unitPrice || material.price / material.quantity || 0;
        return sum + unitPrice * material.quantity;
      }, 0);

      const newTotalCost = (designData.designPrice || 0) + newMaterialPrice;

      setCalculatedMaterialPrice(newMaterialPrice);
      setCalculatedTotalCost(newTotalCost);

      // Update designData state as well if needed elsewhere,
      // but prefer calculated states for display/submission
      setDesignData(prevData => ({
        ...prevData,
        materialPrice: newMaterialPrice,
        totalPrice: newTotalCost,
      }));

    } else {
      // Handle case where materials might be empty initially or after removal
      const newTotalCost = designData.designPrice || 0;
      setCalculatedMaterialPrice(0);
      setCalculatedTotalCost(newTotalCost);
      setDesignData(prevData => ({
        ...prevData,
        materialPrice: 0,
        totalPrice: newTotalCost,
      }));
    }
  }, [materials, designData.designPrice]); // Depend on materials list and design price

  // Function to fetch materials from API
  const fetchMaterials = async productDetails => {
    if (!productDetails || productDetails.length === 0) return;

    setLoadingMaterials(true);
    try {
      const materialsPromises = productDetails.map(async detail => {
        const response = await api.get(`/product/${detail.productId}`, {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });
        // Ensure price and quantity are numbers
        const price = Number(detail.price || response.price || 0);
        const quantity = Number(detail.quantity || 1);
        return {
          ...response, // Includes id, name, image, category etc.
          quantity: quantity,
          price: price, // This might be total price initially, calculate unit price if needed
        };
      });

      const materialsData = await Promise.all(materialsPromises);
      // Correct initial price to be unit price if it came as total
      const correctedMaterials = materialsData.map(m => ({
        ...m,
        // Assuming API provides unit price, if not, calculate it
        unitPrice: m.price / m.quantity, // Ensure this calculation is correct based on API response
      }));
      setMaterials(correctedMaterials);
    } catch (err) {
      console.error('Error fetching materials:', err);
      Alert.alert('Error', 'Could not load product details. Please try again.');
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Function to parse and format address
  const formatAddress = addressString => {
    if (!addressString) return 'No address available';

    const parts = addressString.split('|');
    const street = parts[0] || '';
    const ward = parts[1] || '';
    const district = parts[2] || '';
    const province = parts[3] || '';

    return `${street}, ${ward}, ${district}, ${province}`;
  };

  // Fetch all addresses for the user
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      // Create a default address from user context if available
      const contextAddress = user?.address
        ? {
            id: 'context-address',
            userId: user.id,
            name: user.name || '',
            phone: user.phone || '',
            userAddress: user.address,
            isDefault: true,
          }
        : null;

      const response = await api.get(`/address/user/${user.id}`, {
        'Authorization': `Bearer ${user.backendToken}`
      });

      if (response) {
        let apiAddresses = response || [];
        // If it's wrapped in a data property, extract it
        if (response.data) {
          apiAddresses = response.data;
        }

        let addresses = [];

        // Process API addresses first
        if (apiAddresses.length > 0) {
          // Check if any API address matches the context address
          let foundContextMatch = false;

          apiAddresses.forEach(addr => {
            // Create a copy of the address to avoid modifying the original
            const addressCopy = {...addr};

            // If this address matches the context address, mark it as default
            if (
              contextAddress &&
              addressCopy.userAddress === contextAddress.userAddress
            ) {
              addressCopy.isDefault = true;
              foundContextMatch = true;
            }

            addresses.push(addressCopy);
          });

          // Only add the context address if it wasn't found in the API results
          if (contextAddress && !foundContextMatch) {
            addresses.unshift(contextAddress); // Add to beginning of array
          }
        } else if (contextAddress) {
          // If no API addresses, just use the context address
          addresses.push(contextAddress);
        }

        setAddressList(addresses);

        // Select default address if none is selected
        if (!selectedAddress && addresses.length > 0) {
          const defaultAddr =
            addresses.find(addr => addr.isDefault) || addresses[0];
          setSelectedAddress(defaultAddr);
          setName(defaultAddr.name || user?.name || '');
          setPhone(defaultAddr.phone || user?.phone || '');
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Could not load addresses. Please try again.');

      // If API fails, at least use the context address
      if (user?.address) {
        const contextAddress = {
          id: 'context-address',
          userId: user.id,
          name: user.name || '',
          phone: user.phone || '',
          userAddress: user.address,
          isDefault: true,
        };
        setAddressList([contextAddress]);
        setSelectedAddress(contextAddress);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle address component change
  const handleAddressChange = details => {
    setAddressDetails(details);
  };

  // Create a new address
  const handleAddNewAddress = async () => {
    // Validate inputs
    if (!validateNewAddress()) {
      return;
    }

    setSavingAddress(true);
    try {
      // Prepare the userAddress string in the format: street|ward|district|province
      const userAddress = `${newAddressStreet}|${addressDetails.wardName}|${addressDetails.districtName}|${addressDetails.provinceName}`;

      // Prepare request body
      const requestBody = {
        userId: user.id,
        name: newAddressName,
        phone: newAddressPhone,
        userAddress: userAddress,
      };

      const response = await api.post('/address', requestBody, {
        'Authorization': `Bearer ${user.backendToken}`,
        'Content-Type': 'application/json'
      });

      if (response) {
        // Clear form
        setNewAddressStreet('');
        setAddressDetails({});

        // Close new address modal and refresh address list
        setShowNewAddressModal(false);

        // Wait briefly before fetching addresses to ensure the new one is included
        setTimeout(() => {
          fetchAddresses();
        }, 500);

        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      Alert.alert(
        'Error',
        `Could not create address: ${
          error.response?.data?.message || error.message
        }`,
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // Validate new address inputs
  const validateNewAddress = () => {
    let isValid = true;

    // Validate street
    if (!newAddressStreet.trim()) {
      setStreetError('Please enter your street address');
      isValid = false;
    } else {
      setStreetError('');
    }

    // Validate address details
    if (!addressDetails.provinceName) {
      Alert.alert('Error', 'Please select a province');
      isValid = false;
    } else if (!addressDetails.districtName) {
      Alert.alert('Error', 'Please select a district');
      isValid = false;
    } else if (!addressDetails.wardName) {
      Alert.alert('Error', 'Please select a ward');
      isValid = false;
    }

    return isValid;
  };

  // Open the new address modal
  const handleOpenNewAddressModal = () => {
    setShowAddressModal(false);
    setNewAddressName(user?.name || '');
    setNewAddressPhone(user?.phone || '');
    setNewAddressStreet('');
    setAddressDetails({});
    setShowNewAddressModal(true);
  };

  // Select an address
  const handleSelectAddress = address => {
    setSelectedAddress(address);
    setName(address.name || '');
    setPhone(address.phone || '');
    setShowAddressModal(false);
  };

  useEffect(() => {
    if (!initialDesignData) {
      Alert.alert('Error', 'Design data is missing. Please try again.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    }

    // Initialize with context address
    if (user?.address) {
      const contextAddress = {
        id: 'context-address',
        userId: user.id,
        name: user.name || '',
        phone: user.phone || '',
        userAddress: user.address,
        isDefault: true,
      };
      setSelectedAddress(contextAddress);
    }
  }, [initialDesignData, user]);

  const validateInputs = () => {
    let isValid = true;

    // Validate name and phone
    if (!name.trim()) {
      setNameError('Vui lòng nhập họ tên');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!phone.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(phone.trim())) {
      setPhoneError('Số điện thoại không hợp lệ');
      isValid = false;
    } else {
      setPhoneError('');
    }

    // Validate address
    if (!selectedAddress && !user?.address) {
      Alert.alert('Error', 'Please select a delivery address');
      isValid = false;
    }

    return isValid;
  };

  const handleChangeAddress = () => {
    fetchAddresses();
    setShowAddressModal(true);
  };

  // Render an address item in the modal
  const renderAddressItem = ({item}) => (
    <TouchableOpacity
      style={styles.addressItem}
      onPress={() => handleSelectAddress(item)}>
      <View style={styles.addressItemContent}>
        <View style={styles.addressHeader}>
          <Text style={styles.addressName}>{item.name}</Text>
          <Text style={styles.addressPhone}>{item.phone}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Mặc định</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText}>
          {formatAddress(item.userAddress)}
        </Text>
      </View>

      <View
        style={[
          styles.checkCircle,
          selectedAddress?.id === item.id && styles.checkCircleSelected,
        ]}>
        {selectedAddress?.id === item.id && (
          <Icon name="check" size={16} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  const handleTopUp = () => {
    setShowInsufficientModal(false);
    navigation.navigate('Account', {
      screen: 'Profile',
      params: {
        screen: 'TopUp',
      },
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleViewOrders = () => {
    setShowSuccessModal(false); // Close modal before navigating
    navigation.navigate('Account', {
      screen: 'ServiceOrdersTab',
      params: {
        screen: 'ServiceOrders',
        initial: false,
      },
    });
  };

  // Submit handler - validates inputs and checks balance
  const handleSubmit = () => {
    // Validate inputs
    if (!validateInputs()) return;

    // Check if wallet has enough balance
    if (balance >= calculatedTotalCost) {
      // Show confirmation modal if funds are sufficient
      setShowPaymentModal(true);
    } else {
      // Show insufficient funds modal otherwise
      setShowInsufficientModal(true);
    }
  };

  // Payment confirmation handler - called when user confirms in the modal
  const handlePaymentConfirm = async () => {
    setShowPaymentModal(false); // Close confirmation modal
    setSavingAddress(true); // Use savingAddress state for loading indication

    try {
      // 1. Prepare Service Order Request Body
      const addressToUse =
        selectedAddress?.userAddress || user?.address || 'N/A';
      const productsPayload = materials.map(material => ({
        productId: material.id,
        quantity: material.quantity,
      }));

      const orderRequestBody = {
        userId: user.id,
        designIdeaId: designData.id,
        address: addressToUse,
        cusPhone: phone,
        userName: name,
        isCustom: false, // Assuming this is not a custom order for now
        length: 0,
        width: 0,
        designPrice: designData.designPrice,
        materialPrice: calculatedMaterialPrice,
        totalCost: calculatedTotalCost,
        description: `Đơn hàng cho thiết kế: ${designData.name}`,
        image: {
          imageUrl: '',
          image2: '',
          image3: '',
        },
        products: productsPayload,
      };

      // 2. Create Service Order
      const orderResponse = await api.post('/serviceorder', orderRequestBody, {
        'Authorization': `Bearer ${user.backendToken}`,
        'Content-Type': 'application/json'
      });

      if (!orderResponse) {
        throw new Error('Order creation failed');
      }

      const createdOrder = orderResponse.data || orderResponse; // Handle both response formats
      const serviceOrderId = createdOrder.id;

      // 3. Prepare Bill Request Body
      const billRequestBody = {
        walletId: user.wallet.id,
        orderId: null, // No regular order ID
        serviceOrderId: serviceOrderId,
        amount: calculatedTotalCost,
        description: 'Thanh toán đơn dịch vụ',
      };

      // 4. Create Bill
      const billResponse = await api.post('/bill', billRequestBody, {
        'Authorization': `Bearer ${user.backendToken}`,
        'Content-Type': 'application/json'
      });

      if (!billResponse) {
        throw new Error('Bill creation failed');
      }

      // --- START: Update Product Stock --- 
      const stockUpdatePromises = materials.map(async (material) => {
        try {
          // 1. Get current product details
          const productResponse = await api.get(`/product/${material.id}`, {
            'Authorization': `Bearer ${user.backendToken}`
          });

          // 2. Calculate new stock
          const currentStock = productResponse.stock || 0;
          const orderedQuantity = material.quantity || 0;
          const newStock = Math.max(0, currentStock - orderedQuantity);

          // 3. Prepare update payload
          const updatePayload = {
            name: productResponse.name,
            categoryId: productResponse.categoryId,
            price: productResponse.price,
            stock: newStock,
            description: productResponse.description,
            designImage1URL: productResponse.designImage1URL,
            size: productResponse.size,
            image: {
              imageUrl: productResponse.image?.imageUrl || '',
              image2: productResponse.image?.image2 || '',
              image3: productResponse.image?.image3 || ''
            }
          };

          // 4. Update product stock
          await api.put(`/product/${material.id}`, updatePayload, {
            'Authorization': `Bearer ${user.backendToken}`,
            'Content-Type': 'application/json'
          });

          return { status: 'success', productId: material.id };
        } catch (error) {
          
          return { status: 'failed', productId: material.id, error: error.message };
        }
      });

      // Wait for all updates to complete
      const results = await Promise.allSettled(stockUpdatePromises);
      
      // Check for any failed updates
      // const failedUpdates = results.filter(result => 
      //   result.status === 'rejected' || 
      //   (result.status === 'fulfilled' && result.value.status === 'failed')
      // );

      // if (failedUpdates.length > 0) {
      //   Alert.alert(
      //     'Warning',
      //     'Some product stock updates failed. Please contact support.',
      //     [{ text: 'OK' }]
      //   );
      // }

      // --- END: Update Product Stock ---

      // 5. Update Wallet Balance & Add Transaction
      updateBalance(-calculatedTotalCost);
      addTransaction({
        type: 'payment',
        amount: -calculatedTotalCost,
        description: `Thanh toán thiết kế ${designData.name}`,
      });

      // 6. Show Success Modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error during payment process:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      Alert.alert(
        'Lỗi',
        `Đã xảy ra lỗi trong quá trình thanh toán: ${
          error.response?.data?.message || error.message
        }`,
        [{text: 'OK'}],
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // Fetch All Products for Replacement Modal
  const fetchAllProducts = async () => {
    // Avoid refetching if already loaded
    if (allProducts.length > 0) {
      return allProducts;
    }

    setLoadingAllProducts(true);
    try {
      const response = await api.get('/product');
      const fetchedProducts = response; // Handle potential data wrapping
      setAllProducts(fetchedProducts);
      return fetchedProducts;
    } catch (error) {
      console.error('Error fetching all products:', error);
      Alert.alert('Error', 'Could not load products for replacement.');
      setAllProducts([]); // Clear products on error
      return []; // Return empty array on error
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // Increase Quantity
  const handleIncreaseQuantity = materialId => {
    setMaterials(currentMaterials =>
      currentMaterials.map(material =>
        material.id === materialId
          ? {...material, quantity: material.quantity + 1}
          : material,
      ),
    );
  };

  // Decrease Quantity
  const handleDecreaseQuantity = materialId => {
    setMaterials(currentMaterials =>
      currentMaterials.map(material =>
        material.id === materialId && material.quantity > 1 // Prevent going below 1
          ? {...material, quantity: material.quantity - 1}
          : material,
      ),
    );
  };

  // Placeholder for Replace Material Modal Logic
  const handleOpenReplaceModal = async materialToReplace => {

    setMaterialToReplace(materialToReplace);
    setReplaceSearchTerm(''); // Reset search term

    // Fetch all products if not already cached
    const products =
      allProducts.length > 0 ? allProducts : await fetchAllProducts();

    if (products.length === 0) {
      // Error handled in fetchAllProducts, just don't open modal
      return;
    }

    // Filter products by category and exclude the current item
    const categoryId = materialToReplace?.categoryId;
    if (!categoryId) {
      Alert.alert(
        'Error',
        'Cannot replace material without category information.',
      );
      return;
    }

    const options = products.filter(
      product =>
        product.categoryId === categoryId &&
        product.id !== materialToReplace.id,
    );

   
    setReplacementOptions(options);
    setShowReplaceModal(true); // Open modal only after filtering
  };

  const handleSelectReplacement = replacementProduct => {

    if (!materialToReplace || !replacementProduct) return;

   

    // Create the new material object, preserving quantity
    const newMaterial = {
      ...replacementProduct, // Includes id, name, image, price, category etc. from the selected product
      quantity: materialToReplace.quantity, // Keep the original quantity
      unitPrice: replacementProduct.price || 0, // Use the unit price of the new product
    };

    setMaterials(currentMaterials =>
      currentMaterials.map(item =>
        item.id === materialToReplace.id ? newMaterial : item,
      ),
    );

    // Close modal and reset state
    setShowReplaceModal(false);
    setMaterialToReplace(null);
    setReplacementOptions([]);
    setReplaceSearchTerm('');
  };

  // Filter options based on search term
  const filteredReplacementOptions = replacementOptions.filter(option =>
    option.name.toLowerCase().includes(replaceSearchTerm.toLowerCase()),
  );

  if (!initialDesignData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoContainer}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Nhập họ và tên"
                value={name}
                onChangeText={setName}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                placeholder="Nhập số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </View>

            <View style={styles.inputRow}>
              <View style={styles.addressHeaderRow}>
                <Text style={styles.inputLabel}>Địa chỉ giao hàng</Text>
                <TouchableOpacity
                  style={styles.changeAddressButton}
                  onPress={handleChangeAddress}>
                  <Text style={styles.changeAddressText}>Thay đổi</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.addressDisplay}>
                <Text style={styles.readOnlyText}>
                  {selectedAddress
                    ? formatAddress(selectedAddress.userAddress)
                    : user?.address
                    ? formatAddress(user.address)
                    : 'Chưa có địa chỉ giao hàng'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thiết kế</Text>
          <View style={styles.infoContainer}>
            {/* Design Image Carousel */}
            <View style={styles.imageCarouselContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageCarousel}>
                {/* Main Image */}
                {designData.image?.imageUrl && (
                  <Image
                    source={{uri: designData.image.imageUrl}}
                    style={styles.designImage}
                    defaultSource={require('../assets/images/default_image.jpg')}
                  />
                )}

                {/* Second Image */}
                {designData.image?.image2 && (
                  <Image
                    source={{uri: designData.image.image2}}
                    style={styles.designImage}
                    defaultSource={require('../assets/images/default_image.jpg')}
                  />
                )}

                {/* Third Image */}
                {designData.image?.image3 && (
                  <Image
                    source={{uri: designData.image.image3}}
                    style={styles.designImage}
                    defaultSource={require('../assets/images/default_image.jpg')}
                  />
                )}
              </ScrollView>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tên thiết kế</Text>
              <Text style={styles.priceAmount}>{designData.name}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Loại thiết kế</Text>
              <Text style={styles.priceAmount}>
                {designData.categoryName || 'Không xác định'}
              </Text>
            </View>
          </View>
        </View>

        {/* Materials List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách vật liệu</Text>
          <View style={styles.infoContainer}>
            {loadingMaterials ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={styles.loadingIndicator}
              />
            ) : materials.length > 0 ? (
              materials.map((material, index) => {
                const unitPrice =
                  material.unitPrice || material.price / material.quantity || 0;
                const totalItemPrice = unitPrice * material.quantity;

                return (
                  <View key={material.id || index} style={styles.materialItemCard}>
                    {/* Image */}
                    {material.image?.imageUrl ? (
                      <Image
                        source={{uri: material.image.imageUrl}}
                        style={styles.materialImageCard}
                        defaultSource={require('../assets/images/default_image.jpg')}
                      />
                    ) : (
                      <View style={styles.materialImagePlaceholderCard} /> // Use placeholder style
                    )}

                    {/* Material Info Right Section */}
                    <View style={styles.materialInfoCard}>
                      {/* Top row: Name and Replace Button */}
                      <View style={styles.materialInfoTopRow}>
                         <Text style={styles.materialNameCard} numberOfLines={2}>
                           {material.name || `Sản phẩm ${index + 1}`}
                         </Text>
                         {/* Replace Button */}
                         <TouchableOpacity
                           style={styles.replaceButtonCard}
                           onPress={() => handleOpenReplaceModal(material)}>
                            <Icon
                            name="swap-horizontal"
                            size={12}
                            color='#4CAF50'
                            />
                           <Text style={styles.replaceButtonTextCard}>Thay thế</Text>
                         </TouchableOpacity>
                      </View>

                      {/* Unit Price Display */}
                      <Text style={styles.unitPriceTextCard}>
                        {unitPrice.toLocaleString('vi-VN')} VND / sản phẩm
                      </Text>

                      {/* Bottom Row: Quantity and Total Price */}
                      <View style={styles.materialInfoBottomRow}>
                        {/* Quantity Controls */}
                        <View style={styles.quantityControlContainerCard}>
                          <TouchableOpacity
                            style={styles.quantityButtonCard}
                            onPress={() => handleDecreaseQuantity(material.id)}
                            disabled={material.quantity <= 1}>
                            <Icon
                              name="minus"
                              size={16}
                              color={material.quantity <= 1 ? '#ccc' : '#000'}
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantityTextCard}>
                            {material.quantity}
                          </Text>
                          <TouchableOpacity
                            style={styles.quantityButtonCard}
                            onPress={() => handleIncreaseQuantity(material.id)}>
                            <Icon name="plus" size={16} color="#000" />
                          </TouchableOpacity>
                        </View>

                        {/* Total Price Tag */}
                        <Text style={styles.materialPriceTextCard}>
                          {totalItemPrice.toLocaleString('vi-VN')} VND
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noMaterialsText}>
                Không có vật liệu nào được tìm thấy
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá thiết kế</Text>
              <Text style={styles.priceAmount}>
                {designData.designPrice.toLocaleString('vi-VN')} VND
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá vật liệu</Text>
              <Text style={styles.priceAmount}>
                {calculatedMaterialPrice.toLocaleString('vi-VN')} VND
              </Text>
            </View>

            {/* Wallet Balance Display - Moved Here */}
            <View style={styles.priceRow}>
              <View style={styles.balanceRowContainer}>
                <Icon name="wallet-outline" size={16} color="#666" />
                <Text style={styles.priceLabel}>Số dư ví</Text>
              </View>
              <Text style={styles.priceAmount}>
                {balance.toLocaleString('vi-VN')} VND
              </Text>
            </View>

            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={[styles.priceLabel, styles.totalLabel]}>
                Tổng cộng
              </Text>
              <Text style={[styles.priceAmount, styles.totalAmount]}>
                {calculatedTotalCost.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Payment Action Area */}
      <View style={styles.paymentActionSection}>
        {balance >= calculatedTotalCost ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit} // Keep handleSubmit to trigger validation first
          >
            <Text style={styles.submitButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.insufficientFundsContainer}>
            <Text style={styles.insufficientFundsText}>
              Số dư không đủ. Vui lòng nạp thêm tiền.
            </Text>
            <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
              <Text style={styles.topUpButtonText}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addNewAddressButton}
              onPress={handleOpenNewAddressModal}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.addNewAddressText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>

            {loadingAddresses ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={styles.loadingIndicator}
              />
            ) : addressList.length > 0 ? (
              <FlatList
                data={addressList}
                renderItem={renderAddressItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.addressList}
              />
            ) : (
              <View style={styles.noAddressContainer}>
                <Icon name="map-marker-off" size={50} color="#ccc" />
                <Text style={styles.noAddressText}>Không có địa chỉ nào</Text>
                <Text style={styles.noAddressSubText}>
                  Bạn chưa có địa chỉ nào trong hệ thống
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={showNewAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.newAddressModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm địa chỉ mới</Text>
              <TouchableOpacity onPress={() => setShowNewAddressModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.newAddressForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập họ và tên"
                  value={newAddressName}
                  onChangeText={setNewAddressName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập số điện thoại"
                  value={newAddressPhone}
                  onChangeText={setNewAddressPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tên đường, số nhà</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    streetError ? styles.inputError : null,
                  ]}
                  placeholder="Nhập tên đường, số nhà"
                  value={newAddressStreet}
                  onChangeText={setNewAddressStreet}
                />
                {streetError ? (
                  <Text style={styles.errorText}>{streetError}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Địa chỉ</Text>
                <Address
                  onAddressChange={handleAddressChange}
                  initialAddress={{}}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  savingAddress && styles.disabledButton,
                ]}
                onPress={handleAddNewAddress}
                disabled={savingAddress}>
                {savingAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Lưu địa chỉ</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={calculatedTotalCost}
        onConfirm={handlePaymentConfirm}
      />

      <InsufficientBalanceModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        required={calculatedTotalCost}
        balance={balance}
        onTopUp={handleTopUp}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        onViewOrders={handleViewOrders}
      />

      {/* --- Replacement Modal --- */}
      <Modal
        visible={showReplaceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReplaceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.replaceModalContainer]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thay thế vật liệu</Text>
              <TouchableOpacity onPress={() => setShowReplaceModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.replaceSearchContainer}>
              <Icon
                name="magnify"
                size={20}
                color="#888"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.replaceSearchInput}
                placeholder={`Tìm trong danh mục "${
                  materialToReplace?.category?.name || '...'
                }"`}
                value={replaceSearchTerm}
                onChangeText={setReplaceSearchTerm}
              />
            </View>

            {/* Product List */}
            {loadingAllProducts ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={styles.loadingIndicator}
              />
            ) : filteredReplacementOptions.length > 0 ? (
              <FlatList
                data={filteredReplacementOptions}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.replacementItem}
                    onPress={() => handleSelectReplacement(item)}>
                    {item.image?.imageUrl ? (
                      <Image
                        source={{uri: item.image.imageUrl}}
                        style={styles.replacementImage}
                        defaultSource={require('../assets/images/default_image.jpg')}
                      />
                    ) : (
                      <View style={styles.replacementImagePlaceholder} />
                    )}
                    <View style={styles.replacementInfo}>
                      <Text style={styles.replacementName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.replacementPrice}>
                        {(item.price || 0).toLocaleString('vi-VN')} VND
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#ccc" />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.replacementList}
              />
            ) : (
              <View style={styles.noAddressContainer}>
                {' '}
                {/* Reuse style */}
                <Icon name="abugida-devanagari" size={50} color="#ccc" />
                <Text style={styles.noAddressText}>
                  Không có sản phẩm thay thế
                </Text>
                <Text style={styles.noAddressSubText}>
                  Không tìm thấy sản phẩm nào cùng danh mục '
                  {materialToReplace?.category?.name}' để thay thế.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* --- End Replacement Modal --- */}
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,

  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    padding: 12,
  },
  addressDisplay: {
    marginBottom: 4,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeAddressButton: {
    padding: 4,
  },
  changeAddressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addressList: {
    padding: 16,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  addressItemContent: {
    flex: 1,
    marginRight: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  noAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noAddressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  noAddressSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingIndicator: {
    padding: 30,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Add New Address Button
  addNewAddressButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // New Address Modal
  newAddressModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  newAddressForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  disabledButton: {
    backgroundColor: '#B3D7FF',
  },
  // Design Image Carousel
  imageCarouselContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageCarousel: {
    height: 200,
  },
  designImage: {
    width: width - 55,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },

  // Material List Styles
  materialItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  materialImageCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  materialImagePlaceholderCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#EFEFEF',
  },
  materialInfoCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  materialInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  materialNameCard: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  replaceButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAE5', // Light orange background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replaceButtonTextCard: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50', // Orange text color
    fontWeight: '500',
  },
  unitPriceTextCard: {
    fontSize: 13,
    color: '#888', // Grey color
    marginBottom: 8,
  },
  materialInfoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControlContainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButtonCard: {
    borderWidth: 1,
    borderColor: '#ccc', // Light grey border
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  quantityTextCard: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000', // Black text
    minWidth: 20,
    textAlign: 'center',
  },
  materialPriceTextCard: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF', // Blue color
  },
  // Wallet Balance Display
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  // Payment Action Area
  paymentActionSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  insufficientFundsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  insufficientFundsText: {
    fontSize: 14,
    color: '#666',
  },
  topUpButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New Balance Row
  balanceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Replace Modal Styles
  replaceModalContainer: {
    maxHeight: '80%',
  },
  replaceSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  replaceSearchInput: {
    flex: 1,
  },
  replacementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  replacementImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  replacementImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  replacementInfo: {
    flex: 1,
  },
  replacementName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  replacementPrice: {
    fontSize: 12,
    color: '#888',
  },
  replacementList: {
    padding: 12,
  },
});

export default OrderScreen;
