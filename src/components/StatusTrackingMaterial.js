import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const trackingSteps = [
  {id: '0', label: 'Chờ xử lý'},
  {id: '1', label: 'Đang xử lý'},
  {id: '6', label: 'Đang giao hàng'},
  {id: '9', label: 'Đã giao hàng'},
  {id: '10', label: 'Đã hoàn thành'},
];

const StatusTrackingMaterial = ({currentStatus}) => {
  const renderItem = ({item, index}) => {
    const currentIndex = trackingSteps.findIndex(s => s.id === currentStatus);
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;
    const isLast = index === trackingSteps.length - 1;
  
    // Determine if the line above should be green
    const isLineAboveGreen = index !== 0 && (index - 1 < currentIndex);

    // Determine if the line below should be green
    const isLineBelowGreen = isCompleted;

    // Determine if the dot should be green (completed) or blue (current) or gray (pending)
    const dotStyle = [
      styles.dot,
      isCompleted ? styles.completed : isCurrent ? styles.current : styles.pending,
    ];

    // Override dot style to green if the current status is the last step (completed)
    if (isCurrent && currentStatus === '10') {
      dotStyle[1] = styles.completed;
          }

    // Determine if the label should be green (completed) or blue (current) or gray (pending)
    const labelStyle = [
      styles.labelText,
      isCompleted ? styles.completedLabel : isCurrent ? styles.currentLabel : styles.pendingLabel,
    ];

    // Override label style to green if the current status is the last step (completed)
    if (isCurrent && currentStatus === '10') {
      labelStyle[1] = styles.completedLabel;
    }

          return (
      <View style={styles.stepContainer}>
        {/* Icon and vertical line */}
        <View style={styles.iconColumn}>
          <View style={styles.iconWithLine}>
            {/* Line trên nếu không phải item đầu tiên */}
            {index !== 0 && (
              <View style={[styles.lineAbove, { backgroundColor: isLineAboveGreen ? '#4CAF50' : '#ccc' }]} />
            )}

            {/* Dot */}
            <View style={dotStyle}>
              <Icon name="check" size={14} color="#fff" />
              </View>

            {/* Line dưới nếu không phải item cuối */}
            {!isLast && (
              <View style={[styles.lineBelow, { backgroundColor: isLineBelowGreen ? '#4CAF50' : '#ccc' }]} />
              )}
            </View>
      </View>

        {/* Label */}
        <Text style={labelStyle}>
          {item.label}
                </Text>
              </View>
            );
  };
          
          return (
    <View style={styles.container}>
      <FlatList
        data={trackingSteps}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  completed: {
    backgroundColor: '#4CAF50',
  },
  current: {
    backgroundColor: '#3498DB',
  },
  pending: {
    backgroundColor: '#BDBDBD',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ccc',
  },
  labelText: {
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 34,
  },
  completedLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  currentLabel: {
    color: '#3498DB',
    fontWeight: '600',
  },
  pendingLabel: {
    color: '#BDBDBD',
  },
  iconWithLine: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 40,
  },

  lineAbove: {
    position: 'absolute',
    top: -40,
    height: 40,
    width: 2,
    backgroundColor: '#4CAF50',
    zIndex: 0,
  },

  lineBelow: {
    position: 'absolute',
    top: 24,
    height: 50,
    width: 2,
    backgroundColor: '#4CAF50',
    zIndex: 0,
  },
});

export default StatusTrackingMaterial;
