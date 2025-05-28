// // utils/firebaseNotification.js
// import messaging from '@react-native-firebase/messaging';
// import { Alert } from 'react-native';
// import { NavigationContainerRefContext } from '@react-navigation/native';

// // Hàm xử lý khi có dữ liệu từ notification (dù foreground hay từ background mở app)
// const handleNotificationNavigation = (remoteMessage, navigation) => {
//   if (!remoteMessage?.data) return;

//   const { orderId, type } = remoteMessage.data;

//   if (orderId) {
//     navigation.navigate('OrderDetail', { orderId });
//   }
//   // Bạn có thể mở rộng thêm logic khác tại đây theo `type`...
// };
// const handledMessageIds = new Set();
// export const setupFCMListeners = (navigation) => {
//   // 1. Nhận noti khi đang foreground
//   const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
//     if (handledMessageIds.has(remoteMessage.messageId)) return;
//     handledMessageIds.add(remoteMessage.messageId);

//     console.log('🔥 [Foreground] FCM received:', remoteMessage);

//     Alert.alert(
//       remoteMessage.notification?.title || 'Thông báo mới',
//       remoteMessage.notification?.body || 'Bạn có thông báo mới từ hệ thống.',
//       [
//         {
//           text: 'Xem chi tiết',
//           onPress: () => handleNotificationNavigation(remoteMessage, navigation),
//         },
//         { text: 'Đóng', style: 'cancel' },
//       ]
//     );
//   });

//   // 2. Khi app mở từ background
//   messaging().onNotificationOpenedApp(remoteMessage => {
//     console.log('📬 [Background] Opened from FCM:', remoteMessage);
//     handleNotificationNavigation(remoteMessage, navigation);
//   });

//   // 3. Khi app được khởi động từ trạng thái kill (quit)
//   messaging()
//     .getInitialNotification()
//     .then(remoteMessage => {
//       if (remoteMessage) {
//         console.log('🚀 [Quit] Launch from FCM:', remoteMessage);
//         setTimeout(() => handleNotificationNavigation(remoteMessage, navigation), 500);
//       }
//     });

//   // Trả về hàm unsubscribe foreground
//   return () => unsubscribeForeground();
// };

import messaging from '@react-native-firebase/messaging';

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

// Handle foreground messages
export const setupFCMListeners = (navigation) => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Received foreground message:', remoteMessage);
    // You can show a local notification here if needed
  });

  // Handle notification open from background state
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened from background state:', remoteMessage);
    // Handle navigation based on the notification data
    if (remoteMessage.data?.screen) {
      navigation.navigate(remoteMessage.data.screen);
    }
  });

  // Handle notification open from quit state
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log('Notification caused app to open from quit state:', remoteMessage);
      // Handle navigation based on the notification data
      if (remoteMessage.data?.screen) {
        navigation.navigate(remoteMessage.data.screen);
      }
    }
  });

  return unsubscribe;
};

// Request notification permissions
export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
};

// Get FCM token
export const getFcmToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      return fcmToken;
    }
    console.log('Failed to get FCM token');
    return null;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
};
