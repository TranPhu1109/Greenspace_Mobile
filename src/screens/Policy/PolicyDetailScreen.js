import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../api/api';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const PolicyDetailScreen = ({ navigation, route }) => {
  const { policyId, policyName } = route.params;
  const { width } = useWindowDimensions();

  const [policyContent, setPolicyContent] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [errorPolicy, setErrorPolicy] = useState(null);

  useEffect(() => {
    const fetchPolicyDetail = async () => {
      try {
        setLoadingPolicy(true);
        const response = await api.get(`/policy/${policyId}`);
        if (response && response.document1) {
          setPolicyContent(response.document1);
          setErrorPolicy(null);
        } else {
          setPolicyContent(null);
          setErrorPolicy('Policy content not found.');
          console.error('Unexpected API response for policy detail:', response);
        }
      } catch (error) {
        setErrorPolicy('Failed to load policy content.');
        console.error('Error fetching policy detail:', error);
      } finally {
        setLoadingPolicy(false);
      }
    };

    if (policyId) {
      fetchPolicyDetail();
    } else {
      setErrorPolicy('Policy ID is missing.');
      setLoadingPolicy(false);
    }
  }, [policyId]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{policyName || 'Policy Detail'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container} removeClippedSubviews={false}>
        {loadingPolicy ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : errorPolicy ? (
          <Text style={styles.errorText}>{errorPolicy}</Text>
        ) : policyContent ? (
          <RenderHtml
            contentWidth={width}
            source={{ html: policyContent }}
          />
        ) : (
          <Text style={styles.noPolicyContentText}>No policy content available.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
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
    flex: 1, // Allow title to take available space
    textAlign: 'center', // Center the title
    marginHorizontal: 10, // Add some horizontal margin
  },
  backButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  noPolicyContentText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PolicyDetailScreen; 