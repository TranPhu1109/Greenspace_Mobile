import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import StepIndicator from '@runonflux/react-native-step-indicator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Define the standard successful flow statuses and their display text
const statusFlow = [
  { status: 'pending', label: 'Chờ xử lý', note: 'Đơn hàng đã được tiếp nhận, chờ xử lý' },
  { status: 'processing', label: 'Đang xử lý', note: 'Đơn hàng đang được xử lý' },
  { status: 'installing', label: 'Đang lắp đặt', note: 'Đang tiến hành lắp đặt' },
  { status: 'doneinstalling', label: 'Hoàn thành lắp đặt', note: '                     ' },
  { status: 'successfully', label: 'Đã hoàn tất đơn hàng' },
];

// Define failure/cancellation statuses
const terminalFailureStatuses = ['reinstall', 'ordercancelled'];
const terminalFailureLabels = {
    'reinstall': 'Yêu cầu lắp đặt lại',
    'ordercancelled': 'Đơn hàng đã bị hủy'
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
        const normalizedCurrentStatus = currentStatus?.toLowerCase(); // Use the status key directly in lowercase

        // Check if the status is a terminal failure/cancelled state (using lower case for consistency)
        if (terminalFailureStatuses.includes(normalizedCurrentStatus)) {
             failed = true;
             // Find where in the normal flow it failed (approximate)
             if (normalizedCurrentStatus === 'reinstall') {
               position = statusFlow.findIndex(item => item.status === 'doneinstalling');
               if (position === -1) position = statusFlow.length - 1; // Fallback to last step if doneinstalling not found
               statusLabel = terminalFailureLabels.reinstall; // Get specific label
             } else if (normalizedCurrentStatus === 'ordercancelled') {
               // For OrderCancelled, position it after 'Pending' or 'Processing'
                position = statusFlow.findIndex(item => item.status === 'processing');
                if (position === -1) position = 1; // Fallback to after pending
                statusLabel = terminalFailureLabels.ordercancelled; // Get specific label
             } else {
                 // Handle other potential terminal states if needed
                  position = 0; // Default to first step for unknown failures
                  statusLabel = normalizedCurrentStatus; // Display raw status
             }
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

         setCurrentPosition(position > -1 ? position : 0); // Ensure position is not -1
         setDisplayLabels(statusFlow.map(item => item.label));
         setIsFailedOrCancelled(failed);
         setCurrentStatusLabel(statusLabel);

     }, [currentStatus]);

     // Dynamic styles based on state
     const getDynamicStyles = () => {
         let currentStepColor = '#007AFF'; // Default blue for current
         if (isFailedOrCancelled) {
             // Use normalized status for color determination
             const normalizedCurrentStatus = currentStatus?.toLowerCase();
             if (normalizedCurrentStatus === 'reinstall') {
                 currentStepColor = '#FF9500'; // Orange for ReInstall
             } else if (normalizedCurrentStatus === 'ordercancelled') {
                 currentStepColor = '#e74c3c'; // Red for OrderCancelled
             } else { // Default for unexpected failed states
                 currentStepColor = '#e74c3c'; // Red
             }
         } else if (currentStatus?.toLowerCase() === 'successfully') {
             currentStepColor = '#27ae60'; // Green for successfully status
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

        // Special case for 'successfully' status
        if (currentStatus?.toLowerCase() === 'successfully' && position === statusFlow.length - 1) {
            labelColor = '#27ae60'; // Green color for text
            fontWeight = 'bold';
            displayLabel = currentStatusLabel || label;
        } else if (isCurrentStep) {
            labelColor = isFailedOrCancelled ? getDynamicStyles().currentStepLabelColor : baseCustomStyles.currentStepLabelColor;
            fontWeight = 'bold';
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

        // Special case for 'successfully' status
        if (currentStatus?.toLowerCase() === 'successfully' && position === statusFlow.length - 1) {
            backgroundColor = '#27ae60'; // Green background
            iconName = 'check';
            return (
                <View style={[styles.stepIndicator, { backgroundColor }]}>
                    <Icon name={iconName} size={iconSize} color={iconColor} />
                </View>
            );
        }

        switch (stepStatus) {
            case 'current':
                if (isFailedOrCancelled) {
                    // Specific icons/colors for failure states
                    const normalizedCurrentStatus = currentStatus?.toLowerCase();
                    if (normalizedCurrentStatus === 'reinstall') {
                          backgroundColor = '#FF9500'; // Orange
                          iconName = 'refresh'; // Use refresh icon for reinstall
                    } else if (normalizedCurrentStatus === 'ordercancelled') {
                          backgroundColor = '#e74c3c'; // Red
                          iconName = 'cancel';
                    } else { // Default for unexpected failed states
                          backgroundColor = '#e74c3c'; // Red
                           iconName = 'alert-circle-outline';
                     }
                } else {
                    backgroundColor = getDynamicStyles().stepIndicatorCurrentColor; // Use dynamic current color
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
        marginTop: 8, // Align better vertically
        marginBottom: 20, // More space between steps
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