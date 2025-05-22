import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import Address from '../components/Address';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToCloudinary } from '../hooks/UploadToCloud';
import { styles } from './NewDesignScreen.styles';
import { api } from '../api/api';

const NewDesignScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Validation error states
  const [customerInfoError, setCustomerInfoError] = useState('');
  const [spatialInfoError, setSpatialInfoError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [imageError, setImageError] = useState('');

  // --- Address State ---
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressList, setAddressList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddressName, setNewAddressName] = useState(user?.name || '');
  const [newAddressPhone, setNewAddressPhone] = useState(user?.phone || '');
  const [addressDetails, setAddressDetails] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [streetError, setStreetError] = useState('');
  // ---------------------

  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  const choosePhoto = () => {
    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Thông báo', 'Bạn chỉ có thể tải lên tối đa 3 ảnh');
      return;
    }

    launchImageLibrary({ 
      mediaType: 'photo',
      selectionLimit: remainingSlots,
      quality: 0.7, // Lower quality for faster uploads
      maxWidth: 1200, // Limit image width
      maxHeight: 1200, // Limit image height
      includeBase64: false, // Don't include base64 to reduce memory usage
    }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setImages([...images, ...response.assets]);
        if (imageError) {
          setImageError('');
        }
      }
    });
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    if (newImages.length > 0) {
      setImageError('');
    }
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsUploading(true);

    try {
      // Upload images in parallel
      const uploadPromises = images.map(async (image, index) => {
        try {
          const url = await uploadImageToCloudinary(image);
          return url;
        } catch (error) {
          console.error(`Error uploading image ${index + 1}:`, error);
          throw error;
        }
      });

      // Wait for all uploads to complete
      const uploadedImageUrls = await Promise.all(uploadPromises);

      // Prepare image object with the correct format
      const imageObject = {
        imageUrl: uploadedImageUrls[0] || "",
        image2: uploadedImageUrls[1] || "",
        image3: uploadedImageUrls[2] || ""
      };

      // Prepare request body
      const requestBody = {
        userId: user.id,
        userName: customerName,
        address: selectedAddress.userAddress,
        cusPhone: customerPhone,
        length: parseFloat(length),
        width: parseFloat(width),
        description: description,
        image: imageObject,
        serviceOrderDetails: []
      };

      // Make API call
      const response = await api.post('/serviceorder/nousing', requestBody);

      // If we get here, the request was successful
      setShowSuccessModal(true);
      // Reset form
      setLength('');
      setWidth('');
      setImages([]);
      setDescription('');
      setCustomerName(user?.name || '');
      setCustomerPhone(user?.phone || '');
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert(
        "Lỗi", 
        error.data?.message || error.message || "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // --- Address Functions (Copied & adapted from OrderScreen) ---
  useEffect(() => {
    // Initialize with context address if available
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
      // Set initial name/phone for the new address modal based on user context
      setNewAddressName(user.name || '');
      setNewAddressPhone(user.phone || '');
    }
  }, [user]); // Run when user context loads/changes

  const formatAddress = (addressString) => {
    if (!addressString) return 'No address available';
    const parts = addressString.split('|');
    const street = parts[0] || '';
    const ward = parts[1] || '';
    const district = parts[2] || '';
    const province = parts[3] || '';
    return `${street}, ${ward}, ${district}, ${province}`;
  };

  const fetchAddresses = async () => {
    if (!user || !user.id || !user.backendToken) {
      Alert.alert("Error", "User information is missing. Cannot fetch addresses.");
      return;
    }
    setLoadingAddresses(true);
    try {
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

      const response = await api.get(`/address/user/${user.id}`);
      const apiAddresses = response.data || response;
      let addresses = [];
      let foundContextMatch = false;

      if (apiAddresses.length > 0) {
        apiAddresses.forEach(addr => {
          const addressCopy = { ...addr };
          if (contextAddress && addressCopy.userAddress === contextAddress.userAddress) {
            addressCopy.isDefault = true;
            foundContextMatch = true;
          }
          addresses.push(addressCopy);
        });
        if (contextAddress && !foundContextMatch) {
          addresses.unshift(contextAddress);
        }
      } else if (contextAddress) {
        addresses.push(contextAddress);
      }
      setAddressList(addresses);
      // If no address is currently selected, set the default/first one
      if (!selectedAddress && addresses.length > 0) {
         const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
         setSelectedAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Could not load addresses. Please try again.');
      if (user?.address && addressList.length === 0) {
        const contextAddress = {
          id: 'context-address',
          userId: user.id,
          name: user.name || '',
          phone: user.phone || '',
          userAddress: user.address,
          isDefault: true,
        };
        setAddressList([contextAddress]);
        if (!selectedAddress) {
          setSelectedAddress(contextAddress);
        }
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressChange = (details) => {
    setAddressDetails(details);
  };

  const validateNewAddress = () => {
    let isValid = true;
    if (!newAddressStreet.trim()) {
      setStreetError('Please enter your street address');
      isValid = false;
    } else {
      setStreetError('');
    }
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

  const handleAddNewAddress = async () => {
    if (!validateNewAddress() || !user || !user.id || !user.backendToken) {
      if (!user || !user.id || !user.backendToken) {
        Alert.alert("Error", "User information is missing. Cannot save address.");
      }
      return;
    }
    setSavingAddress(true);
    try {
      const userAddress = `${newAddressStreet}|${addressDetails.wardName}|${addressDetails.districtName}|${addressDetails.provinceName}`;
      const requestBody = {
        userId: user.id,
        name: newAddressName,
        phone: newAddressPhone,
        userAddress: userAddress,
      };

      const response = await api.post('/address', requestBody);

      if (response.status === 200 || response.status === 201) {
        setNewAddressStreet('');
        setAddressDetails({});
        setShowNewAddressModal(false);
        setTimeout(() => {
          fetchAddresses();
        }, 500);
        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      Alert.alert('Error', `Could not create address: ${error.response?.data?.message || error.message}`);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOpenNewAddressModal = () => {
    setShowAddressModal(false);
    // Reset form fields, keeping name/phone from context
    setNewAddressName(user?.name || '');
    setNewAddressPhone(user?.phone || '');
    setNewAddressStreet('');
    setAddressDetails({});
    setStreetError(''); // Clear errors
    setShowNewAddressModal(true);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    // Update customer name and phone based on selected address
    setCustomerName(address.name || user?.name || '');
    setCustomerPhone(address.phone || user?.phone || '');
    if (address) {
      setCustomerInfoError('');
    }
    setShowAddressModal(false);
  };

  const handleChangeAddress = () => {
    fetchAddresses(); // Fetch latest addresses when opening modal
    setShowAddressModal(true);
  };

  const renderAddressItem = ({ item }) => (
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
      <View style={[styles.checkCircle, selectedAddress?.id === item.id && styles.checkCircleSelected]}>
        {selectedAddress?.id === item.id && (
          <Icon name="check" size={16} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );
  // -------------------------------------------------------

  const handleCustomerNameChange = (text) => {
    setCustomerName(text);
    if (text.trim() && customerPhone.trim() && selectedAddress) {
      setCustomerInfoError('');
    }
  };

  const handleCustomerPhoneChange = (text) => {
    setCustomerPhone(text);
    if (customerName.trim() && text.trim() && selectedAddress) {
      setCustomerInfoError('');
    }
  };

  const handleLengthChange = (text) => {
    setLength(text.replace(/[^0-9.]/g, ''));
    if (text.trim() && width.trim()) {
      setSpatialInfoError('');
    }
  };

  const handleWidthChange = (text) => {
    setWidth(text.replace(/[^0-9.]/g, ''));
    if (length.trim() && text.trim()) {
      setSpatialInfoError('');
    }
  };

  const handleDescriptionChange = (text) => {
    setDescription(text);
    if (text.trim()) {
      setDescriptionError('');
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate customer information
    if (!customerName.trim() || !customerPhone.trim() || !selectedAddress) {
      setCustomerInfoError('Vui lòng điền đầy đủ thông tin khách hàng');
      isValid = false;
    } else {
      setCustomerInfoError('');
    }

    // Validate spatial information
    if (!length.trim() || !width.trim()) {
      setSpatialInfoError('Vui lòng cung cấp thông tin không gian');
      isValid = false;
    } else {
      setSpatialInfoError('');
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError('Vui lòng cung cấp mô tả yêu cầu của bạn');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    // Validate images
    if (images.length === 0) {
      setImageError('Vui lòng cung cấp ít nhất một hình ảnh');
      isValid = false;
    } else {
      setImageError('');
    }

    return isValid;
  };

  const handleImagePress = (image) => {
    setSelectedImage(image);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  const handleDismiss = () => {
    setShowLoginModal(false);
    navigation.navigate('Home');
  };

  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('Login', { returnTo: true });
  };

  const LoginModal = () => (
    <Modal
      visible={showLoginModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="account-lock-outline" size={60} color="#0EA5E9" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.modalMessage}>
            Để thực hiện yêu cầu, vui lòng đăng nhập. Xin cảm ơn
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={handleDismiss}
            >
              <Text style={styles.modalCancelButtonText}>Quay lại</Text>
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

  return (
    <ScrollView style={styles.scrollViewContainer}>
      <LoginModal />
      <Text style={styles.title}>Gửi thông tin nhận tư vấn thiết kế</Text>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
        
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Họ và tên</Text>
          <TextInput
            style={[styles.formInput, customerInfoError && !customerName.trim() ? styles.inputError : null]}
            value={customerName}
            onChangeText={handleCustomerNameChange}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#94A3B8"
          />
          
          <Text style={styles.fieldLabel}>Số điện thoại</Text>
          <TextInput
            style={[styles.formInput, customerInfoError && !customerPhone.trim() ? styles.inputError : null]}
            value={customerPhone}
            onChangeText={handleCustomerPhoneChange}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
          
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <Text style={styles.fieldLabel}>Địa chỉ</Text>
              <TouchableOpacity onPress={handleChangeAddress}>
                <Text style={styles.changeButton}>Thay đổi</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.addressDisplay, customerInfoError && !selectedAddress ? styles.inputError : null]}
              onPress={handleChangeAddress}
            >
              <Text style={styles.addressText}>
                {selectedAddress ? formatAddress(selectedAddress.userAddress) : 'Chọn địa chỉ giao hàng'}
              </Text>
            </TouchableOpacity>
          </View>
          {customerInfoError ? <Text style={styles.errorText}>{customerInfoError}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Thông tin không gian</Text>
        <View style={styles.formSection}>
          <View style={styles.spaceInputRow}>
            <View style={styles.spaceInputGroup}>
              <Text style={styles.fieldLabel}>Chiều dài</Text>
              <View style={[styles.measurementInput, spatialInfoError && !length.trim() ? styles.inputError : null]}>
                <TextInput
                  style={styles.spaceInput}
                  value={length}
                  onChangeText={handleLengthChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.unitText}>m</Text>
              </View>
            </View>
            <View style={styles.spaceInputDivider} />
            <View style={styles.spaceInputGroup}>
              <Text style={styles.fieldLabel}>Chiều rộng</Text>
              <View style={[styles.measurementInput, spatialInfoError && !width.trim() ? styles.inputError : null]}>
                <TextInput
                  style={styles.spaceInput}
                  value={width}
                  onChangeText={handleWidthChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.unitText}>m</Text>
              </View>
            </View>
          </View>
          {spatialInfoError ? <Text style={styles.errorText}>{spatialInfoError}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Hình ảnh và Mô tả</Text>
        <View style={styles.formSection}>
          <View style={styles.imageUploadSection}>
            <View style={styles.uploadHeader}>
              <Text style={styles.fieldLabel}>Hình ảnh không gian</Text>
              <Text style={styles.imageCountText}>{images.length}/3</Text>
            </View>
            <TouchableOpacity 
              style={[styles.uploadButton, imageError && images.length === 0 ? styles.inputError : null]} 
              onPress={choosePhoto}
              disabled={images.length >= 3}
            >
              <Icon name="image-plus" size={24} color="#0EA5E9" />
              <Text style={styles.uploadButtonText}>
                {images.length === 0 ? 'Tải lên hình ảnh không gian' : 'Thêm hình ảnh'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.imagePreviewContainer}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imagePreview}
                  onPress={() => handleImagePress(image)}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close-circle" size={18} color="#475569" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
            {imageError ? <Text style={styles.errorText}>{imageError}</Text> : null}
          </View>

          <Text style={styles.fieldLabel}>Mô tả yêu cầu</Text>
          <TextInput
            style={[styles.formInput, styles.descriptionInput, descriptionError && !description.trim() ? styles.inputError : null]}
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="Mô tả chi tiết yêu cầu của bạn (màu sắc, phong cách, ngân sách, v.v.)"
            placeholderTextColor="#94A3B8"
            multiline
          />
          {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isUploading && styles.disabledButton]} 
          onPress={handleSubmitRequest}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Address Selection Modal --- */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Icon name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addNewAddressButton}
              onPress={handleOpenNewAddressModal}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.addNewAddressText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>

            {loadingAddresses ? (
              <ActivityIndicator size="large" color="#0EA5E9" style={styles.loadingIndicator} />
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
                <Text style={styles.noAddressSubText}>Vui lòng thêm địa chỉ mới</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* ----------------------------- */}


      {/* --- Add New Address Modal --- */}
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
                <Icon name="close" size={24} color="#475569" />
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
                  style={[styles.formInput, streetError ? styles.inputError : null]}
                  placeholder="Nhập tên đường, số nhà"
                  value={newAddressStreet}
                  onChangeText={setNewAddressStreet}
                />
                {streetError ? <Text style={styles.errorText}>{streetError}</Text> : null}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Địa chỉ</Text>
                <Address onAddressChange={handleAddressChange} initialAddress={{}} />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, savingAddress && styles.disabledButton]}
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
      {/* --------------------------- */}

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={handleClosePreview}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={handleClosePreview}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage?.uri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="alert-circle-outline" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận gửi yêu cầu</Text>
            <Text style={styles.modalSubtitle}>
              Bạn có chắc chắn muốn gửi yêu cầu thiết kế này?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmSubmit}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={36} color="#4ADE80" />
            </View>
            <Text style={styles.successTitle}>Thành công</Text>
            <Text style={styles.successMessage}>
              Chúng tôi đã tiếp nhận yêu cầu của bạn, chúng tôi sẽ sớm liên hệ với bạn. Xin cảm ơn
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleCloseSuccessModal}
            >
              <Text style={styles.successButtonText}>Xác nhận</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewOrderButton}
              onPress={() => {
                handleCloseSuccessModal();
                navigation.navigate('Account', {
                  screen: 'NewDesignTab',
                  params: {
                    screen: 'ServiceNoUsingOrders',
                    initial: false,
                  },
                });
              }}
            >
              <Text style={styles.viewOrderButtonText}>Xem đơn hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default NewDesignScreen;



