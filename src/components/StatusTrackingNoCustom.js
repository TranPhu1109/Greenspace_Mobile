import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import StepIndicator from '@runonflux/react-native-step-indicator';

const { width } = Dimensions.get('window');

const statusData = {
  data: [
    {
      status: "Pending",
      note: "Đơn hàng đã được đặt thành công",
      datetime: "2025-03-18 10:00:00",
    },
    {
      status: "Payment design successfull",
      note: "Payment design successfull",
      datetime: ""
    },
    {
      status: "Processing",
      note: "Processing",
      datetime: ""
    },
    {
      status: "Picked package and delivery",
      note: "Picked package and delivery",
      datetime: ""
    },
    {
      status: "Delivery fail",
      note: "Delivery fail",
      datetime: ""
    },
    {
      status: "Re-delivery",
      note: "Re-delivery",
      datetime: ""
    },
    {
      status: "Delivered successfully",
      note: "Delivered successfully",
      datetime: ""
    },
    {
      status: "Order completed",
      note: "Order completed",
      datetime: ""
    },
    {
      status: "Order cancelled",
      note: "Đơn hàng đã bị hủy",
      datetime: ""
    },
  ]
};

const labels = statusData.data.map(item => item.status);

// Define statuses that should be shown in green
const successStatuses = [
    "Payment design successfull",
    "Delivered successfully",
    "Order completed"
];

// Define statuses that should be shown in red
const failureStatuses = [
    "Delivery fail",
    "Order cancelled"
];

// Define statuses that should be shown in blue (in progress)
const inProgressStatuses = [
    "Pending",
    "Processing",
    "Picked package and delivery",
    "Re-delivery"
];

const customStyles = {
    stepIndicatorSize: 20,
    currentStepIndicatorSize: 20,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 2,
    stepStrokeCurrentColor: '#007AFF', // Blue for current step
    stepStrokeWidth: 2,
    stepStrokeFinishedColor: '#4CAF50', // Green for finished steps
    stepStrokeUnFinishedColor: '#666666', // Gray for unfinished steps
    separatorFinishedColor: '#4CAF50', // Green for finished separators
    separatorUnFinishedColor: '#666666', // Gray for unfinished separators
    stepIndicatorFinishedColor: '#ffffff',
    stepIndicatorUnFinishedColor: '#ffffff',
    stepIndicatorCurrentColor: '#ffffff',
    stepIndicatorLabelFontSize: 12,
    currentStepIndicatorLabelFontSize: 12,
    stepIndicatorLabelCurrentColor: '#007AFF', // Blue for current step number
    stepIndicatorLabelFinishedColor: '#4CAF50', // Green for finished step numbers
    stepIndicatorLabelUnFinishedColor: '#666666', // Gray for unfinished step numbers
    labelColor: '#666666',
    labelSize: 13,
    currentStepLabelColor: '#007AFF', // Blue for current step label
    labelAlign: 'flex-start',
    labelStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#666666',
    }
}

const StatusTrackingNoCustom = ({ currentStatus = 'Pending', onStatusChange }) => {
    const [currentPosition, setCurrentPosition] = useState(0);

    useEffect(() => {
        // Find the index of current status in the labels array
        const statusIndex = labels.findIndex(label => label === currentStatus);
        if (statusIndex !== -1) {
            setCurrentPosition(statusIndex);
        }
    }, [currentStatus]);

    const handleNextStatus = () => {
        if (currentPosition < labels.length - 1) {
            const nextPosition = currentPosition + 1;
            setCurrentPosition(nextPosition);
            if (onStatusChange) {
                onStatusChange(labels[nextPosition]);
            }
        }
    };

    const getStatusColor = (status, isCurrentStep, position) => {
        // Always show Payment design successfull in green
        if (status === "Payment design successfull") {
            return '#4CAF50';
        }

        // For other statuses, determine color based on position
        if (position < currentPosition) {
            return '#4CAF50'; // Green for completed steps
        } else if (position === currentPosition) {
            return '#007AFF'; // Blue for current step
        } else {
            return '#666666'; // Gray for future steps
        }
    };

    const renderLabel = ({ position }) => {
        const isCurrentStep = position === currentPosition;
        const status = statusData.data[position].status;
        const statusColor = getStatusColor(status, isCurrentStep, position);

        return (
            <View style={styles.labelContainer}>
                <Text style={[
                    styles.labelText,
                    { color: statusColor }
                ]}>
                    {status}
                </Text>
                {statusData.data[position].note && (
                    <Text style={[
                        styles.noteText,
                        { color: statusColor }
                    ]}>
                        {statusData.data[position].note}
                    </Text>
                )}
                {statusData.data[position].datetime && (
                    <Text style={[
                        styles.dateText,
                        { color: statusColor }
                    ]}>
                        {statusData.data[position].datetime}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.stepIndicatorContainer}>
                <StepIndicator
                    customStyles={{
                        ...customStyles,
                        stepStrokeFinishedColor: '#4CAF50',
                        stepStrokeCurrentColor: '#007AFF',
                        stepStrokeUnFinishedColor: '#666666',
                        separatorFinishedColor: '#4CAF50',
                        separatorUnFinishedColor: '#666666',
                        stepIndicatorLabelFinishedColor: '#4CAF50',
                        stepIndicatorLabelCurrentColor: '#007AFF',
                        stepIndicatorLabelUnFinishedColor: '#666666',
                    }}
                    currentPosition={currentPosition}
                    labels={labels}
                    direction="vertical"
                    renderLabel={renderLabel}
                    stepCount={labels.length}
                />
            </View>
            {currentPosition < labels.length - 1 && (
                <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={handleNextStatus}
                >
                    <Text style={styles.nextButtonText}>Next Status</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default StatusTrackingNoCustom;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
    },
    stepIndicatorContainer: {
        marginVertical: 10,
    },
    labelContainer: {
        marginLeft: 10,
        marginBottom: 20,
    },
    labelText: {
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '500',
    },
    noteText: {
        fontSize: 12,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    nextButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    }
}); 