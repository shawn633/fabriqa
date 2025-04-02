import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
// Adjust path to your Zustand auth store
import { toast } from '@/hooks/use-toast'

// Assuming use-toast is globally accessible

// 1. Get Base URL from Environment Variables
// Ensure you have VITE_API_URL (or REACT_APP_API_URL) set in your .env files
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api' // Fallback for safety

// 2. Create the Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add other common headers if needed
  },
  // timeout: 10000, // Optional: Set a request timeout
})

// 3. Request Interceptor (Attaching Auth Token)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token synchronously from Zustand state
    const token = useAuthStore.getState().auth.token // Adjust based on your store structure

    if (token) {
      // Ensure headers object exists
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config // IMPORTANT: Return the config
  },
  (error) => {
    // Handle request setup errors (less common)
    console.error('Axios Request Error:', error)
    return Promise.reject(error)
  }
)

// 4. Response Interceptor (Handling Responses and Errors)
// We will keep this relatively simple initially, letting React Query handle most UI-related errors.
// The primary use case here could be token refreshing.

// --- Optional: Token Refresh Logic ---
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    // You could potentially transform data here, but often better done in API service functions
    return response // IMPORTANT: Return the response
  },
  async (error: AxiosError) => {
    // Any status codes outside the range of 2xx cause this function to trigger
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // --- Handle Token Expiry and Refresh ---
    // Check for 401 Unauthorized AND ensure it's not a retry request already
    // AND ensure it's not the refresh token endpoint itself that failed with 401!
    const refreshTokenUrl = '/auth/refresh' // IMPORTANT: Adjust to your actual refresh token endpoint
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== refreshTokenUrl // Avoid infinite loop
    ) {
      if (isRefreshing) {
        // If refresh is already in progress, queue the original request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + newToken
            }
            return apiClient(originalRequest) // Retry with new token
          })
          .catch((err) => {
            return Promise.reject(err) // Propagate error if queue processing fails
          })
      }

      originalRequest._retry = true // Mark as retry
      isRefreshing = true

      const refreshToken = useAuthStore.getState().auth.refreshToken // Get refresh token

      if (!refreshToken) {
        console.error('No refresh token available for refresh attempt.')
        useAuthStore.getState().auth.reset() // Logout if no refresh token
        // Redirect logic is handled by QueryCache onError, no need to duplicate here usually
        isRefreshing = false // Reset flag
        processQueue(error, null) // Reject queued requests
        return Promise.reject(error)
      }

      try {
        console.log('Attempting token refresh...')
        // Use a separate call or ensure this call doesn't trigger the interceptor loop
        const refreshResponse = await axios.post<{
          accessToken: string
          refreshToken?: string
        }>(
          `${API_BASE_URL}${refreshTokenUrl}`, // Use full URL or configure separate instance if needed
          { refreshToken }
          // Avoid default interceptors if using the same instance for refresh
          // { headers: { 'X-Skip-Interceptor': 'true' } } // Example custom header to skip interceptor
        )

        const { accessToken, refreshToken: newRefreshToken } =
          refreshResponse.data

        // Update store with new tokens
        useAuthStore.getState().auth.setTokens(accessToken, newRefreshToken) // Adjust method name

        // Update the original request header
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        }

        processQueue(null, accessToken) // Process queue with new token
        console.log('Token refresh successful, retrying original request.')
        return apiClient(originalRequest) // Retry the original request with the new token
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError)
        processQueue(refreshError, null) // Reject queue on refresh failure
        useAuthStore.getState().auth.reset() // Logout on refresh failure
        // Redirect logic is handled by QueryCache onError
        return Promise.reject(refreshError) // Reject with the refresh error
      } finally {
        isRefreshing = false // Reset flag IMPORTANTLY in finally block
      }
    } // End of 401 refresh logic

    // --- Other Error Handling ---
    // For other errors (400, 403, 404, 500 etc.),
    // React Query's onError handlers (global and specific) are generally better suited
    // for UI feedback (toasts, redirects) because they understand the data fetching context.
    // You *could* add minimal logging here if desired.

    // console.error('Axios Response Error:', error.response?.status, error.message);

    // IMPORTANT: Always reject the promise so the error propagates to React Query
    return Promise.reject(error)
  }
)

export default apiClient
