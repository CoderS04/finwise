import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration (401 responses)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 Unauthorized (expired or invalid token)
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem("token")
      localStorage.removeItem("has_accounts")
      localStorage.removeItem("first_login_no_accounts")
      
      // Redirect to login page
      window.location.href = "/"
      
      // Return a rejection so the component knows about the error
      return Promise.reject(
        new Error("Session expired. Please login again.")
      )
    }
    
    // For other errors, just reject normally
    return Promise.reject(error)
  }
)

export default api
