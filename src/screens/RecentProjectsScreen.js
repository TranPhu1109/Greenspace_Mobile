import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const RecentProjectsScreen = () => {
  const recentProjects = [
    // Sample data structure - to be populated with real data
    {
      id: '1',
      name: 'Project 1',
      lastModified: '2023-12-01',
      status: 'In Progress'
    },
    {
      id: '2',
      name: 'Project 2', 
      lastModified: '2023-11-28',
      status: 'Completed'
    }
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => {
        
      }}
    >
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectDetails}>Last modified: {item.lastModified}</Text>
      <Text style={styles.projectStatus}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Projects</Text>
      <FlatList
        data={recentProjects}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  listContainer: {
    paddingBottom: 16
  },
  projectCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  projectDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  projectStatus: {
    fontSize: 14,
    color: '#666'
  }
});

export default RecentProjectsScreen;
