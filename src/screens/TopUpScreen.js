import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';

const TopUpScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState('');
  
  const presetAmounts = [100000, 200000, 500000, 1000000];

  const generateQRCode = (value) => {
    // In a real app, this would be your payment gateway's QR code data
    const paymentData = {
      type: 'top-up',
      amount: value,
      timestamp: new Date().toISOString(),
      merchantId: 'YOUR_MERCHANT_ID',
    };
    setQrData(JSON.stringify(paymentData));
    setAmount(value.toString());
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
        <Text style={styles.label}>Số tiền nạp</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            if (text) {
              generateQRCode(parseInt(text.replace(/[^0-9]/g, '')));
            }
          }}
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
            onPress={() => generateQRCode(value)}>
            <Text style={[
              styles.presetButtonText,
              amount === value.toString() && styles.presetButtonTextActive,
            ]}>
              {value.toLocaleString()}đ
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <Text style={styles.qrTitle}>Quét mã QR để nạp tiền</Text>
        <View style={styles.qrWrapper}>
          {qrData ? (
            <QRCode
              value={qrData}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          ) : (
            <Text style={styles.qrPlaceholder}>
              Vui lòng chọn số tiền để hiển thị mã QR
            </Text>
          )}
        </View>
        <Text style={styles.qrInstructions}>
          Sử dụng ứng dụng ngân hàng để quét mã QR và thực hiện thanh toán
        </Text>
      </View>
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
  qrContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  qrPlaceholder: {
    color: '#666',
    textAlign: 'center',
    padding: 40,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default TopUpScreen; 