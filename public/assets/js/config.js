// Configuración central de la aplicación - API en producción
const API_BASE_URL = "https://hexodus-backend.vercel.app"

export const API_ENDPOINTS = {
  // Autenticación
  login: `${API_BASE_URL}/api/auth/signin`,
  register: `${API_BASE_URL}/api/auth/signup`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  me: `${API_BASE_URL}/api/auth/me`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  
  // Gestión de entidades
  usuarios: `${API_BASE_URL}/api/auth/users`,  // Ahora apunta al endpoint correcto
  socios: `${API_BASE_URL}/api/socios`,
  products: `${API_BASE_URL}/api/products`,
  sales: `${API_BASE_URL}/api/sales`,
  inventory: `${API_BASE_URL}/api/inventory`,
  roles: `${API_BASE_URL}/api/roles`,
  memberships: `${API_BASE_URL}/api/memberships`,
  movements: `${API_BASE_URL}/api/movements`,
  reports: `${API_BASE_URL}/api/reports`
}

const AuthStorage = {
  saveToken: (token) => localStorage.setItem("auth_token", token),
  getToken: () => localStorage.getItem("auth_token"),
  removeToken: () => localStorage.removeItem("auth_token"),

  saveUser: (user) => localStorage.setItem("current_user", JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem("current_user")
    if (!user || user === "undefined" || user === "null") {
      return null
    }
    try {
      return JSON.parse(user)
    } catch (error) {
      console.error("Error parsing user:", error)
      return null
    }
  },
  removeUser: () => localStorage.removeItem("current_user"),

  isAuthenticated: () => {
    const token = AuthStorage.getToken()
    const user = AuthStorage.getUser()
    return !!(token && user)
  },

  clearAll: () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
  }
}

const AlertConfig = {
  showSuccess: async (title, message) => {
    if (typeof Swal === 'undefined') {
      console.error("[v0] SweetAlert2 no está cargado")
      alert(title + ": " + message)
      return
    }
    return Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      showConfirmButton: true,
      confirmButtonText: 'CONTINUAR',
      allowOutsideClick: false,
      confirmButtonColor: '#00DA68',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm'
      }
    })
  },
  
  showError: async (title, message) => {
    if (typeof Swal === 'undefined') {
      console.error("[v0] SweetAlert2 no está cargado")
      alert(title + ": " + message)
      return
    }
    return Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'ENTENDIDO',
      allowOutsideClick: false,
      confirmButtonColor: '#FF3D3D',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm'
      }
    })
  },

  showConfirm: async (title, message) => {
    if (typeof Swal === 'undefined') {
      console.error("[v0] SweetAlert2 no está cargado")
      return { isConfirmed: confirm(title + "\n" + message) }
    }
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FF3D3D',
      cancelButtonColor: '#6B7280',
      allowOutsideClick: false
    })
  }
}

export { API_BASE_URL, AuthStorage, AlertConfig }