import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import StepIndicator from '@runonflux/react-native-step-indicator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Define the standard successful flow statuses and their display text
const statusFlow = [
  { status: 'Pending', label: 'Chờ xử lý', note: 'Đơn hàng chờ thanh toán' },
  { status: 'PaymentSuccess', label: 'Thanh toán thành công', note: 'Thanh toán thành công' },
  { status: 'Processing', label: 'Đang xử lý', note: 'Cửa hàng đang chuẩn bị hàng' },
  { status: 'PickedPackageAndDelivery', label: 'Đã lấy hàng & đang giao', note: 'Đơn hàng đang được vận chuyển' },
  { status: 'DeliveredSuccessfully', label: 'Đã giao hàng thành công', note: 'Đơn hàng đã đến tay bạn' },
  { status: 'CompleteOrder', label: 'Hoàn thành đơn hàng', note: 'Đơn hàng đã hoàn thành' },
];

// Define failure/cancellation statuses
const terminalFailureStatuses = ['DeliveryFail', 'ReDelivery', 'OrderCancelled'];
const terminalFailureLabels = {
    'DeliveryFail': 'Giao hàng thất bại',
    'ReDelivery': 'Giao lại',
    'OrderCancelled': 'Đơn hàng đã bị hủy'
};

const baseCustomStyles = {
    stepIndicatorSize: 25,
    currentStepIndicatorSize: 30,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 3,
    stepStrokeWidth: 0, // Hide default stroke if using custom background
    separatorStrokeFinishedWidth: 3,

    // Colors match the indicator background colors
    stepStrokeUnFinishedColor: '#bdc3c7',
    separatorUnFinishedColor: '#bdc3c7',
    stepIndicatorUnFinishedColor: '#bdc3c7',
    stepStrokeFinishedColor: '#27ae60',
    separatorFinishedColor: '#27ae60',
    stepIndicatorFinishedColor: '#27ae60',
    stepStrokeCurrentColor: '#007AFF',
    stepIndicatorCurrentColor: '#007AFF',
    currentStepLabelColor: '#007AFF',

    // Hide default number labels inside indicators
    stepIndicatorLabelFontSize: 0,
    currentStepIndicatorLabelFontSize: 0,
    stepIndicatorLabelUnFinishedColor: 'transparent',
    stepIndicatorLabelFinishedColor: 'transparent',
    stepIndicatorLabelCurrentColor: 'transparent',

    labelColor: '#999999',
    labelSize: 13,
    labelAlign: 'flex-start',
};

const StatusTrackingNoCustom = ({ currentStatus }) => {
    const [currentPosition, setCurrentPosition] = useState(0);
    const [displayLabels, setDisplayLabels] = useState([]);
    const [isFailedOrCancelled, setIsFailedOrCancelled] = useState(false);
    const [currentStatusLabel, setCurrentStatusLabel] = useState('');

    useEffect(() => {
        let position = -1;
        let failed = false;
        let statusLabel = '';
        const normalizedCurrentStatus = currentStatus; // Use the status key directly

        // Check if the status is a terminal failure/cancelled state
        if (terminalFailureStatuses.includes(normalizedCurrentStatus)) {
            failed = true;
            // Find where in the normal flow it failed (approximate)
            const likelyFailurePoint = normalizedCurrentStatus === 'DeliveryFail' || normalizedCurrentStatus === 'ReDelivery' 
                                      ? 'PickedPackageAndDelivery' 
                                      : 'Processing'; 
            position = statusFlow.findIndex(item => item.status === likelyFailurePoint);
            if (position === -1) position = 2; // Default to after processing
            statusLabel = terminalFailureLabels[normalizedCurrentStatus]; // Get specific label
        } else {
            // Find the index in the standard flow
            position = statusFlow.findIndex(item => item.status === normalizedCurrentStatus);
            if (position !== -1) {
                statusLabel = statusFlow[position].label;
            }
        }

        if (position === -1) {
            console.warn(`Status "${normalizedCurrentStatus}" not found in defined flow.`);
            position = 0; // Default to first step
            statusLabel = normalizedCurrentStatus; // Display raw status
        }

        setCurrentPosition(position);
        setDisplayLabels(statusFlow.map(item => item.label)); 
        setIsFailedOrCancelled(failed);
        setCurrentStatusLabel(statusLabel);

    }, [currentStatus]);

    // Dynamic styles based on state
    const getDynamicStyles = () => {
        let currentStepColor = '#007AFF'; // Default blue for current
        if (isFailedOrCancelled) {
            currentStepColor = terminalFailureLabels[currentStatus] === 'Giao lại' ? '#FF9500' : '#e74c3c'; // Orange for ReDelivery, Red for others
        }

        return {
            ...baseCustomStyles,
            // Override current step colors based on failure state
            stepStrokeCurrentColor: currentStepColor,        
            stepIndicatorCurrentColor: currentStepColor,   
            currentStepLabelColor: currentStepColor,       
             // Keep finished steps green
             stepStrokeFinishedColor: '#27ae60',         
             separatorFinishedColor: '#27ae60',        
             stepIndicatorFinishedColor: '#27ae60',
             stepIndicatorLabelFinishedColor: '#ffffff',
             // Keep unfinished steps grey
             stepStrokeUnFinishedColor: '#bdc3c7',      
             separatorUnFinishedColor: '#bdc3c7',     
             stepIndicatorUnFinishedColor: '#bdc3c7',
             stepIndicatorLabelUnFinishedColor: '#ffffff',
        };
        
    };

    const renderLabel = ({ position, label }) => {
        const isCurrentStep = position === currentPosition;
        let labelColor = baseCustomStyles.labelColor;
        let fontWeight = 'normal';
        let note = statusFlow[position]?.note || '';
        let displayLabel = label; // Standard flow label

        if (isCurrentStep) {
            labelColor = isFailedOrCancelled ? '#e74c3c' : baseCustomStyles.currentStepLabelColor;
            fontWeight = 'bold';
            // Use the specific label for the current actual status, even if it's a failure state
            displayLabel = currentStatusLabel || label;
        } else if (position < currentPosition) {
            labelColor = '#27ae60'; // Finished steps text color
        }

        return (
            <View style={styles.labelContainer}>
                <Text style={[styles.labelText, { color: labelColor, fontWeight }]}>
                    {displayLabel}
                </Text>
                {note && position <= currentPosition && (
                    <Text style={[styles.noteText, { color: labelColor }]}>
                        {note}
                    </Text>
                )}
            </View>
        );
    };

    // Render custom icons inside the step indicator
    const renderStepIndicator = ({ position, stepStatus }) => {
        let iconName = 'circle-outline';
        let iconColor = '#ffffff'; // Default white icon
        let backgroundColor = baseCustomStyles.stepIndicatorUnFinishedColor;
        let iconSize = 15;

        switch (stepStatus) {
            case 'current':
                if (isFailedOrCancelled) {
                    // Specific icons/colors for failure states
                    if (terminalFailureLabels[currentStatus] === 'Giao lại') {
                        backgroundColor = '#FF9500'; // Orange
                        iconName = 'truck-fast-outline'; 
                    } else if (terminalFailureLabels[currentStatus] === 'Đơn hàng đã bị hủy') {
                         backgroundColor = '#e74c3c'; // Red
                         iconName = 'cancel';
                    } else { // DeliveryFail
                        backgroundColor = '#e74c3c'; // Red
                        iconName = 'alert-circle-outline';
                    }
                } else {
                    backgroundColor = baseCustomStyles.stepIndicatorCurrentColor; // Blue for normal current
                    iconName = 'radiobox-marked';
                }
                break;
            case 'finished':
                backgroundColor = baseCustomStyles.stepIndicatorFinishedColor; // Green
                iconName = 'check'; 
                break;
            case 'unfinished':
                 backgroundColor = baseCustomStyles.stepIndicatorUnFinishedColor; // Grey
                 iconName = 'circle-outline'; 
                break;
        }

        return (
            <View style={[styles.stepIndicator, { backgroundColor }]}>
                <Icon name={iconName} size={iconSize} color={iconColor} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.stepIndicatorContainer}>
                <StepIndicator
                    customStyles={getDynamicStyles()}
                    currentPosition={currentPosition}
                    labels={displayLabels}
                    direction="vertical"
                    renderLabel={renderLabel}
                    renderStepIndicator={renderStepIndicator}
                    stepCount={statusFlow.length}
                />
            </View>
        </View>
    );
}

export default StatusTrackingNoCustom;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingVertical: 10, // Reduced vertical padding
        paddingHorizontal: 5, // Reduced horizontal padding
    },
    stepIndicatorContainer: {
        // No specific style needed here unless adjusting margin
    },
    labelContainer: {
        marginLeft: 15, // More space from indicator
        marginTop: 5, // Align better vertically
        marginBottom: 25, // More space between steps
    },
    labelText: {
        fontSize: 15,
        marginBottom: 5,
        fontWeight: '500',
        lineHeight: 20,
    },
    noteText: {
        fontSize: 13,
        color: '#6c757d', // Softer note color
        lineHeight: 18,
    },
    // Removed dateText styles as date is not part of the flow data now
    // Removed nextButton styles
    stepIndicator: {
        width: 25, 
        height: 25,
        borderRadius: 12.5, // Make it a circle
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 