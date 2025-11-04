import { API_ENDPOINTS, AuthStorage } from './config.js';

/**
 * Realiza login con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y sesión
 */
async function login(email, password) {
  try {
    const response = await fetch(API_ENDPOINTS.signin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión")
    }

    if (data.success && data.data) {
      const { user, session } = data.data

      // Guardar token y usuario en localStorage
      AuthStorage.saveToken(session.access_token)
      AuthStorage.saveUser(user)

      console.log("[v0] Login exitoso para usuario:", user.email)
      return { success: true, user }
    }

    throw new Error("Respuesta inválida del servidor")
  } catch (error) {
    console.error("[v0] Error en login:", error.message)
    throw error
  }
}

/**
 * Realiza registro de nuevo usuario
 * @param {Object} userData - { email, password, first_name, last_name }
 * @returns {Promise<Object>} Datos del usuario creado
 */
async function register(userData) {
  try {
    console.log("[v0] Iniciando registro con email:", userData.email)

    const response = await fetch(API_ENDPOINTS.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Error al crear cuenta")
    }

    console.log("[v0] Registro exitoso")
    return { success: true, user: data.data.user }
  } catch (error) {
    console.error("[v0] Error en registro:", error.message)
    throw error
  }
}

/**
 * Cierra sesión del usuario actual
 * @returns {Promise<boolean>}
 */
async function logout() {
  try {
    const token = AuthStorage.getToken()

    if (token) {
      await fetch(API_ENDPOINTS.signout, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }

    AuthStorage.removeToken()
    AuthStorage.removeUser()
    console.log("[v0] Logout exitoso")
    return true
  } catch (error) {
    console.error("[v0] Error en logout:", error.message)
    // Limpiar localStorage incluso si hay error en la petición
    AuthStorage.removeToken()
    AuthStorage.removeUser()
    return false
  }
}

/**
 * Realiza una petición HTTP autenticada
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Object>} Respuesta JSON
 */
async function fetchWithAuth(url, options = {}) {
  const token = AuthStorage.getToken()

  if (!token) {
    throw new Error("No autorizado. Por favor, inicia sesión")
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token expirado o inválido
    AuthStorage.removeToken()
    AuthStorage.removeUser()
    window.location.href = "/"
  }

  return response.json()
}

export { login, register, logout, fetchWithAuth }
