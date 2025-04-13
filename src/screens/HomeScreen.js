// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Animated, TouchableOpacity, NativeEventEmitter } from 'react-native';
import SearchHeader from '../components/SearchHeader';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import VnpayMerchant,  { VnpayMerchantModule } from '../../react-native-vnpay-merchant';

const eventEmitter = new NativeEventEmitter(VnpayMerchantModule);


const HomeScreen = () => {
  const [text, setText] = useState('OpenSDK')
  const { user, isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnimation = new Animated.Value(0);
  const navigation = useNavigation();
  const images = [
    require('../assets/images/image1.jpg'),
    require('../assets/images/image2.jpg'),
    require('../assets/images/image3.jpg'), 
    require('../assets/images/image4.jpg'),
    require('../assets/images/image5.jpg')

  ];
  const { logout } = useAuth(); 

  const handleLogout = () => {
    logout();
    // No need to navigate, the RootStack will automatically show Login screen
  };

  useEffect(() => {
    const slideTimer = setInterval(() => {
      slideAnimation.setValue(0);
      
      Animated.timing(slideAnimation, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      });
    }, 3000);

    return () => clearInterval(slideTimer);
  }, []);

  return (
    <View style={styles.container}>
      <SearchHeader title="Home" />
      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.slideContainer}>
          <Animated.Image
            source={images[currentIndex]}
            style={[
              styles.slideImage,
              {
                transform: [{translateX: slideAnimation}]
              }
            ]}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.text}>Welcome to the Home Screen!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            navigation.navigate('Login');
          }}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {isAuthenticated && (
          <View>

          
          <Text>Welcome {user.email}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          </View>
        )}
        
      </ScrollView>
      <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <TouchableOpacity style={{ paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLOR.blue600, borderRadius: 10 }}
          onPress={() => {

            // mở sdk
            eventEmitter.addListener('PaymentBack', (e) => {
              console.log('Sdk back!')
              if (e) {
                console.log("e.resultCode = " + e.resultCode);
                switch (e.resultCode) {
                  //resultCode == -1
                  //vi: Người dùng nhấn back từ sdk để quay lại
                  //en: back from sdk (user press back in button title or button back in hardware android)

                  //resultCode == 10
                  //vi: Người dùng nhấn chọn thanh toán qua app thanh toán (Mobile Banking, Ví...) lúc này app tích hợp sẽ cần lưu lại cái PNR, khi nào người dùng mở lại app tích hợp thì sẽ gọi kiểm tra trạng thái thanh toán của PNR Đó xem đã thanh toán hay chưa.
                  //en: user select app to payment (Mobile banking, wallet ...) you need save your PNR code. because we don't know when app banking payment successfully. so when user re-open your app. you need call api check your PNR code (is paid or unpaid). PNR: it's vnp_TxnRef. Reference code of transaction at Merchant system

                  //resultCode == 99
                  //vi: Người dùng nhấn back từ trang thanh toán thành công khi thanh toán qua thẻ khi gọi đến http://sdk.merchantbackapp
                  //en: back from button (button: done, ...) in the webview when payment success. (incase payment with card, atm card, visa ...)

                  //resultCode == 98
                  //vi: giao dịch thanh toán bị failed
                  //en: payment failed

                  //resultCode == 97
                  //vi: thanh toán thành công trên webview
                  //en: payment success
                }

                // khi tắt sdk
                eventEmitter.removeAllListeners('PaymentBack')
              }
            })

            // VnpayMerchant.show({
            //   iconBackName: 'ic_back',
            //   paymentUrl: 'https://sandbox.vnpayment.vn/testsdk',
            //   scheme: 'sampleapp',
            //   tmn_code: 'FAHASA03',
            // })
            // VnpayMerchant.show({
            //   iconBackName: 'ic_back',
            //   paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_Command=pay&vnp_CreateDate=20210225130220&vnp_CurrCode=VND&vnp_Locale=vn&vnp_OrderInfo=TEST%20BAEMIN%20ORDER&vnp_TmnCode=BAEMIN01&vnp_TxnRef=130220&vnp_Version=2.0.0&vnp_SecureHashType=SHA256&vnp_SecureHash=c7d9dedc25b304c961bd9a5c6ae21cb604700193ecb6b67ed871c1d084a462f4',
            //   scheme: 'swing',
            //   tmn_code: 'BAEMIN01',
            //   title: 'payment'
            // })
            // VnpayMerchant.show({
            //   iconBackName: 'ic_back',
            //   // paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_BankCode=MBAPP&vnp_Command=pay&vnp_CreateDate=20210225130220&vnp_CurrCode=VND&vnp_Locale=vn&vnp_OrderInfo=TEST%20BAEMIN%20ORDER&vnp_TmnCode=BAEMIN01&vnp_TxnRef=130220&vnp_Version=2.0.0&vnp_SecureHashType=SHA256&vnp_SecureHash=129664d02f0852765c8ade75b3fcca644bd0bfb26ceeb64b576e672c17f2cba1',
            //   paymentUrl: 'https://sandbox.vnpayment.vn/testsdk/',
            //   scheme: 'swing',
            //   tmn_code: 'BAEMIN01',
            //   title: 'tittlelelelel',
            //   beginColor: '#ffffff',
            //   endColor: '#ffffff', //6 ký tự.
            //   titleColor: '#000000'
            // })

            // VnpayMerchant.show({
            //   isSandbox: true,
            //   paymentUrl: 'https://sandbox.vnpayment.vn/testsdk',
            //   tmn_code: 'FAHASA03',
            //   backAlert: 'Bạn có chắc chắn trở lại ko?',
            //   title: 'VNPAY',
            //   iconBackName: 'ic_close',
            //   beginColor: 'ffffff',
            //   endColor: 'ffffff',
            //   titleColor: '000000',
            //   scheme: 'swing'
            // });

            VnpayMerchant.show({
              "isSandbox": true,
              "scheme": "vn.abahaglobal",
              "title": "Thanh toán VNPAY",
              "titleColor": "#333333",
              "beginColor": "#ffffff",
              "endColor": "#ffffff",
              "iconBackName": "close",
              "tmn_code": "GOGREEN1",
              "paymentUrl": "http://testproduct2851.abaha.click/payment/order/916?token=eyJhcHBfa2V5IjoicGF5bWVudHNlcnZpY2VrZXkiLCJkZWxpdmVyeV91bml0Ijoidm5wYXkiLCJ0eG5faWQiOiI5MTYifQ=="
            })

            setText('Sdk opened')
          }}>
          <Text style={{ color: COLOR.white }}
          >
            {text}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  slideContainer: {
    height: 200,
    overflow: 'hidden',
    marginBottom: 20,
  },
  slideImage: {
    width: Dimensions.get('window').width,
    height: 200,
  },
  text: {
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
});

export default HomeScreen;
