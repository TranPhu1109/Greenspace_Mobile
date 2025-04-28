import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWallet } from '../context/WalletContext';
import { InAppBrowser } from 'react-native-inappbrowser-reborn' 

const TopUpScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { createVnpayPayment } = useWallet();
  
  const presetAmounts = [100000, 200000, 500000, 1000000];

  const handleConfirmTopUp = async () => {
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsProcessing(true);
    try {
      const paymentUrl = await createVnpayPayment(numericAmount);
      console.log('Received VNPay URL:', paymentUrl);
      
      if (await InAppBrowser.isAvailable()) {
        console.log('InAppBrowser is available, opening URL...');
        await InAppBrowser.open(paymentUrl, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#4CAF50',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          showTitle: true,
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right'
          },
        });
        console.log('InAppBrowser opened successfully');
      } else {
        console.log('InAppBrowser not available, falling back to Linking');
        const supported = await Linking.canOpenURL(paymentUrl);
        if (supported) {
          await Linking.openURL(paymentUrl);
        } else {
          Alert.alert('Lỗi', `Không thể mở URL: ${paymentUrl}`);
        }
      }
    } catch (error) {
      console.error('Top-up error:', error);
      if (error.message !== "Another InAppBrowser is already being presented." && error.message !== "browser closed") {
          Alert.alert('Lỗi nạp tiền', error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nạp tiền</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <Text style={styles.label}>Số tiền nạp (VNĐ)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder="Nhập số tiền"
          placeholderTextColor="#999"
        />
      </View>

      {/* Preset Amounts */}
      <View style={styles.presetContainer}>
        {presetAmounts.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.presetButton,
              amount === value.toString() && styles.presetButtonActive,
            ]}
            onPress={() => setAmount(value.toString())}>
            <Text style={[
              styles.presetButtonText,
              amount === value.toString() && styles.presetButtonTextActive,
            ]}>
              {value.toLocaleString('vi-VN')}đ
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Confirm Button */}
      <TouchableOpacity 
        style={styles.confirmButton}
        onPress={handleConfirmTopUp}
        disabled={isProcessing || !amount}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Xác nhận Nạp tiền</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  amountContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 24,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetButtonText: {
    fontSize: 16,
    color: '#000',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TopUpScreen; 