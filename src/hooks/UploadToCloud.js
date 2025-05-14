import axios from 'axios';

export const uploadImageToCloudinary = async (photo) => {
  const cloudName = 'dt6lcosqe'; // Cloud name của bạn
  const uploadPreset = 'unsigned_upload'; // Upload preset bạn đã tạo

  // Create a new FormData instance
  const formData = new FormData();

  // Add the file with optimization parameters
  formData.append('file', {
    uri: photo.uri,
    type: 'image/jpeg', // Force JPEG format for better compression
    name: `photo_${Date.now()}.jpg`,
  });

  // Add optimization parameters
  formData.append('upload_preset', uploadPreset);
  formData.append('quality', 'auto:good'); // Auto quality with good compression
  formData.append('fetch_format', 'auto'); // Auto format selection
  formData.append('width', '1200'); // Limit maximum width
  formData.append('crop', 'limit'); // Maintain aspect ratio
  formData.append('dpr', 'auto'); // Auto device pixel ratio

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and retry configuration
        timeout: 30000, // 30 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max file size
      }
    );

    console.log('Upload thành công:', res.data);
    return res.data.secure_url; // Đây là link ảnh bạn nhận được
  } catch (error) {
    console.error('Upload thất bại:', error.response?.data || error.message);
    throw error;
  }
};
