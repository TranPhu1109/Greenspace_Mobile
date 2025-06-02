import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl, Linking, Dimensions, Modal, TouchableWithoutFeedback, TextInput, Platform, DateTimePickerAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StatusTracking from '../components/StatusTracking';
import StatusTrackingNoCustom from '../components/StatusTrackingNoCustom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import DateTimePicker from '@react-native-community/datetimepicker';

// Utility function to format HTML content (Copied from DesignDetailScreen.js)
const formatDescription = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Remove HTML tags and decode HTML entities
  let formattedText = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/&ocirc;/g, 'ô') // Replace &ocirc; with ô
    .replace(/&agrave;/g, 'à') // Replace &agrave; with à
    .replace(/&egrave;/g, 'è') // Replace &egrave; with è
    .replace(/&eacute;/g, 'é') // Replace &eacute; with é
    .replace(/&ugrave;/g, 'ù') // Replace &ugrave; with ù
    .replace(/&ldquo;/g, '"') // Replace &ldquo; with "
    .replace(/&rdquo;/g, '"') // Replace &rdquo; with "
    .replace(/&acirc;/g, 'â') // Replace &acirc; with â
    .replace(/&oacute;/g, 'ó') // Replace &oacute; with ó
    .replace(/&aacute;/g, 'á') // Replace &aacute; with á
    .replace(/&atilde;/g, 'ã') // Replace &atilde; with ã
    .replace(/&ecirc;/g, 'ê') // Replace &ecirc; with ê
    .replace(/&ograve;/g, 'ò') // Replace &ograve; with ò
    .replace(/&iacute;/g, 'í') // Replace &iacute; with í
    .replace(/&uacute;/g, 'ú') // Replace &uacute; with ú
    .replace(/&amp;#7853;/g, 'ậ')
    .replace(/&amp;#7863;/g, 'ặ')
    .replace(/&amp;#7879;/g, 'ễ')
    .replace(/&amp;#7885;/g, 'ị')
    .replace(/&amp;#7889;/g, 'ọ')
    .replace(/&amp;#7891;/g, 'ỏ')
    .replace(/&amp;#7893;/g, 'õ')
    .replace(/&amp;#7897;/g, 'ụ')
    .replace(/&amp;#7899;/g, 'ủ')
    .replace(/&amp;#7901;/g, 'ũ')
    .replace(/&amp;#7905;/g, 'ự')
    .replace(/&amp;#7907;/g, 'ử')
    .replace(/&amp;#7909;/g, 'ữ')
    
    .replace(/\r\n/g, '\n') // Replace \r\n with \n
    .trim();

  // Split into paragraphs and clean up
  const paragraphs = formattedText.split('\n').filter(p => p.trim());
  
  return paragraphs.join('\n\n');
};

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatAddress = (addressString) => {
  if (!addressString) return 'N/A';
  return addressString.split('|').join(', ');
};

const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { text: 'Chờ xử lý', color: '#FF9500' };
      case 'processing':
        return { text: 'Đang xử lý', color: '#007AFF' };
      case 'installing':
        return { text: 'Đang lắp đặt', color: '#5AC8FA' };
      case 'doneinstalling':
        return { text: 'Hoàn tất lắp đặt', color: '#34C759' };
      case 'reinstall':
        return { text: 'Lắp đặt lại', color: '#FF9500' };
      case 'successfully':
        return { text: 'Hoàn tất đơn hàng', color: '#34C759' };
      case 'ordercancelled':
        return { text: 'Đã hủy', color: '#FF3B30' };
      default:
        return { text: status || 'Không xác định', color: '#8E8E93' };
    }
};
// --- End Helper Functions ---

const formatDateForApi = (dateString) => {
  if (!dateString) return null;
  // Assuming dateString is in dd/mm/yyyy format
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

const formatTimeForApi = (timeString) => {
  if (!timeString) return null;
  // Assuming timeString is in hh:mm:ss format
  // No change needed if already in HH:mm:ss, but this function acts as a clear step
  return timeString;
};

const ServiceOrderDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orderId } = route.params;
  const [orderDetails, setOrderDetails] = useState(null);
  const [designDetails, setDesignDetails] = useState(null);
  //console.log("orderDetails", orderDetails);  
  
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reinstallLoading, setReinstallLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [isReinstallModalVisible, setIsReinstallModalVisible] = useState(false);
  const [reinstallDate, setReinstallDate] = useState('');
  const [reinstallTime, setReinstallTime] = useState('');
  const [reinstallReason, setReinstallReason] = useState('');
  const [reinstallErrors, setReinstallErrors] = useState({});
  const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const hasReinstallRequest = useMemo(() => {
    if (!orderDetails?.workTasks) return false;
    return orderDetails.workTasks.some(task => 
      task.status?.toLowerCase() === 'reinstall' || 
      task.note?.toLowerCase().includes('lắp đặt lại')
    );
  }, [orderDetails?.workTasks]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("Order ID not provided.");
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderDetails?.designIdeaId) {
      const fetchDesignDetails = async () => {
        try {
          const response = await api.get(`/designidea/${orderDetails.designIdeaId}`);
          setDesignDetails(response.data || response);
          console.log("Fetched design details:", response.data || response);
        } catch (err) {
          console.error(`Error fetching design idea ${orderDetails.designIdeaId}:`, err);
        }
      };
      fetchDesignDetails();
    }
  }, [orderDetails?.designIdeaId]);

  const fetchProductDetails = async (productId) => {
    if (!productId) return null;
    try {
      const response = await api.get(`/product/${productId}`);
      return response.data || response;
    } catch (err) {
      console.error(`Error fetching product ${productId}:`, err);
      return null;
    }
  };

  const fetchOrderDetails = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      
      const response = await api.get(`/serviceorder/${orderId}`);
      const orderData = response.data || response;

      if (!orderData) {
        throw new Error("Order data not found in response.");
      }
      setOrderDetails(orderData);
      
      if (orderData.serviceOrderDetails && orderData.serviceOrderDetails.length > 0) {
        const productPromises = orderData.serviceOrderDetails.map(detail => 
          fetchProductDetails(detail.productId)
        );
        const productResults = await Promise.all(productPromises);
        
        const productMap = {};
        orderData.serviceOrderDetails.forEach((detail, index) => {
          if (productResults[index]) {
            productMap[detail.productId] = productResults[index];
          } else {
            console.warn(`Product details not found for ID: ${detail.productId}`);
            productMap[detail.productId] = { name: 'Sản phẩm không khả dụng', price: 0, quantity: detail.quantity, image: { imageUrl: '' } };
          }
        });
        setProducts(productMap);
        console.log("Fetched product details map:", productMap);
      } else {
        setProducts({});
      }
      
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Bạn chưa có đơn hàng nào!');
      setOrderDetails(null);
    } finally {
      if (!isRefreshing) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails(true);
  }, [orderId]);

  const calculatedMaterialPrice = useMemo(() => {
    if (!orderDetails?.serviceOrderDetails) return 0;
    return orderDetails.serviceOrderDetails.reduce((sum, detail) => {
      return sum + (detail.totalPrice || 0);
    }, 0);
  }, [orderDetails]);

  const calculatedTotalCost = useMemo(() => {
    return (orderDetails?.designPrice || 0) + calculatedMaterialPrice;
  }, [orderDetails, calculatedMaterialPrice]);

  const showActionSuccess = (message) => {
    Alert.alert('Thành công', message, [{ text: 'OK' }]);
  };

  const showActionError = (message) => {
    Alert.alert('Lỗi', message, [{ text: 'OK' }]);
    setActionError(message);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const workTask = orderDetails?.workTasks?.[0];
      if (workTask?.dateAppointment) {
        const appointmentDate = new Date(workTask.dateAppointment);
        const minDate = new Date(appointmentDate);
        minDate.setDate(minDate.getDate() + 2);

        // Check if selected date is at least 2 days after appointment date
        if (selectedDate < minDate) {
          Alert.alert(
            'Lỗi',
            `Ngày lắp đặt lại phải sau ngày ${minDate.toLocaleDateString('vi-VN')}`
          );
          return;
        }
      }
      // Format date to dd/mm/yyyy for display
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setReinstallDate(`${day}/${month}/${year}`);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      // Check if time is between 8 AM and 5 PM
      if (hours < 8 || hours >= 17) {
        Alert.alert(
          'Lỗi',
          'Thời gian lắp đặt phải từ 8:00 đến 17:00'
        );
        return;
      }

      // Format time to hh:mm:ss for display
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const seconds = selectedTime.getSeconds().toString().padStart(2, '0');
      setReinstallTime(`${formattedHours}:${formattedMinutes}:${seconds}`);
    }
  };

  const showMode = (currentMode) => {
    if (currentMode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const showDatepicker = () => {
    const workTask = orderDetails?.workTasks?.[0];
    if (!workTask?.dateAppointment) {
      Alert.alert('Lỗi', 'Không tìm thấy ngày hẹn lắp đặt');
      return;
    }

    // Calculate minimum date (2 days after dateAppointment)
    const appointmentDate = new Date(workTask.dateAppointment);
    const minDate = new Date(appointmentDate);
    minDate.setDate(minDate.getDate() + 2);

    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    // Set initial time to 8 AM if no time is selected
    if (!reinstallTime) {
      const now = new Date();
      now.setHours(8, 0, 0, 0);
      setShowTimePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const validateReinstallForm = () => {
    const errors = {};
    if (!reinstallDate) errors.date = 'Ngày lắp đặt lại không được để trống.';
    if (!reinstallTime) errors.time = 'Giờ lắp đặt lại không được để trống.';
    if (!reinstallReason) errors.reason = 'Lý do yêu cầu lắp đặt lại không được để trống.';
    setReinstallErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleModalConfirmReinstall = async () => {
    if (!validateReinstallForm()) {
      return;
    }

    setIsModalConfirmLoading(true);
    setActionError(null);

    try {
      // Find the work task ID. Assuming the first work task in the array is the relevant one.
      const workTask = orderDetails?.workTasks?.[0];
      if (!workTask?.id) {
        throw new Error("Không tìm thấy thông tin công việc.");
      }

      // 1. Call API update workTask
      const workTaskId = workTask.id;
      const updateWorkTaskPayload = {
        serviceOrderId: orderDetails.id,
        userId: workTask.userId, // Assuming this is the correct userId to send
        dateAppointment: formatDateForApi(reinstallDate), // Format as YYYY-MM-DD
        timeAppointment: formatTimeForApi(reinstallTime), // Format as HH:mm:ss
        status: 10, // Assuming 10 is the status for reinstallation requested
        note: reinstallReason,
      };

      console.log('Updating work task with payload:', updateWorkTaskPayload);
      
      const workTaskResponse = await api.put(`/worktask/${workTaskId}`, updateWorkTaskPayload);
      // if (!workTaskResponse.data?.success) {
      //   throw new Error(workTaskResponse.data?.message || 'Cập nhật công việc thất bại.');
      // }
      console.log("workTaskResponse", workTaskResponse);

      // Simulate work task update delay
      // await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Work task updated successfully (simulated).');

      // 2. Next call the api to update order status
      const serviceOrderId = orderDetails.id;
      const updateOrderStatusPayload = {
        status: 29, // Assuming 29 is the status for reinstallation requested at the order level
        deliveryCode: "",
        reportManger: "",
        reportAccoutant: ""
      };

      console.log('Updating order status with payload:', updateOrderStatusPayload);
      // Example API call:
      const orderStatusResponse = await api.put(`/serviceorder/status/${serviceOrderId}`, updateOrderStatusPayload);
      // if (!orderStatusResponse.data?.success) {
      //   throw new Error(orderStatusResponse.data?.message || 'Cập nhật trạng thái đơn hàng thất bại.');
      // }
      console.log("orderStatusResponse", orderStatusResponse);

      // Simulate order status update delay
      // await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Order status updated successfully (simulated).');

      showActionSuccess('Yêu cầu lắp đặt lại đã được gửi thành công.');
      setIsReinstallModalVisible(false);
      // Optionally refresh order details or update status locally
      fetchOrderDetails(); // Refresh data to show updated status

    } catch (err) {
      console.error('Error during reinstallation request:', err);
      showActionError(err.message || 'Không thể gửi yêu cầu lắp đặt lại. Vui lòng thử lại.');
    } finally {
      setIsModalConfirmLoading(false);
    }
  };

  const handleRequestReinstall = () => {
    if (hasReinstallRequest) {
      Alert.alert(
        'Thông báo',
        'Bạn đã có yêu cầu lắp đặt lại. Vui lòng chờ xử lý yêu cầu hiện tại.'
      );
      return;
    }
    // Reset form and errors when opening modal
    setReinstallDate('');
    setReinstallTime('');
    setReinstallReason('');
    setReinstallErrors({});
    setIsReinstallModalVisible(true);
  };

  const handleConfirmCompletion = async () => {
     Alert.alert(
       'Xác nhận hoàn tất đơn hàng',
       'Sau khi xác nhận, đơn hàng sẽ được đánh dấu là hoàn tất. Bạn có chắc chắn?',
       [
         { text: 'Hủy', style: 'cancel' },
         { text: 'Xác nhận', onPress: async () => {
             setConfirmLoading(true);
             setActionError(null);
             try {
               // Find the work task ID. Assuming the first work task in the array is the relevant one.
               const workTask = orderDetails?.workTasks?.[0];
               if (!workTask?.id) {
                 throw new Error("Không tìm thấy thông tin công việc.");
               }

               // 1. Call API update workTask status
               const workTaskId = workTask.id;
               const updateWorkTaskPayload = {
                 serviceOrderId: orderDetails.id,
                 userId: workTask.userId, // Use the userId from the workTask
                 // Retain existing dateAppointment and timeAppointment or set as needed by API
                 dateAppointment: workTask.dateAppointment, // Keep existing or set to null
                 timeAppointment: workTask.timeAppointment, // Keep existing or set to null
                 status: 6, // Assuming 11 is the status for completed work task
                 note: "Hoàn thành lắp đặt", // Retain existing note
               };

               console.log('Updating work task status with payload:', updateWorkTaskPayload);
               const workTaskResponse = await api.put(`/worktask/${workTaskId}`, updateWorkTaskPayload);
               console.log("workTaskResponse", workTaskResponse);
               

               // 2. Call API to update order status
               const serviceOrderId = orderDetails.id;
               const updateOrderStatusPayload = {
                 status: 31,
                 deliveryCode: "",
                 reportManger: "",
                 reportAccoutant: ""
               };

               console.log('Updating order status with payload:', updateOrderStatusPayload);
               const orderStatusResponse = await api.put(`/serviceorder/status/${serviceOrderId}`, updateOrderStatusPayload);
               console.log("orderStatusResponse", orderStatusResponse);

               showActionSuccess('Đơn hàng đã được xác nhận hoàn tất.');
               // Optionally refresh order details or update status locally
               fetchOrderDetails(); // Refresh data to show updated status

             } catch (err) {
               console.error('Error confirming completion:', err);
               showActionError(err.message || 'Không thể xác nhận hoàn tất đơn hàng. Vui lòng thử lại.');
             } finally {
               setConfirmLoading(false);
             }
           }
         },
       ],
       { cancelable: true }
     );
  };

  if (loading) {
    return (
      <View style={styles.container}> 
        <Header navigation={navigation} title="Đang tải đơn hàng..." />
        <View style={styles.centeredContainer}> 
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </View>
    );
  }

  if (error || !orderDetails) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="Error" />
        <View style={styles.centeredContainer}> 
          <Icon name="alert-circle-outline" size={60} color="#FF3B30" style={{ marginBottom: 15 }}/>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(orderDetails.status);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={`Đơn hàng #${orderId.substring(0, 8)}`} />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#007AFF']}
          />
        }
      >
        <View style={styles.orderSummaryHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Icon name={statusInfo.icon} size={16} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
          </View>
          <Text style={styles.orderDateText}>{formatDate(orderDetails.creationDate)}</Text>
        </View>

          {/* Design Drawing and Installation Guide Section */}
        {orderDetails.status?.toLowerCase() === 'doneinstalling' && (
          <View style={styles.completionActionsSection}>
            <Text style={styles.completionMessage}>Vui lòng kiểm tra kết quả thi công. Nếu bạn hài lòng, hãy xác nhận hoàn tất đơn hàng. Nếu có vấn đề, bạn có thể yêu cầu lắp đặt lại.</Text>
            <View style={styles.completionButtonsContainer}>
              <TouchableOpacity
                style={[styles.requestReinstallButton, hasReinstallRequest && styles.buttonDisabled]}
                onPress={handleRequestReinstall}
                disabled={reinstallLoading || confirmLoading || hasReinstallRequest}
              >
                {reinstallLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
                )}
                <Text style={styles.requestReinstallButtonText}>
                  {hasReinstallRequest ? 'Đã yêu cầu lắp đặt lại' : 'Yêu cầu lắp đặt lại'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmCompletionButton}
                onPress={handleConfirmCompletion}
                disabled={reinstallLoading || confirmLoading}
              >
                {confirmLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="check-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                )}
                <Text style={styles.confirmCompletionButtonText}>Xác nhận hoàn tất</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

<View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
           
            <StatusTrackingNoCustom currentStatus={orderDetails.status} />
          
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="account-outline" label="Tên" text={orderDetails.userName || 'N/A'} />
            <InfoRow icon="phone-outline" label="Số điện thoại" text={orderDetails.cusPhone || 'N/A'} />
            <InfoRow icon="map-marker-outline" label="Địa chỉ" text={formatAddress(orderDetails.address)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thiết kế</Text>
          <View style={styles.infoCard}>
            

            <InfoRow 
              icon={orderDetails.isCustom ? "pencil-ruler" : "lightbulb-on-outline"} 
              label="Loại dịch vụ" 
              text={orderDetails.isCustom ? "Thiết kế tùy chỉnh" : "Sử dụng ý tưởng thiết kế"} 
            />          
            {designDetails?.name && (
              <InfoRow icon="palette-outline" label="Tên thiết kế" text={designDetails.name} />
            )}
            {designDetails?.description && (
              <InfoRow icon="text-box-outline" label="Mô tả" text={formatDescription(designDetails?.description)} />
            )}
            {/* Design Images Carousel */}
            {designDetails?.image && (
              <View style={styles.designImagesCarouselContainer}>
                <ScrollView 
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.designImagesCarousel}
                >
                  {/* Image 1 */}
                  {designDetails.image.imageUrl ? (
                    <Image
                      source={{ uri: designDetails.image.imageUrl }}
                      style={styles.designInfoImage}
                      defaultSource={require('../assets/images/default_image.jpg')}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.designInfoImagePlaceholder} />
                  )}
                  {/* Image 2 */}
                  {designDetails.image.image2 ? (
                    <Image
                      source={{ uri: designDetails.image.image2 }}
                      style={styles.designInfoImage}
                      defaultSource={require('../assets/images/default_image.jpg')}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.designInfoImagePlaceholder} />
                  )}
                  {/* Image 3 */}
                  {designDetails.image.image3 ? (
                    <Image
                      source={{ uri: designDetails.image.image3 }}
                      style={styles.designInfoImage}
                      defaultSource={require('../assets/images/default_image.jpg')}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.designInfoImagePlaceholder} />
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách vật liệu</Text>
          <View style={styles.infoCard}> 
            {orderDetails.serviceOrderDetails && orderDetails.serviceOrderDetails.length > 0 ? (
              orderDetails.serviceOrderDetails.map((detail, index) => {
                const product = products[detail.productId];
                const unitPrice = detail.price || 0;
                const totalItemPrice = detail.totalPrice || (unitPrice * detail.quantity) || 0;
                
                return (
                  <View key={detail.productId || index} style={[styles.materialRow, index === orderDetails.serviceOrderDetails.length - 1 && styles.lastMaterialRow]}> 
                    {product?.image?.imageUrl ? (
                      <Image 
                        source={{ uri: product.image.imageUrl }} 
                        style={styles.materialImage} 
                        defaultSource={require('../assets/images/default_image.jpg')}
                      />
                    ) : (
                      <View style={styles.materialImagePlaceholder}>
                        <Icon name="image-off-outline" size={24} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialName} numberOfLines={2}>
                        {product ? product.name : `Product ID: ${detail.productId}`}
                      </Text>
                      <Text style={styles.materialMeta}>x{detail.quantity} | {unitPrice.toLocaleString('vi-VN')} VND</Text>
                    </View>
                    <Text style={styles.materialTotalPrice}>{totalItemPrice.toLocaleString('vi-VN')} VND</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noItemsText}>Không có vật liệu được liệt kê cho đơn hàng này.</Text>
            )}
          </View>
        </View>

       

        {orderDetails.status.toLowerCase() !== 'pending' && orderDetails.status.toLowerCase() !== 'ordercancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách bản vẽ thiết kế và hướng dẫn lắp đặt</Text>
            <View style={styles.infoCard}>
              {/* Design Drawing (Image) */}
              {designDetails?.designImage1URL ? (
                <View style={styles.designDrawingContainer}>
                  <Text style={styles.drawingLabel}>Bản vẽ thiết kế:</Text>
                  <Image 
                    source={{ uri: designDetails.designImage1URL }} 
                    style={styles.designDrawingImage} 
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Text style={styles.noItemsText}>Không có bản vẽ thiết kế nào.</Text>
              )}
              
              {/* PDF Guide Link */}
              {designDetails?.designImage2URL && designDetails.designImage2URL.startsWith('http') && (
                <TouchableOpacity 
                  style={styles.externalLinkButton}
                  onPress={() => Linking.openURL(designDetails.designImage2URL)}
                >
                  <Icon name="file-pdf-box" size={20} color="#E53935" style={styles.externalLinkIcon} />
                  <Text style={styles.externalLinkText}>Hướng dẫn lắp đặt</Text>
                </TouchableOpacity>
              )}
              
              {/* Video Guide Link */}
              {designDetails?.designImage3URL && designDetails.designImage3URL.startsWith('http') && (
                <TouchableOpacity 
                  style={styles.externalLinkButton}
                  onPress={() => Linking.openURL(designDetails.designImage3URL)}
                >
                  <Icon name="youtube" size={20} color="#FF0000" style={styles.externalLinkIcon} />
                  <Text style={styles.externalLinkText}>Video hướng dẫn lắp đặt</Text>
                </TouchableOpacity>
              )}
              
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoCard}> 
            <PaymentRow 
              label="Giá thiết kế" 
              amount={`${(orderDetails.designPrice || 0).toLocaleString('vi-VN')} VND`} 
            />
            <PaymentRow 
              label="Giá vật liệu" 
              amount={`${calculatedMaterialPrice.toLocaleString('vi-VN')} VND`}
              isLast={true} 
            />
            <View style={styles.totalPaymentRow}>
              <Text style={styles.totalLabel}>Tổng giá</Text>
              <Text style={styles.totalAmount}>
                {calculatedTotalCost.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>

        

       

      </ScrollView>

      {/* Reinstallation Request Modal */}
      <Modal
        visible={isReinstallModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsReinstallModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsReinstallModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.reinstallModalContainer}>
                <Text style={styles.modalTitle}>Yêu cầu lắp đặt lại</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}><Text style={styles.requiredIndicator}>*</Text> Ngày lắp đặt lại</Text>
                  <TouchableOpacity onPress={showDatepicker} disabled={isModalConfirmLoading}>
                    <TextInput
                      style={[styles.formInput, reinstallErrors.date && styles.inputError]}
                      value={reinstallDate}
                      editable={false} // Make it non-editable as picker handles input
                      placeholder="Chọn ngày"
                    />
                  </TouchableOpacity>
                  {reinstallErrors.date && <Text style={styles.errorTextSmall}>{reinstallErrors.date}</Text>}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}><Text style={styles.requiredIndicator}>*</Text> Giờ lắp đặt lại</Text>
                  <TouchableOpacity onPress={showTimepicker} disabled={isModalConfirmLoading}>
                    <TextInput
                      style={[styles.formInput, reinstallErrors.time && styles.inputError]}
                      value={reinstallTime}
                      editable={false} // Make it non-editable as picker handles input
                      placeholder="Chọn giờ"
                    />
                  </TouchableOpacity>
                  {reinstallErrors.time && <Text style={styles.errorTextSmall}>{reinstallErrors.time}</Text>}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}><Text style={styles.requiredIndicator}>*</Text> Lý do yêu cầu lắp đặt lại</Text>
                  <TextInput
                    style={[styles.formInput, styles.multilineInput, reinstallErrors.reason && styles.inputError]}
                    placeholder="Nhập lý do yêu cầu lắp đặt lại"
                    value={reinstallReason}
                    onChangeText={setReinstallReason}
                    multiline={true}
                    numberOfLines={4}
                  />
                   {reinstallErrors.reason && <Text style={styles.errorTextSmall}>{reinstallErrors.reason}</Text>}
                </View>

                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setIsReinstallModalVisible(false)}
                    disabled={isModalConfirmLoading}
                  >
                    <Text style={styles.modalButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirmButton, isModalConfirmLoading && styles.modalButtonDisabled]}
                    onPress={handleModalConfirmReinstall}
                    disabled={isModalConfirmLoading}
                  >
                     {isModalConfirmLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                     ) : (
                      <Text style={styles.modalButtonText}>Xác nhận</Text>
                     )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          minimumDate={(() => {
            const workTask = orderDetails?.workTasks?.[0];
            if (workTask?.dateAppointment) {
              const appointmentDate = new Date(workTask.dateAppointment);
              const minDate = new Date(appointmentDate);
              minDate.setDate(minDate.getDate() + 2);
              return minDate;
            }
            return new Date();
          })()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={(() => {
            if (reinstallTime) {
              const [hours, minutes, seconds] = reinstallTime.split(':').map(Number);
              const date = new Date();
              date.setHours(hours, minutes, seconds);
              return date;
            }
            const date = new Date();
            date.setHours(8, 0, 0, 0);
            return date;
          })()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
          minimumDate={(() => {
            const date = new Date();
            date.setHours(8, 0, 0, 0);
            return date;
          })()}
          maximumDate={(() => {
            const date = new Date();
            date.setHours(17, 0, 0, 0);
            return date;
          })()}
        />
      )}

    </View>
  );
};

const Header = ({ navigation, title }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Icon name="chevron-left" size={28} color="#000" />
    </TouchableOpacity>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={{ width: 28 }} /> 
  </View>
);

const InfoRow = ({ icon, label, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color="#6c757d" style={styles.infoIcon}/>
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{text}</Text>
    </View>
  </View>
);

const PaymentRow = ({ label, amount, isLast = false }) => (
  <View style={[styles.paymentRow, isLast && styles.lastPaymentRow]}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={styles.paymentAmount}>{amount}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 17,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  orderSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
  },
  statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
  },
  statusBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff', 

  },
  orderDateText: {
      fontSize: 13,
      color: '#6c757d',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F0F2F5',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  infoIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
      fontSize: 12,
      color: '#6c757d',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#343a40',
    lineHeight: 21,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  lastMaterialRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F8F9FA',
  },
  materialImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  materialMeta: {
    fontSize: 13,
    color: '#6c757d',
  },
  materialTotalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginLeft: 10,
    textAlign: 'right',
  },
  noItemsText: {
      fontSize: 14,
      color: '#6c757d',
      textAlign: 'center',
      paddingVertical: 20,
      fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  lastPaymentRow: {
      borderBottomWidth: 0,
      paddingBottom: 0,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#343a40',
    fontWeight: '500',
  },
  totalPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  designDrawingContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  drawingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#343a40',
  },
  designDrawingImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  installationGuideContainer: {
    marginTop: 15,
  },
  guideLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 10,
  },
  guideText: {
    fontSize: 14,
    color: '#343a40',
    lineHeight: 20,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  externalLinkIcon: {
    marginRight: 10,
  },
  externalLinkText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  designImagesCarouselContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  designImagesCarousel: {
    height: 200,
    
  },
  designInfoImage: {
    width: Dimensions.get('window').width - 32,
    height: 200,
    marginRight: 8,
    borderRadius: 8,
  },
  designInfoImagePlaceholder: {
    width: Dimensions.get('window').width - 32,
    height: 200,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionActionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F0F2F5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  completionMessage: {
    fontSize: 15,
    color: '#343a40',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  completionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  requestReinstallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30', // Red
    borderRadius: 8,
  },
  requestReinstallButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',

  },
  confirmCompletionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759', // Green
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,

  },
  confirmCompletionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reinstallModalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 5,
  },
  requiredIndicator: {
    color: '#FF3B30', // Red color for asterisk
    marginRight: 2,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 15,
    color: '#343a40',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorTextSmall: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 3,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#34C759', // Green
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#FF3B30',
  },
});

export default ServiceOrderDetailScreen;