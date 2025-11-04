// Configuración central de la aplicación
const API_BASE_URL = "https://hexodus-backend.vercel.app"

const API_ENDPOINTS = {
  signin: `${API_BASE_URL}/api/auth/signin`,
  signup: `${API_BASE_URL}/api/auth/signup`,
  signout: `${API_BASE_URL}/api/auth/signout`,
  socios: `${API_BASE_URL}/api/socios`,
  ventas: `${API_BASE_URL}/api/ventas`,
  inventario: `${API_BASE_URL}/api/inventario`,
}

// Funciones de utilidad para localStorage
const AuthStorage = {
  saveToken: (token) => localStorage.setItem("auth_token", token),
  getToken: () => localStorage.getItem("auth_token"),
  removeToken: () => localStorage.removeItem("auth_token"),

  saveUser: (user) => localStorage.setItem("current_user", JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem("current_user")
    return user ? JSON.parse(user) : null
  },
  removeUser: () => localStorage.removeItem("current_user"),

  isAuthenticated: () => !!AuthStorage.getToken(),
}

export { API_BASE_URL, API_ENDPOINTS, AuthStorage }
