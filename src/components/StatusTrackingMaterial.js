import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Component to display the order tracking status
 * @param {Object} props
 * @param {string} props.currentStatus - Current status code of the order
 */
const StatusTrackingMaterial = ({currentStatus}) => {
  // Define the tracking steps in order
  const trackingSteps = [
    {id: 0, label: 'Chờ xử lý', statusCode: '0'},
    {id: 1, label: 'Đang xử lý', statusCode: '1'},
    {id: 2, label: 'Đang giao hàng', statusCode: '6'},
    {id: 3, label: 'Đã giao hàng', statusCode: '9'},
    {id: 4, label: 'Đã hoàn thành', statusCode: '10'},
  ];

  // Convert current status to number for comparison
  const currentStatusNum = parseInt(currentStatus, 10);
  
  // Check if order is cancelled (status code 3)
  const isCancelled = currentStatus === '3';
  
  return (
    <View style={styles.container}>
      {/* Steps dots and lines */}
      <View style={styles.stepsContainer}>
        {trackingSteps.map((step, index) => {
          // For cancelled orders, the logic is different
          if (isCancelled) {
            // All steps should appear gray for cancelled orders
            const isLastStep = index === trackingSteps.length - 1;
            return (
              <View key={step.id} style={styles.stepItem}>
                {/* Step dot */}
                <View style={[styles.dot, styles.inactiveDot]}>
                  {index === 0 && <Icon name="close" size={12} color="#E74C3C" />}
                </View>

                {/* Connecting line (except for the last item) */}
                {!isLastStep && (
                  <View style={[styles.line, styles.inactiveLine]} />
                )}
              </View>
            );
          }

          // For regular orders, determine if step is completed or current
          const stepStatusNum = parseInt(step.statusCode, 10);
          const isCompleted = currentStatusNum >= stepStatusNum;
          const isCurrent = step.statusCode === currentStatus;
          const isLastStep = index === trackingSteps.length - 1;

          return (
            <View key={step.id} style={styles.stepItem}>
              {/* Step dot */}
              <View
                style={[
                  styles.dot,
                  isCompleted ? styles.completedDot : 
                  isCurrent ? styles.currentDot : styles.inactiveDot,
                ]}
              >
                {isCompleted && (
                  <Icon name="check" size={12} color="#fff" />
                )}
                {isCurrent && !isCompleted && (
                  <View style={styles.innerDot} />
                )}
              </View>

              {/* Connecting line (except for the last item) */}
              {!isLastStep && (
                <View
                  style={[
                    styles.line,
                    isCompleted ? styles.completedLine : styles.inactiveLine,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Step labels */}
      <View style={styles.labelsContainer}>
        {trackingSteps.map((step, index) => {
          // For cancelled orders, use red for the first label, gray for others
          if (isCancelled) {
            return (
              <View key={step.id} style={styles.labelWrapper}>
                <Text
                  style={[
                    styles.stepLabel,
                    index === 0 ? styles.cancelledLabel : styles.inactiveLabel,
                  ]}>
                  {index === 0 ? 'Đã hủy' : step.label}
                </Text>
              </View>
            );
          }
          
          // For regular orders, show regular statuses
          const stepStatusNum = parseInt(step.statusCode, 10);
          const isCompleted = currentStatusNum >= stepStatusNum;
          const isCurrent = step.statusCode === currentStatus;
          
          return (
            <View key={step.id} style={styles.labelWrapper}>
              <Text
                style={[
                  styles.stepLabel,
                  isCompleted ? styles.completedLabel : 
                  isCurrent ? styles.currentLabel : styles.inactiveLabel,
                ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* Show other statuses as text at the bottom */}
      {['2', '4', '5', '7', '8'].includes(currentStatus) && (
        <View style={styles.additionalStatusContainer}>
          <Icon 
            name={currentStatus === '7' ? "alert-circle" : "information-outline"} 
            size={18} 
            color={currentStatus === '7' ? "#E74C3C" : "#3498DB"} 
            style={styles.specialIcon} 
          />
          <Text style={styles.additionalStatusText}>
            {currentStatus === '2' ? 'Đã xử lý' : 
             currentStatus === '4' ? 'Hoàn tiền' :
             currentStatus === '5' ? 'Đã hoàn tiền xong' :
             currentStatus === '7' ? 'Giao hàng thất bại' :
             currentStatus === '8' ? 'Giao lại' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    minHeight: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    minWidth: 0,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#fff',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  completedDot: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  currentDot: {
    backgroundColor: '#3498DB',
    borderColor: '#2980B9',
    borderWidth: 3,
  },
  inactiveDot: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D0D0D0',
  },
  line: {
    height: 3,
    flex: 6,
    marginHorizontal: -2,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  inactiveLine: {
    backgroundColor: '#E0E0E0',
  },
  labelsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
    alignItems: 'flex-start',
  },
  labelWrapper: {
    flex: 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 0,
  },
  completedLabel: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  currentLabel: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: '#8E8E93',
  },
  cancelledLabel: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  additionalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  specialIcon: {
    marginRight: 8,
  },
  additionalStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default StatusTrackingMaterial;
