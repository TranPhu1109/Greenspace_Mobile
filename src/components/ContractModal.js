import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Text, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const ContractModal = ({ visible, pdfUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Create a URL that uses Google Docs viewer to display the PDF
  const getViewerUrl = (url) => {
    if (!url) return null;
    
    // Handle both http and https URLs properly
    let encodedUrl = encodeURIComponent(url);
    return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };
  
  const handleLoadError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.contractModalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hợp đồng thiết kế</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Icon name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {pdfUrl ? (
            <>
              <WebView
                source={{ uri: getViewerUrl(pdfUrl) }}
                style={styles.contractWebView}
                onLoad={handleLoadEnd}
                onError={handleLoadError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
              />
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Icon name="file-alert-outline" size={60} color="#FF3B30" />
              <Text style={styles.errorText}>Không thể tải hợp đồng. Vui lòng thử lại sau.</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contractModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  contractWebView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ContractModal;
