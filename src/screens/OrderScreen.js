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
import axios from 'axios';
import Address from '../components/Address';

const {width} = Dimensions.get('window');
const API_URL = 'http://10.0.2.2:8080/api';

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

      console.log('Recalculated Prices:', {newMaterialPrice, newTotalCost});
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
        const response = await axios.get(
          `${API_URL}/product/${detail.productId}`,
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
        // Ensure price and quantity are numbers
        const price = Number(detail.price || response.data.price || 0);
        const quantity = Number(detail.quantity || 1);
        return {
          ...response.data, // Includes id, name, image, category etc.
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
      console.log('Fetched and corrected materials:', correctedMaterials);
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

      // First try the localhost API (for emulator)
      let response;
      try {
        response = await axios.get(
          `http://localhost:8080/api/address/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.backendToken}`,
            },
            timeout: 3000, // 3 second timeout
          },
        );
      } catch (err) {
        // If localhost fails, try the 10.0.2.2 address (Android emulator)
        response = await axios.get(
          `http://10.0.2.2:8080/api/address/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.backendToken}`,
            },
          },
        );
      }

      console.log('Fetched addresses:', response.data);

      if (response.status === 200) {
        let apiAddresses = response.data || [];
        // If it's wrapped in a data property, extract it
        if (response.data.data) {
          apiAddresses = response.data.data;
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
              console.log('Found matching address in API:', addressCopy);
            }

            addresses.push(addressCopy);
          });

          // Only add the context address if it wasn't found in the API results
          if (contextAddress && !foundContextMatch) {
            addresses.unshift(contextAddress); // Add to beginning of array
            console.log("Adding context address as it wasn't found in API");
          }
        } else if (contextAddress) {
          // If no API addresses, just use the context address
          addresses.push(contextAddress);
          console.log('No API addresses, using context address');
        }

        console.log('Final addresses list:', addresses);
        setAddressList(addresses);

        // Select default address if none is selected
        if (!selectedAddress && addresses.length > 0) {
          const defaultAddr =
            addresses.find(addr => addr.isDefault) || addresses[0];
          console.log('Selecting default address:', defaultAddr);
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

      console.log('Creating new address:', requestBody);

      // Try localhost first, then fallback to 10.0.2.2
      let response;
      try {
        response = await axios.post(
          'http://localhost:8080/api/address',
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${user.backendToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 3000,
          },
        );
      } catch (err) {
        response = await axios.post(
          'http://10.0.2.2:8080/api/address',
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${user.backendToken}`,
              'Content-Type': 'application/json',
            },
          },
        );
      }

      console.log('Address creation response:', response);

      if (response.status === 200 || response.status === 201) {
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
    navigation.navigate('Home'); // Navigate home after closing
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
      console.log('Starting order creation process...');

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
        description: `Order for design: ${designData.name}`,
        image: {
          imageUrl: '',
          image2: '',
          image3: '',
        },
        products: productsPayload,
      };

      console.log(
        'Creating service order with data:',
        JSON.stringify(orderRequestBody, null, 2),
      );

      // 2. Create Service Order (Try localhost, then 10.0.2.2)
      let orderResponse;
      try {
        orderResponse = await axios.post(
          'http://localhost:8080/api/serviceorder',
          orderRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.backendToken}`,
            },
            timeout: 5000,
          },
        );
      } catch (err) {
        orderResponse = await axios.post(
          'http://10.0.2.2:8080/api/serviceorder',
          orderRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.backendToken}`,
            },
          },
        );
      }

      console.log('Service order creation response:', orderResponse);

      if (orderResponse.status !== 200 && orderResponse.status !== 201) {
        throw new Error(
          `Order creation failed with status: ${orderResponse.status}`,
        );
      }

      const createdOrder = orderResponse.data.data; // Assuming response contains the created order with ID
      const serviceOrderId = createdOrder.id;
      console.log(`Order created successfully with ID: ${serviceOrderId}`);

      // 3. Prepare Bill Request Body
      const billRequestBody = {
        walletId: user.wallet.id,
        orderId: null, // No regular order ID
        serviceOrderId: serviceOrderId,
        amount: calculatedTotalCost,
        description: 'Thanh toán đơn dịch vụ',
      };

      console.log(
        'Creating bill with data:',
        JSON.stringify(billRequestBody, null, 2),
      );

      // 4. Create Bill (Try 10.0.2.2 first as per user request)
      const billResponse = await axios.post(
        'http://10.0.2.2:8080/api/bill',
        billRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.backendToken}`, // Assuming bill creation also needs auth
          },
        },
      );

      console.log('Bill creation response:', billResponse);

      if (billResponse.status !== 200 && billResponse.status !== 201) {
        // Handle bill creation failure (order was already created)
        // Consider logging this or showing a specific error to the user
        throw new Error(
          `Bill creation failed with status: ${billResponse.status}`,
        );
      }

      console.log('Bill created successfully');

      // --- START: Update Product Stock --- 
      console.log('Attempting to update stock for ordered products...');
      const stockUpdatePromises = materials.map(async (material) => {
        try {
          // 1. Fetch current product details
          const productResponse = await axios.get(`${API_URL}/product/${material.id}`, {
             headers: { Authorization: `Bearer ${user.backendToken}` }
          });
          const currentProduct = productResponse.data; 
          
          // 2. Calculate new stock
          const currentStock = currentProduct.stock || 0;
          const orderedQuantity = material.quantity || 0;
          const newStock = Math.max(0, currentStock - orderedQuantity); // Prevent negative stock

          if (newStock === currentStock) {
            console.log(`Stock for ${material.name} (${material.id}) already up-to-date or quantity was 0.`);
            return { status: 'skipped', productId: material.id };
          }

          // 3. Prepare PUT request body (using all fetched fields)
          const updatePayload = {
            ...currentProduct, // Spread all existing fields
            stock: newStock,   // Update only the stock field
            // Ensure fields match the API expectation, remove if not needed or add defaults
            name: currentProduct.name || "",
            categoryId: currentProduct.categoryId || null, 
            price: currentProduct.price || 0,
            description: currentProduct.description || "",
            designImage1URL: currentProduct.designImage1URL || null,
            size: currentProduct.size || 0,
            image: {
              imageUrl: currentProduct.image?.imageUrl || "",
              image2: currentProduct.image?.image2 || null,
              image3: currentProduct.image?.image3 || null
            }
          };
          // Remove id from payload if backend doesn't expect it in PUT body
          // delete updatePayload.id; 

          console.log(`Updating stock for ${material.name} (${material.id}) to ${newStock}. Payload:`, updatePayload);

          // 4. Send PUT request
          await axios.put(`${API_URL}/product/${material.id}`, updatePayload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.backendToken}`,
            }
          });
          console.log(`Successfully updated stock for ${material.name} (${material.id})`);
          return { status: 'fulfilled', productId: material.id };
        } catch (productUpdateError) {
          console.error(`Failed to update stock for product ${material.id} (${material.name}):`, productUpdateError.response?.data || productUpdateError.message);
          // Don't throw error here, just log it and let the order process continue
          return { status: 'rejected', productId: material.id, reason: productUpdateError.message };
        }
      });

      // Wait for all updates to settle
      const results = await Promise.allSettled(stockUpdatePromises);
      console.log('Stock update results:', results);
      // --- END: Update Product Stock ---

      // 5. Update Wallet Balance & Add Transaction (ONLY after both succeed)
      updateBalance(-calculatedTotalCost);
      addTransaction({
        type: 'payment',
        amount: -calculatedTotalCost,
        description: `Thanh toán thiết kế ${designData.name}`,
      });
      console.log('Wallet updated successfully');

      // 6. Show Success Modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error during payment process:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Show a generic error alert
      Alert.alert(
        'Lỗi',
        `Đã xảy ra lỗi trong quá trình thanh toán: ${
          error.response?.data?.message || error.message
        }`,
        [{text: 'OK'}],
      );
      // IMPORTANT: No balance refund needed here because balance is only deducted after success
    } finally {
      setSavingAddress(false); // Turn off loading indicator
    }
  };

  // Fetch All Products for Replacement Modal
  const fetchAllProducts = async () => {
    // Avoid refetching if already loaded
    if (allProducts.length > 0) {
      console.log('Using cached products.');
      return allProducts;
    }

    setLoadingAllProducts(true);
    try {
      console.log('Fetching all products...');
      // Try localhost first, then fallback
      let response;
      try {
        response = await axios.get('http://localhost:8080/api/product', {
          timeout: 5000,
        });
      } catch (err) {
        response = await axios.get(`${API_URL}/product`);
      }

      const fetchedProducts = response.data?.data || response.data || []; // Handle potential data wrapping
      console.log(`Fetched ${fetchedProducts.length} products.`);
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
    console.log('materialToReplace', materialToReplace);

    setMaterialToReplace(materialToReplace);
    setReplaceSearchTerm(''); // Reset search term

    // Fetch all products if not already cached
    const products =
      allProducts.length > 0 ? allProducts : await fetchAllProducts();
    console.log('products', products);

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

    console.log(
      `Found ${options.length} replacement options for category ${categoryId}`,
    );
    setReplacementOptions(options);
    setShowReplaceModal(true); // Open modal only after filtering
  };

  const handleSelectReplacement = replacementProduct => {
    console.log('replacementProduct', replacementProduct);

    if (!materialToReplace || !replacementProduct) return;

    console.log(
      `Replacing ${materialToReplace.name} with ${replacementProduct.name}`,
    );

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
                  <View key={material.id || index} style={styles.materialItem}>
                    {material.image?.imageUrl ? (
                      <Image
                        source={{uri: material.image.imageUrl}}
                        style={styles.materialImage}
                        defaultSource={require('../assets/images/default_image.jpg')}
                      />
                    ) : (
                      <View style={styles.materialImagePlaceholder} /> // Use placeholder style
                    )}

                    <View style={styles.materialInfo}>
                      {/* Replace Button */}
                      <TouchableOpacity
                        style={styles.replaceButton}
                        onPress={() => handleOpenReplaceModal(material)}>
                        <Icon
                          name="swap-horizontal"
                          size={12}
                          color="#FF9500"
                        />
                        <Text style={styles.replaceButtonText}>Thay thế</Text>
                      </TouchableOpacity>
                      <Text style={styles.materialName} numberOfLines={2}>
                        {material.name || `Sản phẩm ${index + 1}`}
                      </Text>

                      {/* Unit Price Display */}
                      <Text style={styles.unitPriceText}>
                        {unitPrice.toLocaleString('vi-VN')} VND / sản phẩm
                      </Text>

                      {/* Quantity Controls */}
                      <View style={styles.quantityControlContainer}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleDecreaseQuantity(material.id)}
                          disabled={material.quantity <= 1}>
                          <Icon
                            name="minus"
                            size={18}
                            color={material.quantity <= 1 ? '#ccc' : '#007AFF'}
                          />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>
                          {material.quantity}
                        </Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleIncreaseQuantity(material.id)}>
                          <Icon name="plus" size={18} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Total Price Tag */}
                    <View style={styles.materialPriceTag}>
                      <Text style={styles.materialPriceText}>
                        {totalItemPrice.toLocaleString('vi-VN')} VND
                      </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
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
  materialItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
  },
  materialImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  materialImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialInfo: {
    flex: 1,
    marginLeft: 12,
    position: 'relative',
  },
  materialName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  unitPriceText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  quantityButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20, // Ensure space for quantity
    textAlign: 'center',
  },
  replaceButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replaceButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  materialPriceTag: {
    // Removed absolute positioning
    alignSelf: 'flex-end', // Align to the end of the row
    marginTop: 'auto', // Push to bottom
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  materialPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  noMaterialsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
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
