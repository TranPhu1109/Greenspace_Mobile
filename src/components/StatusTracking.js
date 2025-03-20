import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import StepIndicator from '@runonflux/react-native-step-indicator';
import statusData from '../data/statusData';

const { width } = Dimensions.get('window');

const labels = statusData.data.map(item => item.status);

// Define statuses that should be shown in green
const successStatuses = [
    "Payment design successfull",
    "Delivered successfully",
    "Order completed"
];

const customStyles = {
    stepIndicatorSize: 20,
    currentStepIndicatorSize: 20,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 2,
    stepStrokeCurrentColor: '#4CAF50', // Green for current step
    stepStrokeWidth: 2,
    stepStrokeFinishedColor: '#666666', // Gray for finished steps
    stepStrokeUnFinishedColor: '#666666', // Gray for unfinished steps
    separatorFinishedColor: '#666666', // Gray for finished separators
    separatorUnFinishedColor: '#666666', // Gray for unfinished separators
    stepIndicatorFinishedColor: '#ffffff',
    stepIndicatorUnFinishedColor: '#ffffff',
    stepIndicatorCurrentColor: '#ffffff',
    stepIndicatorLabelFontSize: 12,
    currentStepIndicatorLabelFontSize: 12,
    stepIndicatorLabelCurrentColor: '#4CAF50', // Green for current step number
    stepIndicatorLabelFinishedColor: '#666666', // Gray for finished step numbers
    stepIndicatorLabelUnFinishedColor: '#666666', // Gray for unfinished step numbers
    labelColor: '#666666',
    labelSize: 13,
    currentStepLabelColor: '#4CAF50', // Green for current step label
    labelAlign: 'flex-start',
    labelStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#666666',
    }
}

const StatusTracking = ({ currentStatus = 'Pending', onStatusChange }) => {
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

    const getStatusColor = (status, isCurrentStep) => {
        if (successStatuses.includes(status)) {
            return '#4CAF50'; // Green color for success statuses
        }
        if (status === 'Order cancelled') {
            return '#FF3B30'; // Red color for cancelled status
        }
        if (status === 'Delivery fail') {
            return '#FF9500'; // Orange color for failed delivery
        }
        return isCurrentStep ? '#000000' : '#666666';
    };

    const renderLabel = ({ position }) => {
        const isCurrentStep = position === currentPosition;

        return (
            <View style={styles.labelContainer}>
                <Text style={[
                    styles.labelText,
                    isCurrentStep ? styles.currentLabelText : styles.pastLabelText
                ]}>
                    {statusData.data[position].status}
                </Text>
                {statusData.data[position].note && (
                    <Text style={[
                        styles.noteText,
                        isCurrentStep ? styles.currentNoteText : styles.pastNoteText
                    ]}>
                        {statusData.data[position].note}
                    </Text>
                )}
                {statusData.data[position].datetime && (
                    <Text style={[
                        styles.dateText,
                        isCurrentStep ? styles.currentDateText : styles.pastDateText
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
                    customStyles={customStyles}
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

export default StatusTracking;

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
    },
    currentLabelText: {
        fontWeight: 'bold',
        color: '#4CAF50', // Green for current status
    },
    pastLabelText: {
        color: '#666666', // Gray for other statuses
    },
    noteText: {
        fontSize: 12,
        marginBottom: 2,
    },
    currentNoteText: {
        color: '#4CAF50', // Green for current status note
    },
    pastNoteText: {
        color: '#666666', // Gray for other status notes
    },
    dateText: {
        fontSize: 12,
    },
    currentDateText: {
        color: '#4CAF50', // Green for current status date
    },
    pastDateText: {
        color: '#666666', // Gray for other status dates
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


