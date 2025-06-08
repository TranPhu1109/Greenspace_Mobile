import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#F0F7F4', // Light sage background
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50', // Forest green
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C5530', // Forest green
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2C5530',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F3E8', // Light green border
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C5530', // Forest green
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    backgroundColor: '#F8FAF8', // Very light green
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2C5530', // Forest green
    marginBottom: 16,
  },
  addressSection: {
    marginTop: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeButton: {
    color: '#4CAF50', // Material green
    fontSize: 14,
    fontWeight: '600',
  },
  addressDisplay: {
    backgroundColor: '#F1F8F1', // Light green background
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
  },
  addressText: {
    fontSize: 15,
    color: '#2C5530', // Forest green
    lineHeight: 22,
  },
  spaceInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spaceInputGroup: {
    flex: 1,
  },
  spaceInputDivider: {
    width: 16,
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
    borderRadius: 12,
    backgroundColor: '#F8FAF8', // Very light green
    height: 48,
    paddingHorizontal: 16,
  },
  spaceInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C5530', // Forest green
    height: '100%',
    padding: 0,
  },
  unitText: {
    fontSize: 15,
    color: '#4CAF50', // Material green
    marginLeft: 4,
    fontWeight: '500',
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageCountText: {
    fontSize: 14,
    color: '#4CAF50', // Material green
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9', // Light green background
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7', // Medium green border
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2C5530', // Forest green
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imagePreview: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
    backgroundColor: '#F8FAF8', // Very light green
  },
  submitButton: {
    backgroundColor: '#4CAF50', // Material green
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7', // Lighter green for disabled state
    shadowOpacity: 0,
    elevation: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 85, 48, 0.6)', // Forest green overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#2C5530',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3E8', // Light green border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C5530', // Forest green
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#2C5530', // Forest green
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F1F8F1', // Light green background
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
  },
  modalLoginButton: {
    backgroundColor: '#4CAF50', // Material green
  },
  modalCancelButtonText: {
    color: '#2C5530', // Forest green
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  modalLoginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#2C5530',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#2C5530', // Forest green
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F8F1', // Light green background
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
  },
  confirmButton: {
    backgroundColor: '#4CAF50', // Material green
  },
  cancelButtonText: {
    color: '#2C5530', // Forest green
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#2C5530',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C5530', // Forest green
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#2C5530', // Forest green
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  successButton: {
    backgroundColor: '#4CAF50', // Material green
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewOrderButton: {
    backgroundColor: '#E8F5E9', // Light green background
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7', // Medium green border
  },
  viewOrderButtonText: {
    color: '#2C5530', // Forest green
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(44, 85, 48, 0.6)', // Forest green overlay
    borderRadius: 30,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  addressList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9', // Light green border
    shadowColor: '#2C5530',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  addressItemContent: {
    flex: 1,
    marginRight: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5530', // Forest green
    marginRight: 8,
  },
  addressPhone: {
    fontSize: 14,
    color: '#4CAF50', // Material green
    marginRight: 8,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C8E6C9', // Light green border
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#4CAF50', // Material green
    borderColor: '#4CAF50',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50', // Material green
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addNewAddressButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50', // Material green
    borderRadius: 14,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addNewAddressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingIndicator: {
    padding: 40,
  },
  noAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 200,
  },
  noAddressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C5530', // Forest green
    marginTop: 16,
    textAlign: 'center',
  },
  noAddressSubText: {
    fontSize: 14,
    color: '#4CAF50', // Material green
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F', // Material red
    fontSize: 14,
    marginTop: 0,
    marginBottom: 16,
    marginLeft: 0,
  },
  inputError: {
    borderColor: '#D32F2F', // Material red
  },
  newAddressModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    paddingBottom: 20,
  },
  newAddressForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C5530', // Forest green
    marginBottom: 8,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3E8',
  },
  guideTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAF8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3E8',
  },
  guideText: {
    fontSize: 15,
    color: '#39453c',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 16,
    color: '#39453c', // Bright blue color
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  modalOverlay1: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer1: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 