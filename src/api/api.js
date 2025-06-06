// API Configuration
const API_CONFIG = {
  development: 'http://10.0.2.2:8080/api',    // Android Emulator
  staging: 'http://192.168.1.2:8080/api',     // Android Real Device
  production: 'https://greenspace-webapi-container-app.graymushroom-37ee5453.southeastasia.azurecontainerapps.io/api',     
};

// Current environment - change this to switch between environments
const CURRENT_ENV = 'production';

// Get the current API URL based on environment
const API_URL = API_CONFIG[CURRENT_ENV];

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  let url = `${API_URL}${endpoint}`;

  // Handle query parameters for GET requests
  if (options.method === 'GET' && options.params) {
    const queryParams = new URLSearchParams(options.params).toString();
    if (queryParams) {
      url = `${url}?${queryParams}`;
    }
    // Remove params from options as they are now in the URL
    delete options.params;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Get the response text first
    const responseText = await response.text();

    
    // If response is empty, return null
    if (!responseText) {
      return null;
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, return the plain text response
      data = responseText;
    }

    // If the response is not ok (status not in 200-299 range)
    if (!response.ok) {
      throw {
        status: response.status,
        statusText: response.statusText,
        data: data
      };
    }

    return data;
  } catch (error) {
    // If it's already our formatted error, throw it as is
    if (error.status) {
      throw error;
    }
    
    // Otherwise, format the error
    console.error('API Error:', {
      message: error.message,
      endpoint: `${API_URL}${endpoint}`,
      options: {
        method: options.method,
        headers: options.headers,
        body: options.body ? JSON.parse(options.body) : undefined
      }
    });
    throw error;
  }
};

// Convenience methods for different HTTP operations
const api = {
  // GET request - accept options object for flexibility (headers, params, etc.)
  get: (endpoint, options = {}) => {
    return apiCall(endpoint, { // Pass the merged options object
      method: 'GET',
      ...options,
    });
  },

  // POST request
  post: (endpoint, data = {}, options = {}) => {
    return apiCall(endpoint, {
      method: 'POST',
      ...options,
      body: JSON.stringify(data)
    });
  },

  // PUT request
  put: (endpoint, data = {}, headers = {}) => {
    return apiCall(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
  },

  // PATCH request
  patch: (endpoint, data = {}, headers = {}) => {
    return apiCall(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
  },

  // DELETE request
  delete: (endpoint, headers = {}) => {
    return apiCall(endpoint, {
      method: 'DELETE',
      headers
    });
  }
};

// Export the configuration and helper functions
export { API_URL, apiCall, API_CONFIG, CURRENT_ENV, api };
