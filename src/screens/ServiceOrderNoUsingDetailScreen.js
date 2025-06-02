import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  RefreshControl,
  Keyboard,
} from 'react-native';
import {Card, Divider} from 'react-native-paper';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect} from '@react-navigation/native';
import ContractModal from '../components/ContractModal';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {styles} from './ServiceOrderNoUsingDetailScreen.styles';
import {uploadImageToCloudinary} from '../hooks/UploadToCloud';
import StatusTrackingMaterial from '../components/StatusTrackingMaterial';
import {useWallet} from '../context/WalletContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../api/api';

const {width, height} = Dimensions.get('window');

const ServiceOrderNoUsingDetailScreen = ({route, navigation}) => {
  const {orderId} = route.params;
  const {user} = useAuth();
  const {balance, refreshWallet} = useWallet();
  const [order, setOrder] = useState(null);
  const [recordSketches, setRecordSketches] = useState([]);
  const [recordDesigns, setRecordDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [showSignatureOptions, setShowSignatureOptions] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
  const [contractSignLoading, setContractSignLoading] = useState(false);
  const [isDesignConfirmation, setIsDesignConfirmation] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [maxPhase, setMaxPhase] = useState(0);
  const [maxPhaseDesign, setMaxPhaseDesign] = useState(0);
  const [redraftModalVisible, setRedraftModalVisible] = useState(false);
  const [redraftReason, setRedraftReason] = useState('');
  const [redraftLoading, setRedraftLoading] = useState(false);
  const [redesignModalVisible, setRedesignModalVisible] = useState(false);
  const [redesignReason, setRedesignReason] = useState('');
  const [redesignLoading, setRedesignLoading] = useState(false);
  const [materialProducts, setMaterialProducts] = useState({});
  // Add refreshing state
  const [refreshing, setRefreshing] = useState(false);
  // Add these state variables at the top with other useState declarations
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  // --- Schedule Delivery State ---
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [installConfirmModalVisible, setInstallConfirmModalVisible] =
    useState(false);
  const [installConfirmLoading, setInstallConfirmLoading] = useState(false);

  // Add useRefs for TextInputs
  const redraftInputRef = useRef(null);
  const redesignInputRef = useRef(null);

  // Add this function to handle redraft text changes without losing focus
  const handleRedraftReasonChange = text => {
    setRedraftReason(text);
  };

  // Add this function to handle redesign text changes without losing focus
  const handleRedesignReasonChange = text => {
    setRedesignReason(text);
  };

  const showSketchPhaseStatuses = [
    'DoneDeterminingDesignPrice', // 22
    'WaitDeposit', // 21
    'DepositSuccessful', // 3
    'AssignToDesigner', // 4
    'DeterminingMaterialPrice', // 5
    'DoneDesign', // 6
    'DoneDeterminingMaterialPrice', // 23
    'PaymentSuccess', // 7
    'Processing', // 8
    'PickedPackageAndDelivery', // 9
    'DeliveryFail', // 10
    'ReDelivery', // 11
    'DeliveredSuccessfully', // 12
    'CompleteOrder', // 13
    'Warning', // 15
    'ReConsultingAndSketching', // 19
    'ReDesign', // 20
    'Installing',
    'DoneInstalling',
    'Successfully',
    "MaterialPriceConfirmed"
    // Add other relevant statuses if needed
  ];

  const showDesignPhaseStatuses = [
    'AssignToDesigner', // 4
    'DoneDesign', // 6
    'DoneDeterminingMaterialPrice', // 23
    'PaymentSuccess', // 7
    'Processing', // 8
    'PickedPackageAndDelivery', // 9
    'DeliveryFail', // 10
    'ReDelivery', // 11
    'DeliveredSuccessfully', // 12
    'CompleteOrder', // 13
    'Warning', // 15
    'ReDesign', // 20
    'Installing',
    'DoneInstalling',
    'Successfully',
    
  ];

  const showSchedule = [
    'AssignToDesigner', // 4
    'DeterminingMaterialPrice', // 5
    'DoneDesign', // 6
    'DoneDeterminingMaterialPrice', // 23
    'PaymentSuccess', // 7
    'Processing', // 8
    'PickedPackageAndDelivery', // 9
    'DeliveryFail', // 10
    'ReDelivery', // 11
    'DeliveredSuccessfully', // 12
    'CompleteOrder', // 13
    'Warning', // 15
    'ReDesign', // 20
  ];

  const statusDontShowdepositField = [
    "Pending",
      "ConsultingAndSketching",
      'DeterminingDesignPrice',
       "WaitDeposit",
       "DoneDeterminingDesignPrice",   
       "ReConsultingAndSketching",  
       "StopService"
  ]

  const statusShowTotalPayment = [
    "PaymentSuccess", "Processing", "Installing", "DoneInstalling", "Successfully"
  ]

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails().finally(() => setRefreshing(false));
  }, [orderId, user]);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();

      return () => {
        // Any cleanup code can go here
      };
    }, [orderId, user]),
  );

  // Helper function to check if contract should be displayed for current status
  const shouldDisplayContract = status => {
    const contractDisplayStatuses = [
      'waitdeposit', // 21
      'depositsuccessful', // 3
      'assigntodesigner', // 4
      'determiningmaterialprice', // 5
      'donedesign', // 6
      'donedeterminingmaterialprice', // 23
      'paymentsuccess', // 7
      'processing', // 8
      'pickedpackageanddelivery', // 9
      'deliveryfail', // 10
      'redelivery', // 11
      'deliveredsuccessfully', // 12
      'completeorder', // 13
      'warning', // 15
      'redesign', // 20
      'installing',
      'doneinstalling',
      'successfully',
    "MaterialPriceConfirmed"

    ];

    return contractDisplayStatuses.includes(status?.toLowerCase());
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/serviceorder/${orderId}`);
      const orderData = response

      if (!orderData) {
        throw new Error("Order data not found in response.");
      }

      setOrder(orderData);

      // Check if we need to fetch record sketches
      if (orderData.recordSketches && orderData.recordSketches.length > 0) {
        fetchRecordSketches(orderId);
      }

      // Fetch record designs
      fetchRecordDesigns(orderId);

      // Check if we need to handle contract based on status
      if (shouldDisplayContract(orderData.status)) {
        handleContract(orderData);
      }

      // Fetch product details if serviceOrderDetails exist
      if (
        orderData.serviceOrderDetails &&
        orderData.serviceOrderDetails.length > 0
      ) {
        for (const detail of orderData.serviceOrderDetails) {
          fetchProductDetails(detail.productId);
        }
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Không thể tải chi tiết đơn hàng.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordSketches = async orderId => {
    try {
      const response = await api.get(`/recordsketch/${orderId}/orderservice`);
      
      const sketches = response
      setRecordSketches(sketches);

      // Calculate maximum phase from sketches
      if (sketches.length > 0) {
        const maxSketchPhase = Math.max(
          ...sketches.map(sketch => sketch.phase),
        );
        setMaxPhase(prev => Math.max(prev, maxSketchPhase));
      }
    } catch (err) {
      // We don't set error state here to avoid blocking the entire screen
      //console.error('Error fetching record sketches:', err);
    }
  };

  const fetchRecordDesigns = async orderId => {
    try {
      const response = await api.get(`/recorddesign/${orderId}/orderservice`);
      const designs = response
      setRecordDesigns(designs);
      
      if (designs.length > 0) {
        const maxDesignPhase = Math.max(...designs.map(design => design.phase));
        setMaxPhaseDesign(prev => Math.max(prev, maxDesignPhase));
      }
    } catch (err) {
      // We don't set error state here to avoid blocking the entire screen
      //console.error('Error fetching record designs:', err);
    }
  };

  const handleImagePress = imageUri => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const handleConfirmSketch = recordId => {
    setSelectedRecordId(recordId);
    setIsDesignConfirmation(false);
    setConfirmModalVisible(true);
  };

  const confirmSketch = async () => {
    try {
      setConfirmLoading(true);

      // Check if this is a design confirmation
      if (isDesignConfirmation) {
        await confirmDesign();
        return;
      }

      // Step 1: Confirm the record sketch
      const recordSketchUrl = `/recordsketch/${selectedRecordId}`;
      await api.put(recordSketchUrl, {
        isSelected: true,
      });

      // Step 2: Update the order status
      const updateStatusUrl = `/serviceorder/status/${orderId}`;
      await api.put(updateStatusUrl, {
        status: 21,
      });

      // Close confirmation modal and show success modal
      setConfirmModalVisible(false);
      setSuccessModalVisible(true);

      // Refresh data
      fetchOrderDetails();
    } catch (err) {
      console.error('Error confirming sketch:', err);
      Alert.alert(
        'Lỗi',
        'Không thể xác nhận bản phác thảo. Vui lòng thử lại sau.',
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleContract = async orderData => {
    try {
      setContractLoading(true);
      setContractError(null);

      // First, try to fetch existing contract
      const contractFetchUrl = `/contract/${orderId}/serviceorder`;
      let existingContract = null;

      try {
        const response = await api.get(contractFetchUrl);
        console.log("response contract", response);
        
        existingContract = response && response.length > 0 ? response[0] : null;
      } catch (fetchErr) {
        //console.error("Failed to fetch contract:", fetchErr); 
        console.log("Không có hợp đồng sẵn có, đang thực hiện tạo mới", fetchErr);
        
      }

      if (existingContract) {
        // Contract already exists, just set it
        setContract(existingContract);
      } else {
        // Need to create a new contract
        const contractData = {
          userId: orderData.userId,
          serviceOrderId: orderData.id,
          name: orderData.userName,
          email: orderData.email,
          address: orderData.address,
          phone: orderData.cusPhone,
          designPrice: orderData.designPrice || 0,
        };

        // Create the contract
        const contractCreateUrl = `/contract`;
        try {
          await api.post(contractCreateUrl, contractData);

          // Fetch the newly created contract
          const fetchResponse = await api.get(contractFetchUrl);
          if (fetchResponse && fetchResponse.length > 0) {
            setContract(fetchResponse[0]);
          }
        } catch (createErr) {
          console.error("Failed to create or fetch new contract:", createErr);
          setContractError('Không thể tải hợp đồng. Vui lòng thử lại sau.');
        }
      }
    } catch (err) {
      console.error('Error handling contract:', err);
      setContractError(
        'Không thể tạo hoặc tải hợp đồng. Vui lòng thử lại sau.',
      );
    } finally {
      setContractLoading(false);
    }
  };

  const handleViewContract = () => {
    setContractModalVisible(true);
  };

  const ImageModal = () => {
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedImage(null);
        }}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setModalVisible(false);
              setSelectedImage(null);
            }}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableWithoutFeedback
            onPress={() => {
              setModalVisible(false);
              setSelectedImage(null);
            }}>
            <Image
              source={{uri: selectedImage}}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  const ConfirmModal = () => (
    <Modal
      visible={confirmModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setConfirmModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmModalTitle}>
            {isDesignConfirmation
              ? 'Xác nhận bản vẽ chi tiết'
              : 'Xác nhận bản phác thảo'}
          </Text>
          <Text style={styles.confirmModalText}>
            {isDesignConfirmation
              ? 'Bạn có chắc chắn muốn xác nhận bản vẽ chi tiết này không? Sau khi chọn, thiết kế này sẽ được sử dụng để xác định giá vật liệu và tiến hành các bước tiếp theo.'
              : 'Bạn có chắc chắn muốn xác nhận bản phác thảo này không?'}
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                styles.confirmModalButtonCancel,
              ]}
              onPress={() => setConfirmModalVisible(false)}
              disabled={confirmLoading}>
              <Text style={styles.confirmModalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                styles.confirmModalButtonConfirm,
              ]}
              onPress={confirmSketch}
              disabled={confirmLoading}>
              {confirmLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmModalButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const SuccessModal = () => (
    <Modal
      visible={successModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setSuccessModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <Icon
            name="check-circle-outline"
            size={60}
            color="#34C759"
            style={styles.successIcon}
          />
          <Text style={styles.successModalTitle}>Xác nhận thành công</Text>
          <Text style={styles.successModalText}>
            {isDesignConfirmation
              ? 'Bản vẽ chi tiết đã được xác nhận thành công.'
              : 'Bản phác thảo đã được xác nhận thành công. Tiếp theo bạn sẽ tới bước ký hợp đồng, vui lòng đọc kỹ nội dung và thực hiện ký hợp đồng'}
          </Text>
          <TouchableOpacity
            style={styles.successModalButton}
            onPress={() => setSuccessModalVisible(false)}>
            <Text style={styles.successModalButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const chooseSignatureFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) {
          // console.log('User cancelled image picker');
        } else if (response.errorCode) {
          // console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Lỗi', 'Không thể tải ảnh. Vui lòng thử lại.');
        } else if (response.assets && response.assets.length > 0) {
          setSignatureImage(response.assets[0].uri);
          setShowSignatureOptions(false);
        }
      },
    );
  };

  const captureSignatureFromCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) {
          // console.log('User cancelled camera');
        } else if (response.errorCode) {
          // console.log('Camera Error: ', response.errorMessage);
          Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
        } else if (response.assets && response.assets.length > 0) {
          setSignatureImage(response.assets[0].uri);
          setShowSignatureOptions(false);
        }
      },
    );
  };

  const openSignatureDrawing = () => {
    Alert.alert(
      'Tính năng đang phát triển',
      'Chức năng vẽ chữ ký đang được phát triển. Vui lòng sử dụng các phương thức khác.',
    );
    setShowSignatureOptions(false);
  };

  const handleSignaturePreview = imageUri => {
    // A separate state could be used for signature preview to avoid conflicts
    setSelectedImage(imageUri);
    // We'll only use modalVisible for image previews, not signatures
  };

  const handleSignContract = () => {
    if (!signatureImage) {
      Alert.alert('Thông báo', 'Vui lòng tải lên chữ ký trước khi xác nhận.');
      return;
    }

    setShowSignConfirmModal(true);
  };

  const confirmSignContract = async () => {
    if (!signatureImage || !contract || !order) {
      Alert.alert('Lỗi', 'Thiếu thông tin cần thiết để ký hợp đồng.');
      setShowSignConfirmModal(false);
      return;
    }

    setContractSignLoading(true);

    try {
      // Step 1: Upload signature to cloud
      let signatureUrl;
      try {
        const signaturePhoto = {uri: signatureImage};
        signatureUrl = await uploadImageToCloudinary(signaturePhoto);

        if (!signatureUrl) {
          throw new Error('Không thể tải lên chữ ký. Vui lòng thử lại.');
        }
      } catch (uploadError) {
        throw new Error(`Lỗi khi tải lên chữ ký: ${uploadError.message}`);
      }

      // Step 2: Call API to sign contract
      const contractId = contract.id;
      await api.put(`/contract/${contractId}`, {signatureUrl: signatureUrl});

      // Step 3: Get deposit payment percentage
      const percentageResponse = await api.get('/percentage');
      const depositPercentage = percentageResponse.depositPercentage;

      // Step 4: Process payment
      const amount = Math.round((order.designPrice * depositPercentage) / 100);
      const paymentDescription = `Pay ${depositPercentage}% design fee for order ${order.id}`;

      // Create payment payload
      const paymentPayload = {
        walletId: user.wallet.id,
        serviceOrderId: order.id,
        amount: amount,
        description: paymentDescription,
      };

      await api.post('/bill', paymentPayload);

      // Step 5: Update order status
      await api.put(`/serviceorder/status/${order.id}`, {status: 3});

      // Step 6: Update task order if workTasks exists
      if (order.workTasks && order.workTasks.length > 0) {
        const taskId = order.workTasks[0].id;
        await api.put(`/worktask/${taskId}`, {
          serviceOrderId: order.id,
          userId: user.id,
          dateAppointment: order.workTasks[0].dateAppointment,
          timeAppointment: order.workTasks[0].timeAppointment,
          status: 2,
          note: 'Đã thanh toán cọc và ký hợp đồng',
        });
      }

      // Step 7: Refresh data and close modal
      setShowSignConfirmModal(false);

      // Refresh wallet balance
      await refreshWallet(true);

      // Show success message
      Alert.alert(
        'Thành công',
        'Bạn đã ký hợp đồng và thanh toán cọc thành công.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh order details
              fetchOrderDetails();
            },
          },
        ],
      );
    } catch (error) {
      setShowSignConfirmModal(false);
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra trong quá trình ký hợp đồng: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setContractSignLoading(false);
    }
  };

  const SignContractConfirmModal = () => {
    // Calculate financial information
    const totalDesignCost = order?.designPrice || 0;
    const depositAmount = totalDesignCost * 0.5; // 50% of design price
    const walletBalance = balance || 0;
    const hasEnoughBalance = walletBalance >= depositAmount;

    return (
      <Modal
        visible={showSignConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          !contractSignLoading && setShowSignConfirmModal(false)
        }>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={{alignItems: 'center', marginBottom: 20}}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#EBF5FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                <Icon name="file-document-outline" size={32} color="#007AFF" />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#000',
                  textAlign: 'center',
                }}>
                Xác nhận ký hợp đồng
              </Text>
            </View>

            {/* Financial Information Section */}
            <View
              style={styles.financialInfoModalContainer}>
              <View
                style={styles.financialInfoModalRow}>
                <Text style={styles.financialInfoModalLabel}>
                  Tổng chi phí thiết kế:
                </Text>
                <Text
                  style={styles.financialInfoModalValue}>
                  {formatCurrency(totalDesignCost)}
                </Text>
              </View>
              <View
                style={styles.financialInfoModalRow}>
                <Text style={styles.financialInfoModalLabel}>
                  Tiền cọc (50%):
                </Text>
                <Text
                  style={[styles.financialInfoModalValue, { color: '#007AFF' }]}>
                  {formatCurrency(depositAmount)}
                </Text>
              </View>
              <View
                style={[styles.financialInfoModalRow, styles.financialInfoModalDivider]}>
                <Text style={styles.financialInfoModalLabel}>
                  Số dư ví hiện tại:
                </Text>
                <Text
                  style={[
                    styles.financialInfoModalValue,
                    hasEnoughBalance ? styles.sufficientBalance : styles.insufficientBalance,
                  ]}>
                  {formatCurrency(walletBalance)}
                </Text>
              </View>
            </View>

            {!hasEnoughBalance && (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{flex: 1, paddingRight: 10}}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#B91C1C',
                      lineHeight: 20,
                    }}>
                    Số dư không đủ. Vui lòng nạp thêm{'\n'}
                    <Text style={{fontWeight: '600'}}>
                      {formatCurrency(depositAmount - walletBalance)}
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#2563EB',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                  }}
                  onPress={() => {
                    setShowSignConfirmModal(false);
                    navigation.navigate('Account', {
                      screen: 'Profile',
                      params: {screen: 'TopUp'},
                    });
                  }}>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '500',
                    }}>
                    Nạp tiền
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text
              style={{
                fontSize: 15,
                color: '#475569',
                marginBottom: 24,
                textAlign: 'center',
                lineHeight: 22,
              }}>
              Bằng việc nhấn nút "Xác nhận & Thanh toán cọc", bạn đồng ý với các
              điều khoản trong hợp đồng và đồng ý thanh toán
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F1F5F9',
                  paddingVertical: 15,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginRight: 8,
                }}
                onPress={() => setShowSignConfirmModal(false)}
                disabled={contractSignLoading}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: '#64748B',
                  }}>
                  Hủy
                </Text>
              </TouchableOpacity>

              {hasEnoughBalance ? (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#2563EB',
                    paddingVertical: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginLeft: 8,
                  }}
                  onPress={confirmSignContract}
                  disabled={contractSignLoading}>
                  {contractSignLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#FFFFFF',
                      }}>
                      Xác nhận & Thanh toán cọc
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#94A3B8',
                    paddingVertical: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginLeft: 8,
                  }}
                  disabled={true}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}>
                    Xác nhận & Thanh toán cọc
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Update the handleConfirmDesign function to use modal instead of Alert
  const handleConfirmDesign = recordId => {
    setSelectedRecordId(recordId);
    setIsDesignConfirmation(true);
    setConfirmModalVisible(true);
  };

  // Updated confirmDesign function to work with the modal
  const confirmDesign = async () => {
    try {
      // Confirm the record design
      await api.put(`/recorddesign/${selectedRecordId}`, {
        isSelected: true,
      });

      // Update the order status to 6 (DoneDesign)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 6,
      });

      // Close confirmation modal and show success modal
      setConfirmModalVisible(false);
      setSuccessModalVisible(true);

      // Refresh data
      fetchOrderDetails();

      return true;
    } catch (err) {
      console.error('Error confirming design:', err);
      Alert.alert(
        'Lỗi',
        'Không thể xác nhận bản vẽ chi tiết. Vui lòng thử lại sau.',
      );
      return false;
    }
  };

  // Add handler for opening payment modal
  const handlePaymentPress = () => {
    setPaymentModalVisible(true);
  };

  // Add function to handle payment confirmation
  const handleConfirmPayment = async () => {
    try {
      setPaymentLoading(true);

      // Calculate amounts
      const designFeeTotal = order.designPrice || 0;
      const designFeeRemaining = designFeeTotal * 0.5;
      const materialPrice = order.materialPrice || 0;
      const totalPayment = designFeeRemaining + materialPrice;

      // API call to process payment
      const paymentDescription = `Thanh toán phí thiết kế còn lại (50%) và giá vật liệu cho đơn hàng ${order.id}.`;

      // Create payment payload
      const paymentPayload = {
        walletId: user.wallet?.id || user.id,
        serviceOrderId: order.id,
        amount: totalPayment,
        description: paymentDescription,
      };

      console.log('Payment payload:', JSON.stringify(paymentPayload));

      // Process payment
      await api.post('/bill', paymentPayload);

      // Update order status to "PaymentSuccess" (7)
      await api.put(`/serviceorder/status/${order.id}`, {status: 7});

      // Close payment modal
      setPaymentModalVisible(false);

      // Refresh wallet balance
      await refreshWallet(true);

      // Show success message
      Alert.alert(
        'Thanh toán thành công',
        'Thanh toán đã được xử lý thành công. Đơn hàng của bạn đang được chuẩn bị',
        [
          {
            text: 'OK',
            onPress: () => fetchOrderDetails(),
          },
        ],
      );
    } catch (error) {
      console.log('error', error);
      Alert.alert(
        `${error.response?.data.error} `,
        'Lỗi thanh toán',
        'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.',
      );
    }
  };

  // Add Payment Modal component
  const PaymentModal = () => {
    // Calculate payment amounts
    const designFeeTotal = order?.designPrice || 0;
    const designFeePaid = designFeeTotal * 0.5; // Assuming 50% was already paid
    const designFeeRemaining = designFeeTotal * 0.5;
    const materialPrice = order?.materialPrice || 0;
    const totalPayment = designFeeRemaining + materialPrice;
    const hasEnoughBalance = balance >= totalPayment;

    return (
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !paymentLoading && setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>
                Thanh toán 50% phí thiết kế còn lại và giá vật liệu
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  !paymentLoading && setPaymentModalVisible(false)
                }>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  Phí thiết kế đã thanh toán (50%):
                </Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(designFeePaid)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                  Phí thiết kế còn lại (50%):
                </Text>
                <Text style={[styles.paymentValue, styles.highlightedAmount]}>
                  {formatCurrency(designFeeRemaining)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Giá vật liệu:</Text>
                <Text style={[styles.paymentValue, styles.highlightedAmount]}>
                  {formatCurrency(materialPrice)}
                </Text>
              </View>

              <View style={[styles.paymentRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(totalPayment)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Số dư ví hiện tại:</Text>
                <Text
                  style={[
                    styles.paymentValue,
                    hasEnoughBalance
                      ? styles.sufficientBalance
                      : styles.insufficientBalance,
                  ]}>
                  {formatCurrency(balance)}
                </Text>
              </View>

              {!hasEnoughBalance && (
                <View style={styles.balanceWarningBox}>
                  <View style={styles.balanceWarningRow}>
                    <Icon
                      name="alert-circle"
                      size={18}
                      color="#FF3B30"
                      style={styles.warningIcon}
                    />
                    <Text style={styles.insufficientBalanceText}>
                      Số dư không đủ. Vui lòng nạp thêm{' '}
                      {formatCurrency(totalPayment - balance)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.balanceWarningTopUpButton}
                    onPress={() => {
                      setPaymentModalVisible(false);
                      navigation.navigate('Account', {
                        screen: 'Profile',
                        params: {screen: 'TopUp'},
                      });
                    }}>
                    <Text style={styles.balanceWarningTopUpButtonText}>
                      Nạp tiền
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {hasEnoughBalance && (
              <View style={styles.paymentInfoContainer}>
                <View style={styles.infoRow}>
                  <Icon
                    name="check-circle"
                    size={16}
                    color="#4CAF50"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    Thanh toán này bao gồm 50% phí thiết kế còn lại và toàn bộ
                    giá vật liệu
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon
                    name="check-circle"
                    size={16}
                    color="#4CAF50"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    Sau khi thanh toán, đơn hàng của bạn sẽ được xử lý và chuyển
                    sang giai đoạn sản xuất
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => !paymentLoading && setPaymentModalVisible(false)}
                disabled={paymentLoading}>
                <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>

              {hasEnoughBalance && (
                <TouchableOpacity
                  style={styles.confirmPaymentButton}
                  onPress={handleConfirmPayment}
                  disabled={paymentLoading}>
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmPaymentText}>
                      Xác nhận thanh toán
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Create a separate component for the input modals to manage their own state
  const InputModal = ({
    visible,
    onClose,
    onSubmit,
    title,
    description,
    initialValue = '',
    isLoading,
  }) => {
    // Local state that doesn't affect parent component
    const [localInputValue, setLocalInputValue] = useState(initialValue);
    const inputRef = useRef(null);

    // Reset local state when modal opens/closes
    useEffect(() => {
      if (visible) {
        setLocalInputValue(initialValue);
      }
    }, [visible, initialValue]);

    const handleSubmit = () => {
      if (!localInputValue.trim()) {
        Alert.alert(
          'Lỗi',
          'Vui lòng nhập lý do yêu cầu thiết kế lại.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
        return;
      }
      onSubmit(localInputValue);
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isLoading && onClose()}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.redraftModalContent}>
              <Text style={styles.redraftModalTitle}>{title}</Text>
              <Text style={styles.redraftModalText}>{description}</Text>

              <TextInput
                ref={inputRef}
                style={styles.redraftReasonInput}
                placeholder="Nhập lý do của bạn ở đây..."
                multiline={true}
                numberOfLines={4}
                value={localInputValue}
                onChangeText={setLocalInputValue}
                editable={!isLoading}
                autoFocus={true}
              />

              <View style={styles.redraftModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.redraftModalButton,
                    styles.redraftModalButtonCancel,
                  ]}
                  onPress={onClose}
                  disabled={isLoading}>
                  <Text style={styles.redraftModalButtonCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.redraftModalButton,
                    styles.redraftModalButtonConfirm,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.redraftModalButtonText}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Use the separated component
  const handleRedraftConfirmWithValue = value => {
    // Validate reason
    if (!value.trim()) {
      Alert.alert(
        'Lỗi',
        'Vui lòng nhập lý do yêu cầu thiết kế lại.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
      return;
    }

    setRedraftReason(value);
    handleRedraftConfirm(value);
  };

  const handleRedesignConfirmWithValue = value => {
    // Validate reason
    if (!value.trim()) {
      Alert.alert(
        'Lỗi',
        'Vui lòng nhập lý do yêu cầu thiết kế lại.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
      return;
    }

    setRedesignReason(value);
    handleRedesignConfirm(value);
  };

  const handleRedesignConfirm = async (reason = redesignReason) => {
    try {
      setRedesignLoading(true);

      // Step 1: Update order status to 20 (redesigning)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 20,
      });

      // Step 2: Update work task if available
      if (order.workTasks && order.workTasks.length > 0) {
        const taskId = order.workTasks[0].id;
        await api.put(`/worktask/${taskId}`, {
          serviceOrderId: order.id,
          userId: user.id,
          dateAppointment: order.workTasks[0].dateAppointment,
          timeAppointment: order.workTasks[0].timeAppointment,
          status: 0,
          note: reason,
        });
      }

      // Close modal and refresh data
      setRedesignModalVisible(false);

      // Show success message
      Alert.alert(
        'Thành công',
        'Yêu cầu thiết kế lại đã được gửi thành công.',
        [
          {
            text: 'OK',
            onPress: () => fetchOrderDetails(),
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      Alert.alert(
        'Lỗi',
        'Không thể gửi yêu cầu thiết kế lại. Vui lòng thử lại sau.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } finally {
      setRedesignLoading(false);
    }
  };

  // Replace RedraftModal and RedesignModal with the InputModal component
  const redraftModal = (
    <InputModal
      visible={redraftModalVisible}
      onClose={() => setRedraftModalVisible(false)}
      onSubmit={handleRedraftConfirmWithValue}
      title="Yêu cầu phác thảo lại"
      description="Vui lòng cung cấp lý do bạn muốn yêu cầu phác thảo lại:"
      initialValue={redraftReason}
      isLoading={redraftLoading}
    />
  );

  const redesignModal = (
    <InputModal
      visible={redesignModalVisible}
      onClose={() => setRedesignModalVisible(false)}
      onSubmit={handleRedesignConfirmWithValue}
      title="Yêu cầu thiết kế lại"
      description="Vui lòng cung cấp lý do bạn muốn yêu cầu thiết kế lại:"
      initialValue={redesignReason}
      isLoading={redesignLoading}
    />
  );

  // Add new function to handle re-draft button press
  const handleRedraftPress = () => {
    setRedraftModalVisible(true);
  };

  // Add new function to handle re-draft confirmation
  const handleRedraftConfirm = async (reason = redraftReason) => {
    try {
      setRedraftLoading(true);

      // Step 1: Update order status to 19 (reconsultingandsketching)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 19,
      });

      // Step 2: Update work task if available
      if (order.workTasks && order.workTasks.length > 0) {
        const taskId = order.workTasks[0].id;
        await api.put(`/worktask/${taskId}`, {
          serviceOrderId: order.id,
          userId: user.id,
          dateAppointment: order.workTasks[0].dateAppointment,
          timeAppointment: order.workTasks[0].timeAppointment,
          status: 0,
          note: reason,
        });
      }

      // Close modal and refresh data
      setRedraftModalVisible(false);

      // Show success message
      Alert.alert(
        'Thành công',
        'Yêu cầu phác thảo lại đã được gửi thành công.',
        [
          {
            text: 'OK',
            onPress: () => fetchOrderDetails(),
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      Alert.alert(
        'Lỗi',
        'Không thể gửi yêu cầu phác thảo lại. Vui lòng thử lại sau.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } finally {
      setRedraftLoading(false);
    }
  };

  const handleRedesignPress = () => {
    setRedesignReason('');
    setRedesignModalVisible(true);
  };

  // Add this new function after other existing fetch functions
  const fetchProductDetails = async productId => {
    try {
      if (materialProducts[productId]) {
        return materialProducts[productId]; // Return cached product if already fetched
      }

      const productData = await api.get(`/product/${productId}`);

      // Update state with the new product
      setMaterialProducts(prev => ({
        ...prev,
        [productId]: productData,
      }));

      return productData;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return null;
    }
  };

  // Add this function to handle service cancellation
  const handleCancelService = async () => {
    try {
      setCancelLoading(true);

      // API call to update order status to 18 (stopService)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 18,
      });

      // Hide modal and show success message
      setCancelModalVisible(false);
      Alert.alert('Thành công', 'Dịch vụ đã được hủy thành công.', [
        {
          text: 'OK',
          onPress: () => fetchOrderDetails(),
        },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể hủy dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Add this function to handle service cancellation with refund
  const handleCancelWithRefund = async () => {
    try {
      setCancelLoading(true);

      // Step 1: Call refund API
      await api.post(`/wallets/refund?id=${orderId}`);

      // Step 2: Update order status to StopService (18)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 18,
      });

      // Hide modal and show success message
      setCancelModalVisible(false);

      // Refresh wallet balance to show updated balance after refund
      await refreshWallet(true);

      Alert.alert(
        'Thành công',
        'Dịch vụ đã được hủy thành công và 30% tiền cọc sẽ được hoàn trả vào ví của bạn.',
        [
          {
            text: 'OK',
            onPress: () => fetchOrderDetails(),
          },
        ],
      );
    } catch (err) {
      console.log('err', err);
      setCancelModalVisible(false);

      Alert.alert('Lỗi', 'Không thể hủy dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Add this function to handle cancellation with payment of remaining design fee
  const handleCancelWithPayment = async () => {
    try {
      setCancelLoading(true);

      // Step 1: Calculate refund amount (10% of design price)
      const refundAmount = Math.round(order.designPrice * 0.1);

      // Step 2: Create payment payload
      const paymentPayload = {
        walletId: user.wallet?.id || user.id,
        serviceOrderId: order.id,
        amount: refundAmount,
        description: `Thanh toán phí hủy dịch vụ (30% giá thiết kế) cho đơn hàng ${order.id}`,
      };

      // Step 3: Process payment
      await api.post('/bill', paymentPayload);

      // Step 4: Update order status to StopService (18)
      await api.put(`/serviceorder/status/${orderId}`, {
        status: 18,
      });

      // Hide modal and show success message
      setCancelModalVisible(false);

      // Refresh wallet balance
      await refreshWallet(true);

      Alert.alert(
        'Thành công',
        'Dịch vụ đã được hủy thành công. Phí hủy dịch vụ đã được thanh toán.',
        [
          {
            text: 'OK',
            onPress: () => fetchOrderDetails(),
          },
        ],
      );
    } catch (err) {
      console.log('err', err);
      setCancelModalVisible(false);

      Alert.alert('Lỗi', 'Không thể hủy dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Add the cancel confirmation modal component
  const CancelServiceModal = () => {
    // Calculate financial information for DepositSuccessful status
    const designPrice = order?.designPrice || 0;
    const depositAmount = designPrice * 0.5; // 50% of design price
    const refundAmount = depositAmount * 0.3; // 10% of deposit
    const walletBalance = user?.wallet?.amount || 0;

    const isDepositSuccessful =
      order.status?.toLowerCase() === 'depositsuccessful';
    const isDesignPhase =
      order.status?.toLowerCase() === 'determiningmaterialprice' ||
      order.status?.toLowerCase() === 'donedeterminingmaterialprice' ||
      order.status?.toLowerCase() === 'donedesign';

    return (
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !cancelLoading && setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
           
            <Text style={styles.confirmModalTitle}>Xác nhận hủy dịch vụ</Text>

            {isDepositSuccessful && (
              <View style={styles.financialInfoContainer}>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>Giá thiết kế:</Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(designPrice)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Tiền cọc đã thanh toán (50%):
                  </Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(depositAmount)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Số tiền hoàn trả (30% cọc):
                  </Text>
                  <Text style={[styles.financialInfoValue, {color: '#34C759'}]}>
                    {formatCurrency(refundAmount)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Số dư ví hiện tại:
                  </Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Số dư sau khi hoàn tiền:
                  </Text>
                  <Text
                    style={[
                      styles.financialInfoValue,
                      {fontWeight: 'bold', color: '#007AFF'},
                    ]}>
                    {formatCurrency(balance + refundAmount)}
                  </Text>
                </View>
              </View>
            )}

            {isDesignPhase && (
              <View style={styles.financialInfoContainer}>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>Giá thiết kế:</Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(designPrice)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Tiền cọc đã thanh toán (50%):
                  </Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(depositAmount)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Phí thiết kế còn lại cần thanh toán:
                  </Text>
                  <Text style={[styles.financialInfoValue, {color: '#FF3B30'}]}>
                    {formatCurrency(depositAmount)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Số dư ví hiện tại:
                  </Text>
                  <Text style={styles.financialInfoValue}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                <View style={styles.financialInfoRow}>
                  <Text style={styles.financialInfoLabel}>
                    Số dư sau khi thanh toán:
                  </Text>
                  <Text
                    style={[
                      styles.financialInfoValue,
                      {fontWeight: 'bold', color: '#007AFF'},
                    ]}>
                    {formatCurrency(balance - depositAmount)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.confirmModalText}>
              {isDepositSuccessful
                ? 'Bạn có chắc chắn muốn hủy dịch vụ này không? 30% tiền cọc sẽ được hoàn trả vào ví của bạn. Hành động này không thể hoàn tác.'
                : isDesignPhase
                ? 'Bạn có chắc chắn muốn hủy dịch vụ này không? Bạn cần thanh toán 50% phí thiết kế còn lại để hủy đơn hàng. Hành động này không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn hủy dịch vụ này không? Hành động này không thể hoàn tác.'}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  styles.confirmModalButtonCancel,
                ]}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelLoading}>
                <Text style={styles.confirmModalButtonCancelText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  {backgroundColor: '#FF3B30', flex: 1, marginLeft: 7},
                ]}
                onPress={
                  isDepositSuccessful
                    ? handleCancelWithRefund
                    : isDesignPhase
                    ? handleCancelWithPayment
                    : handleCancelService
                }
                disabled={cancelLoading}>
                {cancelLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>
                    {isDesignPhase ? 'Thanh toán & Hủy' : 'Đồng ý hủy'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Calculate earliest delivery date (2 days after payment)
  let earliestDeliveryDate = null;
  if (order?.paymentDate) {
    const paymentDate = new Date(order.paymentDate);
    paymentDate.setDate(paymentDate.getDate() + 2);
    earliestDeliveryDate = paymentDate;
  } else if (order?.creationDate) {
    const paymentDate = new Date(order.creationDate);
    paymentDate.setDate(paymentDate.getDate() + 2);
    earliestDeliveryDate = paymentDate;
  }

  // Helper for formatting date
  const formatDateShort = date => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN');
  };

  // Helper for formatting time
  const formatTime = date => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Add this function at the beginning of the component
  const decodeHtmlEntities = (text) => {
    if (!text) return '';
    // First decode HTML entities
    const decodedText = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&aacute;/g, 'á')
      .replace(/&agrave;/g, 'à')
      .replace(/&atilde;/g, 'ã')
      .replace(/&acirc;/g, 'â')
      .replace(/&eacute;/g, 'é')
      .replace(/&egrave;/g, 'è')
      .replace(/&ecirc;/g, 'ê')
      .replace(/&iacute;/g, 'í')
      .replace(/&igrave;/g, 'ì')
      .replace(/&oacute;/g, 'ó')
      .replace(/&ograve;/g, 'ò')
      .replace(/&otilde;/g, 'õ')
      .replace(/&ocirc;/g, 'ô')
      .replace(/&uacute;/g, 'ú')
      .replace(/&ugrave;/g, 'ù')
      .replace(/&ucirc;/g, 'û')
      .replace(/&yacute;/g, 'ý')
      .replace(/&ygrave;/g, 'ỳ')
      .replace(/&ycirc;/g, 'ŷ')
      .replace(/&yuml;/g, 'ÿ')
      .replace(/&Aacute;/g, 'Á')
      .replace(/&Agrave;/g, 'À')
      .replace(/&Atilde;/g, 'Ã')
      .replace(/&Acirc;/g, 'Â')
      .replace(/&Eacute;/g, 'É')
      .replace(/&Egrave;/g, 'È')
      .replace(/&Ecirc;/g, 'Ê')
      .replace(/&Iacute;/g, 'Í')
      .replace(/&Igrave;/g, 'Ì')
      .replace(/&Oacute;/g, 'Ó')
      .replace(/&Ograve;/g, 'Ò')
      .replace(/&Otilde;/g, 'Õ')
      .replace(/&Ocirc;/g, 'Ô')
      .replace(/&Uacute;/g, 'Ú')
      .replace(/&Ugrave;/g, 'Ù')
      .replace(/&Ucirc;/g, 'Û')
      .replace(/&Yacute;/g, 'Ý')
      .replace(/&Ygrave;/g, 'Ỳ')
      .replace(/&Ycirc;/g, 'Ŷ')
      .replace(/&Yuml;/g, 'Ÿ');
    
    // Then remove HTML tags
    return decodedText.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon
          name="alert-circle-outline"
          size={60}
          color="#ff3b30"
          style={{marginBottom: 15}}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
          tintColor={'#007AFF'}
        />
      }>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.orderNumber}>
          Đơn hàng #{order.id.substring(0, 8)}
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <View
          style={[
            styles.statusPill,
            {backgroundColor: getStatusColor(order.status)},
          ]}>
          <Text style={styles.statusPillText}>
            {getStatusText(order.status)}
          </Text>
        </View>
        <Text style={styles.statusDate}>{formatDate(order.creationDate)}</Text>
      </View>

      {/* Payment Section - Only show when status is DoneDesign (6) */}
      {order.status?.toLowerCase() === 'donedesign' && (
        <Card style={styles.section}>
          <Card.Title
            title="Thanh toán phần còn lại"
            titleStyle={styles.sectionTitle}
            left={props => (
              <Icon {...props} name="cash-multiple" size={24} color="#007AFF" />
            )}
          />
          <Divider style={styles.divider} />
          <Card.Content>
            <View style={styles.paymentSection}>
              <Text style={styles.paymentDescription}>
                Thiết kế của bạn đã hoàn thành. Vui lòng thanh toán 50% phí
                thiết kế còn lại và tiền vật liệu để hoàn thành đơn hàng.
              </Text>

              <View style={styles.paymentSummary}>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>
                    Phí thiết kế còn lại:
                  </Text>
                  <Text style={styles.paymentSummaryValue}>
                    {formatCurrency(order.designPrice * 0.5)}
                  </Text>
                </View>

                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Giá vật liệu:</Text>
                  <Text style={styles.paymentSummaryValue}>
                    {formatCurrency(order.materialPrice || 0)}
                  </Text>
                </View>

                <View
                  style={[styles.paymentSummaryRow, styles.totalSummaryRow]}>
                  <Text style={styles.totalSummaryLabel}>Tổng cộng:</Text>
                  <Text style={styles.totalSummaryValue}>
                    {formatCurrency(
                      order.designPrice * 0.5 + (order.materialPrice || 0),
                    )}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.payNowButton}
                onPress={handlePaymentPress}>
                <Icon
                  name="cash-register"
                  size={20}
                  color="#fff"
                  style={styles.payNowIcon}
                />
                <Text style={styles.payNowText}>Thanh toán ngay</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      )}

            {/* Installation Actions Section */}
            {order.status?.toLowerCase() === 'doneinstalling' && (
        <View style={[styles.section, {marginBottom: 16}]}>
          <View style={{padding: 16}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Icon
                name="wrench"
                size={22}
                color="#4CAF50"
                style={{marginRight: 8}}
              />
              <Text style={{fontSize: 18, fontWeight: '600', color: '#222'}}>
                Thao tác lắp đặt
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#F0F8FF',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#CCE5FF',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}>
                <Icon
                  name="information"
                  size={22}
                  color="#2196F3"
                  style={{marginRight: 10, marginTop: 2}}
                />
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: 4,
                    }}>
                    Thông báo
                  </Text>
                  <Text style={{fontSize: 15, color: '#444', lineHeight: 22}}>
                    Cửa hàng đã hoàn thành lắp đặt sản phẩm. Vui lòng xác nhận
                    nếu bạn hài lòng với kết quả lắp đặt hoặc yêu cầu lắp đặt
                    lại nếu có vấn đề.
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              {/* <TouchableOpacity
                style={{
                  backgroundColor: '#F44336',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48%',
                }}
                onPress={() => {
                  // Request reinstallation logic will go here
                }}>
                <Icon
                  name="refresh"
                  size={18}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  Yêu cầu lắp đặt lại
                </Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48%',
                }}
                onPress={() => setInstallConfirmModalVisible(true)}>
                <Icon
                  name="check-circle"
                  size={18}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  Xác nhận hoàn thành
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Schedule Delivery Section */}
      {['paymentsuccess', 'installing', 'doneinstalling', 'successfully'].includes(order.status?.toLowerCase()) && (
        <View style={[styles.section]}>
          {/* If construction date and time are already set AND not in edit mode, show the confirmed schedule */}
          {order.contructionDate &&
          order.contructionTime &&
          !isEditingDelivery ? (
            <View style={{padding: 16}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon
                    name="calendar-check"
                    size={22}
                    color="#4CAF50"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={{fontSize: 16, fontWeight: '600', color: '#222'}}>
                    Lịch giao hàng đã đặt
                  </Text>
                </View>

                {order.status?.toLowerCase() === 'paymentsuccess' && (
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    onPress={() => {
                      // Pre-fill the current values
                      const dateObj = order.contructionDate
                        ? new Date(order.contructionDate)
                        : null;
                      setDeliveryDate(dateObj);

                      const timeStr = order.contructionTime
                        ? order.contructionTime.length > 5
                          ? order.contructionTime.substring(0, 5)
                          : order.contructionTime
                        : null;
                      setDeliveryTime(timeStr);

                      // Show edit mode
                      setIsEditingDelivery(true);
                    }}>
                    <Icon
                      name="pencil"
                      size={16}
                      color="#2196F3"
                      style={{marginRight: 4}}
                    />
                    <Text
                      style={{color: '#2196F3', fontWeight: '500', fontSize: 14}}>
                      Điều chỉnh lịch
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  backgroundColor: '#E8F5E9',
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#C8E6C9',
                  marginBottom: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}>
                  <Icon
                    name="check-circle"
                    size={22}
                    color="#4CAF50"
                    style={{marginRight: 10, marginTop: 2}}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#2E7D32',
                      flex: 1,
                    }}>
                    Lịch giao hàng đã được xác nhận
                  </Text>
                </View>

                <View style={{marginLeft: 32, marginBottom: 4}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                    <Icon
                      name="calendar"
                      size={18}
                      color="#555"
                      style={{marginRight: 8, width: 24}}
                    />
                    <Text style={{fontSize: 15, color: '#333'}}>
                      Ngày giao hàng:{' '}
                    </Text>
                    <Text
                      style={{fontSize: 15, fontWeight: '600', color: '#333'}}>
                      {formatDateForDisplay(order.contructionDate)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                    <Icon
                      name="clock-outline"
                      size={18}
                      color="#555"
                      style={{marginRight: 8, width: 24}}
                    />
                    <Text style={{fontSize: 15, color: '#333'}}>
                      Thời gian:{' '}
                    </Text>
                    <Text
                      style={{fontSize: 15, fontWeight: '600', color: '#333'}}>
                      {formatTimeForDisplay(order.contructionTime)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: '#555',
                    marginLeft: 32,
                    fontSize: 14,
                    fontStyle: 'italic',
                  }}>
                  Xin vui lòng đảm bảo có mặt tại địa chỉ đã đăng ký để nhận
                  hàng theo lịch trên.
                </Text>
              </View>

              {order.status?.toLowerCase() === 'paymentsuccess' && (
                <Text
                  style={{
                    color: '#666',
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 4,
                  }}>
                  Bạn vẫn có thể điều chỉnh lịch giao hàng bằng cách nhấn vào nút
                  "Điều chỉnh lịch"
                </Text>
              )}
            </View>
          ) : (
            <View style={{padding: 16}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon
                    name="calendar-check"
                    size={22}
                    color="#34C759"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={{fontSize: 18, fontWeight: '600', color: '#222'}}>
                    {isEditingDelivery
                      ? 'Điều chỉnh lịch giao hàng'
                      : 'Đặt lịch giao hàng'}
                  </Text>
                </View>

                {isEditingDelivery && (
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    onPress={() => {
                      setIsEditingDelivery(false);
                      setDeliveryDate(null);
                      setDeliveryTime(null);
                    }}>
                    <Icon
                      name="close"
                      size={16}
                      color="#FF3B30"
                      style={{marginRight: 4}}
                    />
                    <Text
                      style={{
                        color: '#FF3B30',
                        fontWeight: '500',
                        fontSize: 14,
                      }}>
                      Hủy
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={{color: '#333', marginBottom: 10}}>
                {isEditingDelivery
                  ? 'Bạn có thể điều chỉnh ngày và thời gian giao hàng. Lưu ý rằng thời gian giao hàng mới phải đáp ứng yêu cầu về thời gian tối thiểu.'
                  : 'Thanh toán của bạn đã hoàn tất. Vui lòng chọn ngày và thời gian thích hợp để chúng tôi giao hàng đến địa chỉ của bạn.'}
              </Text>
              <View
                style={{
                  backgroundColor: '#EAF6FF',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#B6E0FE',
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon
                    name="information"
                    size={18}
                    color="#2196F3"
                    style={{marginRight: 8}}
                  />
                  <Text style={{color: '#2196F3', fontWeight: '500'}}>
                    Lưu ý về thời gian giao hàng
                  </Text>
                </View>
                <Text style={{color: '#333', marginTop: 4}}>
                  Để chuẩn bị sản phẩm và sắp xếp đội thi công, thời gian giao
                  hàng sớm nhất là từ ngày{' '}
                  <Text style={{fontWeight: 'bold'}}>
                    {earliestDeliveryDate
                      ? formatDateShort(earliestDeliveryDate)
                      : ''}
                  </Text>{' '}
                  (sau 2 ngày kể từ ngày thanh toán).
                </Text>
              </View>
              {/* Date Picker */}
              <View style={{marginBottom: 16}}>
                <Text
                  style={{fontWeight: '500', color: '#222', marginBottom: 4}}>
                  Chọn ngày giao hàng:
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 6,
                    padding: 10,
                    backgroundColor: '#fff',
                  }}
                  onPress={() => setShowDatePicker(true)}>
                  <Text
                    style={{flex: 1, color: deliveryDate ? '#222' : '#888'}}>
                    {deliveryDate
                      ? formatDateShort(deliveryDate)
                      : earliestDeliveryDate
                      ? formatDateShort(earliestDeliveryDate)
                      : 'Chọn ngày'}
                  </Text>
                  <Icon name="calendar" size={20} color="#888" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={deliveryDate || earliestDeliveryDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={earliestDeliveryDate || new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDeliveryDate(selectedDate);
                    }}
                  />
                )}
              </View>
              {/* Time Picker */}
              <View style={{marginBottom: 16}}>
                <Text
                  style={{fontWeight: '500', color: '#222', marginBottom: 4}}>
                  Chọn thời gian giao hàng:
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 6,
                    padding: 10,
                    backgroundColor: '#fff',
                  }}
                  onPress={() => setShowTimePicker(true)} // Show the time picker
                >
                  <Text
                    style={{flex: 1, color: deliveryTime ? '#222' : '#888'}}>
                    {deliveryTime ? formatTimeForDisplay(deliveryTime) : 'Chọn giờ'} {/* Display formatted time */}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#888" />
                </TouchableOpacity>

                {/* DateTimePicker for Time */}
                {showTimePicker && (
                  <DateTimePicker
                    value={deliveryTime ? new Date(`2000-01-01T${deliveryTime}:00`) : new Date()} // Use current time or a default date with selected time
                    mode="time"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowTimePicker(false);
                      if (event.type === 'set') { // User confirmed selection
                        const selectedHour = selectedDate.getHours();
                        const selectedMinute = selectedDate.getMinutes();
                        // Check if time is between 8 AM and 6 PM (18:00)
                        if (selectedHour >= 8 && (selectedHour < 18 || (selectedHour === 18 && selectedMinute === 0))) {
                          // Format time to HH:mm string
                          const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
                          setDeliveryTime(formattedTime);
                        } else {
                          Alert.alert(
                            'Thời gian không hợp lệ',
                            'Vui lòng chọn thời gian từ 8:00 đến 18:00.'
                          );
                        }
                      }
                    }}
                  />
                )}

              </View>
              {/* Confirm Button */}
              <TouchableOpacity
                style={{
                  backgroundColor:
                    deliveryDate && deliveryTime ? '#34C759' : '#E5E7EB',
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  // Add subtle shadow
                  elevation: 1,
                  shadowColor: 'rgba(0,0,0,0.1)',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
                disabled={!(deliveryDate && deliveryTime) || schedulingLoading}
                onPress={async () => {
                  if (!deliveryDate || !deliveryTime) return;

                  try {
                    setSchedulingLoading(true);

                    // Format the date for API
                    const formattedDate = deliveryDate
                      .toISOString()
                      .split('T')[0]; // YYYY-MM-DD format

                    // Format time to HH:mm:ss format
                    const formattedTime = deliveryTime.includes(':')
                      ? deliveryTime.split(':').length === 3
                        ? deliveryTime // Already in HH:mm:ss format
                        : `${deliveryTime}:00` // Add seconds to HH:mm format
                      : `${deliveryTime}:00:00`; // Add full time if just hours

                    // Create request payload
                    const payload = {
                      contructionDate: formattedDate,
                      contructionTime: formattedTime,
                      contructionPrice: 0,
                    };

                    // Make API call
                    await api.put(`/serviceorder/contructor/${order.id}`, payload);

                    // Clear edit mode if we were in it
                    if (isEditingDelivery) {
                      setIsEditingDelivery(false);
                    }

                    // Show success message
                    Alert.alert(
                      'Thành công',
                      'Lịch giao hàng đã được xác nhận. Chúng tôi sẽ giao hàng đến địa chỉ của bạn theo thời gian đã chọn.',
                      [
                        {
                          text: 'OK',
                          onPress: () => fetchOrderDetails(), // Refresh data
                        },
                      ],
                    );
                  } catch (error) {
                    console.error('Error scheduling delivery:', error);
                    Alert.alert(
                      'Lỗi',
                      'Không thể xác nhận lịch giao hàng. Vui lòng thử lại sau.',
                      [{text: 'OK'}],
                    );
                  } finally {
                    setSchedulingLoading(false);
                  }
                }}>
                {schedulingLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon
                      name="calendar-check"
                      size={18}
                      color={deliveryDate && deliveryTime ? '#fff' : '#888'}
                      style={{marginRight: 6}}
                    />
                    <Text
                      style={{
                        color: deliveryDate && deliveryTime ? '#fff' : '#888',
                        fontWeight: '600',
                        fontSize: 16,
                        marginLeft: 4,
                      }}>
                      {isEditingDelivery
                        ? 'Cập nhật lịch giao hàng'
                        : 'Xác nhận lịch giao hàng'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}


      {/* Contract Section - only show for appropriate status values */}
      {shouldDisplayContract(order.status) && (
        <Card style={styles.section}>
          <Card.Title
            title="Hợp đồng thiết kế"
            titleStyle={styles.sectionTitle}
            left={props => (
              <Icon
                {...props}
                name="file-document-outline"
                size={24}
                color="#007AFF"
              />
            )}
          />
          <Divider style={styles.divider} />
          <Card.Content>
            {contractLoading ? (
              <View style={styles.contractLoading}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.contractLoadingText}>
                  Đang tải hợp đồng...
                </Text>
              </View>
            ) : contractError ? (
              <View style={styles.contractError}>
                <Icon
                  name="alert-circle-outline"
                  size={24}
                  color="#FF3B30"
                  style={{marginBottom: 8}}
                />
                <Text style={styles.contractErrorText}>{contractError}</Text>
              </View>
            ) : contract ? (
              <>
                {/* View Contract Section */}
                {contract.modificationDate !== null ? (
                  <View style={styles.contractSignedContainer}>
                    <Icon
                      name="check-circle"
                      size={24}
                      color="#34C759"
                      style={styles.contractSignedIcon}
                    />
                    <Text style={styles.contractSignedText}>
                      Đã ký hợp đồng
                    </Text>

                    <TouchableOpacity
                      style={[styles.viewContractButton, {marginTop: 12}]}
                      onPress={handleViewContract}>
                      <Icon
                        name="file-pdf-box"
                        size={20}
                        color="#fff"
                        style={styles.viewContractIcon}
                      />
                      <Text style={styles.viewContractText}>Xem hợp đồng</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.contractInfo}>
                    <View style={styles.infoRow}>
                      <Icon
                        name="file-document-outline"
                        size={20}
                        color="#666"
                        style={styles.infoIcon}
                      />
                      <Text style={styles.infoText}>1: Hợp đồng thiết kế</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewContractButton}
                      onPress={handleViewContract}>
                      <Icon
                        name="file-pdf-box"
                        size={20}
                        color="#fff"
                        style={styles.viewContractIcon}
                      />
                      <Text style={styles.viewContractText}>Xem hợp đồng</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Signature Section - Only show for waitDeposit status */}
                {order.status?.toLowerCase() === 'waitdeposit' &&
                  !contract.signatureUrl && (
                    <View style={styles.signatureSection}>
                      <View style={styles.infoRow}>
                        <Icon
                          name="draw"
                          size={20}
                          color="#666"
                          style={styles.infoIcon}
                        />
                        <Text style={styles.infoText}>
                          2: Tải lên chữ ký của bạn
                        </Text>
                      </View>

                      {/* Guidance Dropdown */}
                      <TouchableOpacity
                        style={styles.guidanceHeader}
                        onPress={() => setShowGuidance(!showGuidance)}>
                        <Icon
                          name={showGuidance ? 'chevron-down' : 'chevron-right'}
                          size={20}
                          color="#007AFF"
                          style={styles.guidanceIcon}
                        />
                        <Text style={styles.guidanceHeaderText}>
                          <Icon
                            name="information-outline"
                            size={16}
                            color="#007AFF"
                          />{' '}
                          Hướng dẫn tạo và tải lên chữ ký
                        </Text>
                      </TouchableOpacity>

                      {showGuidance && (
                        <View style={styles.guidanceContent}>
                          {/* Prepare signature image */}
                          <View style={styles.guidanceSection}>
                            <Text style={styles.guidanceSectionTitle}>
                              <Icon name="diamond" size={16} color="#007AFF" />{' '}
                              Chuẩn bị hình ảnh chữ ký
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Ký trên giấy và chụp ảnh:
                              </Text>{' '}
                              Dùng giấy trắng và bút mực đen. Chụp rõ nét, đủ
                              sáng.
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Quét (scan):
                              </Text>{' '}
                              Dùng máy scan chuyển chữ ký sang file ảnh.
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Ứng dụng vẽ:
                              </Text>{' '}
                              Vẽ chữ ký trên điện thoại/máy tính bảng rồi xuất
                              ra ảnh PNG/JPG.
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Bảng vẽ điện tử:
                              </Text>{' '}
                              Tạo chữ ký số trực tiếp bằng bút vẽ.
                            </Text>
                          </View>

                          {/* Signature image requirements */}
                          <View style={styles.guidanceSection}>
                            <Text style={styles.guidanceSectionTitle}>
                              <Icon name="diamond" size={16} color="#007AFF" />{' '}
                              Yêu cầu về hình ảnh chữ ký
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Định dạng:
                              </Text>
                              <View style={styles.formatTag}>
                                <Text style={styles.formatTagText}>JPG</Text>
                              </View>
                              ,
                              <View style={styles.formatTag}>
                                <Text style={styles.formatTagText}>PNG</Text>
                              </View>
                              ,
                              <View style={styles.formatTag}>
                                <Text style={styles.formatTagText}>JPEG</Text>
                              </View>
                              ,
                              <View style={styles.formatTag}>
                                <Text style={styles.formatTagText}>GIF</Text>
                              </View>
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Kích thước file tối đa:
                              </Text>{' '}
                              5MB
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>
                                Độ phân giải khuyến nghị:
                              </Text>{' '}
                              300 DPI+
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>Nền:</Text>{' '}
                              trắng hoặc trong suốt (ưu tiên)
                            </Text>
                            <Text style={styles.guidanceText}>
                              <Text style={styles.guidanceBold}>Màu sắc:</Text>{' '}
                              đen hoặc xanh đậm
                            </Text>
                          </View>

                          {/* Steps to upload signature */}
                          <View style={styles.guidanceSection}>
                            <Text style={styles.guidanceSectionTitle}>
                              <Icon name="diamond" size={16} color="#007AFF" />{' '}
                              Các bước tải lên chữ ký
                            </Text>
                            <Text style={styles.guidanceText}>
                              1. Đọc kỹ hợp đồng bên trên.
                            </Text>
                            <Text style={styles.guidanceText}>
                              2. Nhấn nút{' '}
                              <View style={styles.buttonTag}>
                                <Text style={styles.buttonTagText}>
                                  Tải lên chữ ký (ảnh)
                                </Text>
                              </View>
                              .
                            </Text>
                            <Text style={styles.guidanceText}>
                              3. Chọn file hình ảnh từ thiết bị.
                            </Text>
                            <Text style={styles.guidanceText}>
                              4. Xem trước chữ ký, nhấn X để đổi nếu cần.
                            </Text>
                            <Text style={styles.guidanceText}>
                              5. Nhấn{' '}
                              <View style={styles.buttonTag}>
                                <Text style={styles.buttonTagText}>
                                  Xác nhận & Thanh toán cọc
                                </Text>
                              </View>{' '}
                              để hoàn tất.
                            </Text>
                          </View>

                          {/* Troubleshooting */}
                          <View style={styles.guidanceSection}>
                            <Text style={styles.guidanceSectionTitle}>
                              <Icon name="diamond" size={16} color="#007AFF" />{' '}
                              Gặp sự cố?
                            </Text>
                            <Text style={styles.guidanceText}>
                              • Kiểm tra định dạng và kích thước ảnh.
                            </Text>
                            <Text style={styles.guidanceText}>
                              • Thử trình duyệt khác hoặc tải lại trang.
                            </Text>
                            <Text style={styles.guidanceText}>
                              • Kiểm tra kết nối internet.
                            </Text>
                            <Text style={styles.guidanceText}>
                              • Thử lại với hình ảnh khác nếu ảnh bị mờ.
                            </Text>
                          </View>

                          {/* Support Contact */}
                          <View style={styles.guidanceSection}>
                            <Text style={styles.guidanceSectionTitle}>
                              <Icon
                                name="headphones"
                                size={16}
                                color="#007AFF"
                              />{' '}
                              Hỗ trợ
                            </Text>
                            <Text style={styles.guidanceText}>
                              Nếu bạn cần thêm hỗ trợ về việc tải lên chữ ký,
                              vui lòng liên hệ với đội ngũ hỗ trợ khách hàng của
                              chúng tôi qua:
                            </Text>
                            <View style={styles.supportInfoContainer}>
                              <View style={styles.supportInfoRow}>
                                <Text style={styles.supportLabel}>Email:</Text>
                                <Text style={styles.supportValue}>
                                  support@greenspace.vn
                                </Text>
                              </View>
                              <View style={styles.supportInfoRow}>
                                <Text style={styles.supportLabel}>
                                  Hotline:
                                </Text>
                                <Text style={styles.supportValue}>
                                  1900-xxxx-xxx{' '}
                                  <Text style={styles.supportHours}>
                                    (8:00 - 18:00, Thứ Hai - Thứ Bảy)
                                  </Text>
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Signature display area */}
                      {signatureImage ? (
                        <View style={styles.signaturePreviewContainer}>
                          <TouchableOpacity
                            onPress={() =>
                              handleSignaturePreview(signatureImage)
                            }>
                            <Image
                              source={{uri: signatureImage}}
                              style={styles.signaturePreview}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeSignatureButton}
                            onPress={() => setSignatureImage(null)}>
                            <Icon
                              name="close-circle"
                              size={22}
                              color="#FF3B30"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.uploadSignatureContainer}>
                          <TouchableOpacity
                            style={styles.uploadSignatureButton}
                            onPress={() => setShowSignatureOptions(true)}>
                            <Icon
                              name="upload"
                              size={24}
                              color="#007AFF"
                              style={styles.uploadIcon}
                            />
                            <Text style={styles.uploadText}>
                              Tải lên chữ ký
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Step 3: Confirm and Sign Contract */}
                      <View style={styles.contractInfo}>
                        <View style={styles.infoRow}>
                          <Icon
                            name="check"
                            size={20}
                            color="#666"
                            style={styles.infoIcon}
                          />
                          <Text style={styles.infoText}>
                            3: Xác nhận và ký hợp đồng
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.viewContractButton,
                            !signatureImage && styles.disabledButton,
                          ]}
                          onPress={handleSignContract}
                          disabled={!signatureImage}>
                          <Icon
                            name="check"
                            size={20}
                            color="#fff"
                            style={styles.viewContractIcon}
                          />
                          <Text style={styles.viewContractText}>
                            Ký hợp đồng
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Signature upload options dropdown */}
                      {showSignatureOptions && (
                        <View style={styles.signatureOptionsDropdown}>
                          <TouchableOpacity
                            style={styles.signatureOption}
                            onPress={captureSignatureFromCamera}>
                            <Icon
                              name="camera"
                              size={20}
                              color="#007AFF"
                              style={styles.optionIcon}
                            />
                            <Text style={styles.optionText}>Chụp ảnh</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.signatureOption}
                            onPress={chooseSignatureFromGallery}>
                            <Icon
                              name="image"
                              size={20}
                              color="#007AFF"
                              style={styles.optionIcon}
                            />
                            <Text style={styles.optionText}>
                              Chọn từ thư viện
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.signatureOption}
                            onPress={openSignatureDrawing}>
                            <Icon
                              name="pencil"
                              size={20}
                              color="#007AFF"
                              style={styles.optionIcon}
                            />
                            <Text style={styles.optionText}>Vẽ chữ ký</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.signatureOption,
                              styles.signatureOptionCancel,
                            ]}
                            onPress={() => setShowSignatureOptions(false)}>
                            <Text style={styles.cancelOptionText}>Hủy</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
              </>
            ) : (
              <Text style={styles.noContractText}>Chưa có hợp đồng</Text>
            )}
          </Card.Content>
        </Card>
      )}

      

      {/* Part 2: Design Information */}
      <Card style={styles.section}>
        <Card.Title
          title="Thông tin thiết kế"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="ruler-square-compass"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon name="ruler" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Kích thước không gian: {order.length}m x {order.width}m
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon
              name="format-list-bulleted-type"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Loại dịch vụ:{' '}
              {order.serviceType === 'NoDesignIdea'
                ? 'Dịch vụ tư vấn và thiết kế'
                : getServiceTypeText(order.serviceType)}
            </Text>
          </View>

          {/* Highlighted Price Section */}
          <View style={styles.pricingContainer}>
            <View style={styles.pricingRow}>
              <Icon
                name="currency-usd"
                size={22}
                color="#007AFF"
                style={styles.pricingIcon}
              />
              <Text style={styles.pricingLabel}>
                Chi phí thiết kế chi tiết:
              </Text>
              <Text style={styles.pricingValue}>
                {order.status !== 'DeterminingDesignPrice' ?
                formatCurrency(order.designPrice)
                :
                formatCurrency(0)
              }
              </Text>
            </View>

            <View style={styles.pricingRow}>
              <Icon
                name="package-variant"
                size={22}
                color="#007AFF"
                style={styles.pricingIcon}
              />
              <Text style={styles.pricingLabel}>Chi phí vật liệu:</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(order.materialPrice || 0)}
              </Text>
            </View>

            <View style={styles.totalPricingRow}>
              <Icon
                name="cash-multiple"
                size={24}
                color="#34C759"
                style={styles.pricingIcon}
              />
              <Text style={styles.totalPricingLabel}>Tổng chi phí:</Text>
              <Text style={styles.totalPricingValue}>
                {order.status !== 'DeterminingDesignPrice' ?
                  formatCurrency(
                    (order.designPrice || 0) + (order.materialPrice || 0),
                  )
                  : formatCurrency(0)
                }
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Information Section */}
      <Card style={styles.section}>
        <Card.Title
          title="Thông tin thanh toán"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="cash-multiple"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <View style={styles.pricingContainer}>
            {/* Deposit Paid Section */}
            {!statusDontShowdepositField.map(s => s.toLowerCase()).includes(order.status?.toLowerCase()) && (
              <View style={styles.pricingRow}>
                <Icon
                  name="currency-usd"
                  size={22}
                  color="#007AFF"
                  style={styles.pricingIcon}
                />
                <Text style={styles.pricingLabel}>Đã đặt cọc (50%):</Text>
                <Text style={[styles.pricingValue]} >
                  {formatCurrency((order.designPrice || 0) * 0.5)}
                </Text>
              </View>
            )}

            {/* Payment Status Section */}
            {statusShowTotalPayment.map(s => s.toLowerCase()).includes(order.status?.toLowerCase()) && (
              <View style={styles.pricingRow}>
                <Icon
                  name="check-circle"
                  size={22}
                  color="#34C759"
                  style={styles.pricingIcon}
                />
                <Text style={styles.pricingLabel}>Đã thanh toán:</Text>
                <Text style={[styles.pricingValue, { color: '#34C759' }]}>
                  {formatCurrency((order.designPrice || 0) + (order.materialPrice || 0))}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Part 3: Description */}
      <Card style={styles.section}>
        <Card.Title
          title="Mô tả của bạn"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="text-box-outline"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <Text style={styles.description}>{order.description}</Text>
        </Card.Content>
      </Card>

      {/* Customer Provided Images */}
      <Card style={styles.section}>
        <Card.Title
          title="Hình ảnh khách hàng cung cấp"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="image-multiple-outline"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageContainer}>
            {recordSketches.length > 0 ? (
              // Get customer images from phase 0
              recordSketches
                .filter(sketch => sketch.phase === 0)
                .map((sketch, index) => (
                  <React.Fragment key={`phase0-${index}`}>
                    {sketch.image?.imageUrl && (
                      <TouchableOpacity
                        onPress={() => handleImagePress(sketch.image.imageUrl)}>
                        <Image
                          source={{uri: sketch.image.imageUrl}}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                    {sketch.image?.image2 && sketch.image.image2 !== '' && (
                      <TouchableOpacity
                        onPress={() => handleImagePress(sketch.image.image2)}>
                        <Image
                          source={{uri: sketch.image.image2}}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                    {sketch.image?.image3 && sketch.image.image3 !== '' && (
                      <TouchableOpacity
                        onPress={() => handleImagePress(sketch.image.image3)}>
                        <Image
                          source={{uri: sketch.image.image3}}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                  </React.Fragment>
                ))
            ) : (
              // Use order.image if no recordSketches
              <>
                {order.image?.imageUrl && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(order.image.imageUrl)}>
                    <Image
                      source={{uri: order.image.imageUrl}}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                {order.image?.image2 && order.image.image2 !== '' && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(order.image.image2)}>
                    <Image
                      source={{uri: order.image.image2}}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                {order.image?.image3 && order.image.image3 !== '' && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(order.image.image3)}>
                    <Image
                      source={{uri: order.image.image3}}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </Card.Content>
      </Card>

      



      {/* First Sketch Images */}
      {recordSketches.some(sketch => sketch.phase === 1) &&
        showSketchPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Phác thảo lần 1"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon
                  {...props}
                  name="pencil-outline"
                  size={24}
                  color="#007AFF"
                />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordSketches
                  .filter(sketch => sketch.phase === 1)
                  .map((sketch, index) => (
                    <View key={`phase1-${index}`} style={styles.imageWrapper}>
                      {sketch.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {sketch.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(sketch.image.imageUrl)
                          }>
                          <Image
                            source={{uri: sketch.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image2 && sketch.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image2)}>
                          <Image
                            source={{uri: sketch.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image3 && sketch.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image3)}>
                          <Image
                            source={{uri: sketch.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingDesignPrice status */}
              {order.status?.toLowerCase() === 'donedeterminingdesignprice' && (
                <>
                  {recordSketches.filter(sketch => sketch.phase === 1).length >
                    0 &&
                    !recordSketches.some(sketch => sketch.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmSketch(
                            recordSketches.find(sketch => sketch.phase === 1)
                              .id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản phác thảo
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhase === 1 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedraftPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu phác thảo lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Second Sketch Images */}
      {recordSketches.some(sketch => sketch.phase === 2) &&
        showSketchPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Phác thảo lần 2"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon
                  {...props}
                  name="pencil-outline"
                  size={24}
                  color="#007AFF"
                />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordSketches
                  .filter(sketch => sketch.phase === 2)
                  .map((sketch, index) => (
                    <View key={`phase2-${index}`} style={styles.imageWrapper}>
                      {sketch.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {sketch.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(sketch.image.imageUrl)
                          }>
                          <Image
                            source={{uri: sketch.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image2 && sketch.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image2)}>
                          <Image
                            source={{uri: sketch.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image3 && sketch.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image3)}>
                          <Image
                            source={{uri: sketch.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingDesignPrice status */}
              {order.status?.toLowerCase() === 'donedeterminingdesignprice' && (
                <>
                  {recordSketches.filter(sketch => sketch.phase === 2).length >
                    0 &&
                    !recordSketches.some(sketch => sketch.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmSketch(
                            recordSketches.find(sketch => sketch.phase === 2)
                              .id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản phác thảo
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhase === 2 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedraftPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu phác thảo lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Third Sketch Images */}
      {recordSketches.some(sketch => sketch.phase === 3) &&
        showSketchPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Phác thảo lần 3"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon
                  {...props}
                  name="pencil-outline"
                  size={24}
                  color="#007AFF"
                />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordSketches
                  .filter(sketch => sketch.phase === 3)
                  .map((sketch, index) => (
                    <View key={`phase3-${index}`} style={styles.imageWrapper}>
                      {sketch.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {sketch.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(sketch.image.imageUrl)
                          }>
                          <Image
                            source={{uri: sketch.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image2 && sketch.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image2)}>
                          <Image
                            source={{uri: sketch.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {sketch.image?.image3 && sketch.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(sketch.image.image3)}>
                          <Image
                            source={{uri: sketch.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingDesignPrice status */}
              {order.status?.toLowerCase() === 'donedeterminingdesignprice' && (
                <>
                  {recordSketches.filter(sketch => sketch.phase === 3).length >
                    0 &&
                    !recordSketches.some(sketch => sketch.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmSketch(
                            recordSketches.find(sketch => sketch.phase === 3)
                              .id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản phác thảo
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhase === 3 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedraftPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu phác thảo lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Detail Drawing Images - Phase 1 */}
      {recordDesigns.some(design => design.phase === 1) &&
        showDesignPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Bản vẽ chi tiết lần 1"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon {...props} name="file-cad" size={24} color="#007AFF" />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordDesigns
                  .filter(design => design.phase === 1)
                  .map((design, index) => (
                    <View
                      key={`design-phase1-${index}`}
                      style={styles.imageWrapper}>
                      {design.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {design.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(design.image.imageUrl)
                          }>
                          <Image
                            source={{uri: design.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image2 && design.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image2)}>
                          <Image
                            source={{uri: design.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image3 && design.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image3)}>
                          <Image
                            source={{uri: design.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingMaterialPrice status */}
              {order.status?.toLowerCase() ===
                'donedeterminingmaterialprice' && (
                <>
                  {recordDesigns.filter(design => design.phase === 1).length >
                    0 &&
                    !recordDesigns.some(design => design.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmDesign(
                            recordDesigns.find(design => design.phase === 1).id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản vẽ chi tiết
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhaseDesign < 2 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedesignPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu thiết kế lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Detail Drawing Images - Phase 2 */}
      {recordDesigns.some(design => design.phase === 2) &&
        showDesignPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Bản vẽ chi tiết lần 2"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon {...props} name="file-cad" size={24} color="#007AFF" />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordDesigns
                  .filter(design => design.phase === 2)
                  .map((design, index) => (
                    <View
                      key={`design-phase2-${index}`}
                      style={styles.imageWrapper}>
                      {design.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {design.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(design.image.imageUrl)
                          }>
                          <Image
                            source={{uri: design.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image2 && design.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image2)}>
                          <Image
                            source={{uri: design.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image3 && design.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image3)}>
                          <Image
                            source={{uri: design.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingMaterialPrice status */}
              {order.status?.toLowerCase() ===
                'donedeterminingmaterialprice' && (
                <>
                  {recordDesigns.filter(design => design.phase === 2).length >
                    0 &&
                    !recordDesigns.some(design => design.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmDesign(
                            recordDesigns.find(design => design.phase === 2).id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản vẽ chi tiết
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhaseDesign < 3 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedesignPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu thiết kế lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Detail Drawing Images - Phase 3 */}
      {recordDesigns.some(design => design.phase === 3) &&
        showDesignPhaseStatuses
          .map(s => s.toLowerCase())
          .includes(order.status?.toLowerCase()) && (
          <Card style={styles.section}>
            <Card.Title
              title="Bản vẽ chi tiết lần 3"
              titleStyle={styles.sectionTitle}
              left={props => (
                <Icon {...props} name="file-cad" size={24} color="#007AFF" />
              )}
            />
            <Divider style={styles.divider} />
            <Card.Content>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageContainer}>
                {recordDesigns
                  .filter(design => design.phase === 3)
                  .map((design, index) => (
                    <View
                      key={`design-phase3-${index}`}
                      style={styles.imageWrapper}>
                      {design.isSelected && (
                        <View style={styles.selectedTag}>
                          <Icon
                            name="check-circle"
                            size={12}
                            color="#fff"
                            style={styles.selectedTagIcon}
                          />
                          <Text style={styles.selectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                      {design.image?.imageUrl && (
                        <TouchableOpacity
                          onPress={() =>
                            handleImagePress(design.image.imageUrl)
                          }>
                          <Image
                            source={{uri: design.image.imageUrl}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image2 && design.image.image2 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image2)}>
                          <Image
                            source={{uri: design.image.image2}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      {design.image?.image3 && design.image.image3 !== '' && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(design.image.image3)}>
                          <Image
                            source={{uri: design.image.image3}}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </ScrollView>

              {/* Action buttons - only show for DoneDeterminingMaterialPrice status */}
              {order.status?.toLowerCase() ===
                'donedeterminingmaterialprice' && (
                <>
                  {recordDesigns.filter(design => design.phase === 3).length >
                    0 &&
                    !recordDesigns.some(design => design.isSelected) && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() =>
                          handleConfirmDesign(
                            recordDesigns.find(design => design.phase === 3).id,
                          )
                        }>
                        <Icon
                          name="check-circle"
                          size={20}
                          color="#007AFF"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>
                          Xác nhận bản vẽ chi tiết
                        </Text>
                      </TouchableOpacity>
                    )}
                  {maxPhaseDesign < 3 && (
                    <TouchableOpacity
                      style={styles.resketchOutlinedButton}
                      onPress={handleRedesignPress}>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#FF9500"
                        style={styles.resketchButtonIcon}
                      />
                      <Text style={styles.resketchOutlinedButtonText}>
                        Yêu cầu thiết kế lại
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

      {/* Material List Section - Only show when serviceOrderDetails has data */}
      {order?.serviceOrderDetails && order.serviceOrderDetails.length > 0 && (
        <Card style={styles.section}>
          <Card.Title
            title="Danh sách vật liệu"
            titleStyle={styles.sectionTitle}
            left={props => (
              <Icon {...props} name="tree" size={24} color="#007AFF" />
            )}
          />
          <Divider style={styles.divider} />
          <Card.Content>
            {/* Standard Material Products */}
            {order.serviceOrderDetails.map((detail, index) => {
              const product = materialProducts[detail.productId];
              return (
                <View key={`material-${index}`} style={styles.materialItem}>
                  {product?.image?.imageUrl ? (
                    <TouchableOpacity
                      onPress={() => handleImagePress(product.image.imageUrl)}
                      style={styles.materialImageContainer}>
                      <Image
                        source={{uri: product.image.imageUrl}}
                        style={styles.materialImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.materialImagePlaceholder}>
                      <Icon name="image-off" size={24} color="#999" />
                    </View>
                  )}

                  <View style={styles.materialDetails}>
                    <Text style={styles.materialName}>
                      {product?.name || 'Đang tải...'}
                    </Text>
                    <View style={styles.materialRow}>
                      <Text style={styles.materialLabel}>Số lượng:</Text>
                      <Text style={styles.materialValue}>
                        {detail.quantity}
                      </Text>
                    </View>
                    <View style={styles.materialRow}>
                      <Text style={styles.materialLabel}>Đơn giá:</Text>
                      <Text style={styles.materialValue}>
                        {formatCurrency(detail.price)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.materialPriceContainer}>
                    <Text style={styles.materialTotalPrice}>
                      {formatCurrency(detail.totalPrice)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* External Products inside Material List */}
            {order?.externalProducts && order.externalProducts.length > 0 && (
              <>
                <View style={{ marginTop: 18, marginBottom: 6 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: '#007AFF' }}>Sản phẩm ngoài danh mục</Text>
                </View>
                {order.externalProducts.map((product, index) => (
                  <View key={`external-product-${index}`} style={styles.materialItem}>
                    {product.imageURL ? (
                      <TouchableOpacity
                        onPress={() => handleImagePress(product.imageURL)}
                        style={styles.materialImageContainer}>
                        <Image
                          source={{uri: product.imageURL}}
                          style={styles.materialImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.materialImagePlaceholder}>
                        <Icon name="image-off" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.materialDetails}>
                      <Text style={styles.materialName}>{product.name}</Text>
                      <View style={styles.materialRow}>
                        <Text style={styles.materialLabel}>Số lượng:</Text>
                        <Text style={styles.materialValue}>{product.quantity}</Text>
                      </View>
                      <View style={styles.materialRow}>
                        <Text style={styles.materialLabel}>Đơn giá:</Text>
                        <Text style={styles.materialValue}>{formatCurrency(product.price)}</Text>
                      </View>
                    </View>
                    <View style={styles.materialPriceContainer}>
                      <Text style={styles.materialTotalPrice}>{formatCurrency(product.totalPrice)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Combined Total for Materials and External Products */}
            <View style={styles.materialTotalContainer}>
              <Text style={styles.materialTotalLabel}>Tổng cộng:</Text>
              <Text style={styles.materialTotalValue}>
                {formatCurrency(
                  (order.serviceOrderDetails.reduce(
                    (total, detail) => total + detail.totalPrice,
                    0,
                  ) || 0) +
                  (order.externalProducts ? order.externalProducts.reduce(
                    (total, product) => total + (product.totalPrice || 0),
                    0
                  ) : 0)
                )}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}


{/* Part 4: Consulting Content */}
<Card style={styles.section}>
        <Card.Title
          title="Nội dung tư vấn"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="message-text-outline"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <View style={styles.consultingNote}>
            {!order.skecthReport ? (
              <Text style={styles.noteText}>
                Designer của chúng tôi sẽ liên hệ với bạn để tư vấn và hỗ trợ
                trong thời gian sớm nhất.
              </Text>
            ) : (
              <Text style={styles.noteText}>
                {decodeHtmlEntities(order.skecthReport)}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
      {/* Part 1: Customer Information */}
      <Card style={styles.section}>
        <Card.Title
          title="Thông tin khách hàng"
          titleStyle={styles.sectionTitle}
          left={props => (
            <Icon
              {...props}
              name="account-circle-outline"
              size={24}
              color="#007AFF"
            />
          )}
        />
        <Divider style={styles.divider} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon
              name="account-outline"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{order.userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon
              name="email-outline"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{order.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon
              name="phone-outline"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{order.cusPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon
              name="map-marker-outline"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{order.address}</Text>
          </View>

          {order.workTasks && order.workTasks.length > 0 ? (
            <>
              <Text style={styles.appointmentLabel}>
                Thời gian designer liên hệ:
              </Text>
              <View style={styles.appointmentRow}>
                <Icon
                  name="calendar"
                  size={20}
                  color="#666"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Ngày:{' '}
                  {formatAppointmentDate(order.workTasks[0].dateAppointment)}
                </Text>
              </View>
              <View style={styles.appointmentRow}>
                <Icon
                  name="clock-outline"
                  size={20}
                  color="#666"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Giờ:{' '}
                  {formatAppointmentTime(order.workTasks[0].timeAppointment)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.infoRow}>
              <Icon
                name="calendar-clock"
                size={20}
                color="#666"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Thời gian designer liên hệ: Chờ xác nhận
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <ImageModal />
      <ConfirmModal />
      <SuccessModal />
      <SignContractConfirmModal />
      <PaymentModal />
      {redraftModal}
      {redesignModal}
      <CancelServiceModal />
      <ContractModal
        visible={contractModalVisible}
        pdfUrl={contract?.description}
        onClose={() => setContractModalVisible(false)}
      />

      {/* Installation Completion Confirmation Modal */}  
      <Modal
        visible={installConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInstallConfirmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              width: width * 0.85,
              maxWidth: 400,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}>
              <Icon
                name="check-circle"
                size={24}
                color="#4CAF50"
                style={{marginRight: 10}}
              />
              <Text style={{fontSize: 18, fontWeight: '600', color: '#333'}}>
                Xác nhận hoàn thành đơn hàng
              </Text>
            </View>

            <Text
              style={{
                fontSize: 15,
                color: '#444',
                marginBottom: 24,
                lineHeight: 21,
              }}>
              Bạn có chắc chắn muốn xác nhận đơn hàng đã được lắp đặt hoàn tất
              và hài lòng?
            </Text>

            <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  marginRight: 10,
                }}
                disabled={installConfirmLoading}
                onPress={() => setInstallConfirmModalVisible(false)}>
                <Text style={{color: '#666', fontSize: 16}}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 6,
                }}
                disabled={installConfirmLoading}
                onPress={async () => {
                  try {
                    setInstallConfirmLoading(true);

                    // 1. Find the most recent work task (sort by creationDate, descending)
                    let latestTask = null;
                    if (order.workTasks && order.workTasks.length > 0) {
                      // Sort by creationDate in descending order (newest first)
                      const sortedTasks = [...order.workTasks].sort(
                        (a, b) => new Date(b.creationDate) - new Date(a.creationDate),
                      );
                      latestTask = sortedTasks[0]; // Take the first one (most recent)
                    }

                    // 2. Update order status to Successfully (31)
                    const updateOrderUrl = `/serviceorder/status/${orderId}`;
                    await api.put(updateOrderUrl, {
                      status: 31, // Successfully
                      reportManger: '',
                      reportAccoutant: '',
                    }, {
                      Authorization: `Bearer ${user.backendToken}`
                    });

                    // 3. Update the latest work task to Completed (6)
                    if (latestTask) {
                      const updateTaskUrl = `/worktask/${latestTask.id}`;
                      await api.put(updateTaskUrl, {
                        serviceOrderId: order.id,
                        userId: user.id,
                        dateAppointment: order.contructionDate,
                        timeAppointment: order.contructionTime,
                        status: 6, // Completed
                        note: 'The customer has confirmed the completion of the installation and is satisfied with the product',
                      }, {
                        Authorization: `Bearer ${user.backendToken}`
                      });
                    }

                    // Close modal and show success message
                    setInstallConfirmModalVisible(false);
                    Alert.alert(
                      'Xác nhận thành công',
                      'Cảm ơn bạn đã xác nhận hoàn thành đơn hàng.',
                      [
                        {
                          text: 'OK',
                          onPress: () => fetchOrderDetails(), // Refresh data
                        },
                      ],
                    );
                  } catch (error) {
                    console.error('Error confirming installation completion:', error);
                    Alert.alert(
                      'Lỗi',
                      'Không thể xác nhận hoàn thành đơn hàng. Vui lòng thử lại sau.',
                      [{text: 'OK'}],
                    );
                  } finally {
                    setInstallConfirmLoading(false);
                  }
                }}>
                {installConfirmLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{color: '#fff', fontSize: 16, fontWeight: '600'}}>
                    Xác nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Signature preview modal */}
      <Modal
        visible={!!selectedImage && !modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{uri: selectedImage}}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Installation Actions Section */}
      {order.status?.toLowerCase() === 'doneinstalling' && (
        <View style={[styles.section, {marginBottom: 16}]}>
          <View style={{padding: 16}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Icon
                name="wrench"
                size={22}
                color="#4CAF50"
                style={{marginRight: 8}}
              />
              <Text style={{fontSize: 18, fontWeight: '600', color: '#222'}}>
                Thao tác lắp đặt
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#F0F8FF',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#CCE5FF',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}>
                <Icon
                  name="information"
                  size={22}
                  color="#2196F3"
                  style={{marginRight: 10, marginTop: 2}}
                />
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: 4,
                    }}>
                    Thông báo
                  </Text>
                  <Text style={{fontSize: 15, color: '#444', lineHeight: 22}}>
                    Cửa hàng đã hoàn thành lắp đặt sản phẩm. Vui lòng xác nhận
                    nếu bạn hài lòng với kết quả lắp đặt hoặc yêu cầu lắp đặt
                    lại nếu có vấn đề.
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#F44336',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48%',
                }}
                onPress={() => {
                  // Request reinstallation logic will go here
                }}>
                <Icon
                  name="refresh"
                  size={18}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  Yêu cầu lắp đặt lại
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48%',
                }}
                onPress={() => setInstallConfirmModalVisible(true)}>
                <Icon
                  name="check-circle"
                  size={18}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  Xác nhận hoàn thành
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Cancel Service Button */}
      {(order.status?.toLowerCase() === 'pending' ||
        order.status?.toLowerCase() === 'consultingandsketching' ||
        order.status?.toLowerCase() === 'determiningdesignprice' ||
        order.status?.toLowerCase() === 'donedeterminingdesignprice' ||
        order.status?.toLowerCase() === 'waitdeposit' ||
        order.status?.toLowerCase() === 'depositsuccessful' ||
        order.status?.toLowerCase() === 'determiningmaterialprice' ||
        order.status?.toLowerCase() === 'donedeterminingmaterialprice' ||
        order.status?.toLowerCase() === 'donedesign') && (
        <View style={styles.cancelServiceContainer}>
          <TouchableOpacity
            style={styles.cancelServiceButton}
            onPress={() => setCancelModalVisible(true)}>
            <Icon
              name="close-circle-outline"
              size={20}
              color="#fff"
              style={styles.cancelServiceIcon}
            />
            <Text style={styles.cancelServiceText}>
              {order.status?.toLowerCase() === 'depositsuccessful'
                ? 'Hủy dịch vụ (Hoàn trả 30% cọc)'
                : order.status?.toLowerCase() === 'determiningmaterialprice' ||
                  order.status?.toLowerCase() ===
                    'donedeterminingmaterialprice' ||
                  order.status?.toLowerCase() === 'donedesign'
                ? 'Hủy dịch vụ (Thanh toán 50% còn lại)'
                : 'Hủy dịch vụ'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const getStatusText = status => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'Chờ xử lý';
    case 'consultingandsketching':
      return 'Đang tư vấn & phác thảo';
    case 'determiningdesignprice':
      return 'Đang tư vấn & phác thảo';
    case 'depositsuccessful':
      return 'Đặt cọc thành công';
    case 'assigntodesigner':
      return 'Đang trong quá trình thiết kế';
    case 'determiningmaterialprice':
      return 'Đang trong quá trình thiết kế';
    case 'donedesign':
      return 'Hoàn thành thiết kế';
    case 'paymentsuccess':
      return 'Thanh toán thành công';
    case 'processing':
      return 'Đang xử lý';
    case 'pickedpackageanddelivery':
      return 'Đã lấy hàng & đang giao';
    case 'deliveryfail':
      return 'Giao hàng thất bại';
    case 'redelivery':
      return 'Giao lại';
    case 'deliveredsuccessfully':
      return 'Đã giao hàng thành công';
    case 'completeorder':
      return 'Hoàn thành đơn hàng';
    case 'ordercancelled':
      return 'Đơn hàng đã bị hủy';
    case 'warning':
      return 'Cảnh báo vượt 30%';
    case 'refund':
      return 'Hoàn tiền';
    case 'donerefund':
      return 'Đã hoàn tiền';
    case 'stopservice':
      return 'Dừng dịch vụ';
    case 'reconsultingandsketching':
      return 'Phác thảo lại';
    case 'redesign':
      return 'Thiết kế lại';
    case 'waitdeposit':
      return 'Chờ đặt cọc';
    case 'donedeterminingdesignprice':
      return 'Hoàn thành tư vấn & phác thảo';
    case 'donedeterminingmaterialprice':
      return 'Chọn bản thiết kế';
    case 'redeterminingdesignprice':
      return 'Xác định lại giá thiết kế';
    case 'exchangeprodcut':
      return 'Đổi sản phẩm';
    case 'waitforscheduling':
      return 'Chờ lên lịch';
    case 'installing':
      return 'Đang lắp đặt';
    case 'doneinstalling':
      return 'Đã lắp đặt xong';
    case 'reinstall':
      return 'Lắp đặt lại';
    case 'customerconfirm':
      return 'Khách hàng xác nhận';
    case 'successfully':
      return 'Thành công';
    case "materialpriceconfirmed": 
    return 'Đang trong quá trình thiết kế';
    default:
      return status || 'Không xác định';
  }
};

const getStatusColor = status => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#FF9500';
    case "materialpriceconfirmed":
    case 'consultingandsketching':
    case 'determiningdesignprice':
      return '#5856D6'; // Purple
    case 'depositsuccessful':
      return '#34C759'; // Green
    case 'assigntodesigner':
      return '#007AFF'; // Blue
    case 'determiningmaterialprice':
      return '#007AFF'; // Blue
    case 'donedesign':
      return '#34C759'; // Green
    case 'paymentsuccess':
      return '#34C759'; // Green
    case 'processing':
      return '#FF9500'; // Orange
    case 'pickedpackageanddelivery':
      return '#5AC8FA'; // Blue
    case 'deliveryfail':
      return '#FF3B30'; // Red
    case 'redelivery':
      return '#FF9500'; // Orange
    case 'deliveredsuccessfully':
      return '#34C759'; // Green
    case 'completeorder':
      return '#30A46C'; // Green
    case 'ordercancelled':
      return '#FF3B30'; // Red
    case 'warning':
      return '#FF3B30'; // Red
    case 'refund':
      return '#FF9500'; // Orange
    case 'donerefund':
      return '#34C759'; // Green
    case 'stopservice':
      return '#8E8E93'; // Gray
    case 'reconsultingandsketching':
      return '#5856D6'; // Purple
    case 'redesign':
      return '#5856D6'; // Purple
    case 'waitdeposit':
      return '#FF9500'; // Orange
    case 'donedeterminingdesignprice':
      return '#34C759'; // Green
    case 'donedeterminingmaterialprice':
      return '#34C759'; // Green
    case 'redeterminingdesignprice':
      return '#5AC8FA'; // Blue
    case 'exchangeprodcut':
      return '#FF9500'; // Orange
    case 'waitforscheduling':
      return '#FF9500'; // Orange
    case 'installing':
      return '#007AFF'; // Blue
    case 'doneinstalling':
      return '#34C759'; // Green
    case 'reinstall':
      return '#FF9500'; // Orange
    case 'customerconfirm':
      return '#34C759'; // Green
    case 'successfully':
      return '#34C759'; // Green

    default:
      return '#8E8E93'; // Gray
  }
};

const getServiceTypeText = serviceType => {
  switch (serviceType) {
    case 'NoDesignIdea':
      return 'Thiết kế mới';
    default:
      return serviceType || 'Không xác định';
  }
};

const formatCurrency = amount => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const formatAppointmentDate = dateString => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting appointment date:', error);
    return dateString;
  }
};

const formatAppointmentTime = timeString => {
  if (!timeString) return '';
  try {
    // Handle HH:MM:SS format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting appointment time:', error);
    return timeString;
  }
};

// Helper function for formatting construction time (HH:MM:SS)
const formatTimeForDisplay = timeString => {
  if (!timeString) return '';
  try {
    // Handle HH:MM:SS format
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      // Just show hours and minutes
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeString;
  }
};

// Helper function for formatting construction date
const formatDateForDisplay = dateString => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString;
  }
};

export default ServiceOrderNoUsingDetailScreen;
