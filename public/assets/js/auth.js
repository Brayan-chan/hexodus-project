import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';

/**
 * Realiza login con email y contraseña
 */
async function login(email, password) {
  try {
    console.log("[v0] Intentando login en:", API_ENDPOINTS.login)
    const response = await fetch(API_ENDPOINTS.login, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Error al iniciar sesión")
    }

    if (data.success && data.data) {
      const { user, session } = data.data
      
      // Guardar token de la sesión
      AuthStorage.saveToken(session.accessToken)
      AuthStorage.saveUser(user)

      console.log("[v0] Login exitoso para usuario:", user.email)
      return { success: true, usuario: user }
    }

    throw new Error("Respuesta inválida del servidor")
  } catch (error) {
    console.error("[v0] Error en login:", error.message)
    throw error
  }
}

/**
 * Realiza registro de nuevo usuario
 */
async function register(userData) {
  try {
    console.log("[v0] Iniciando registro en:", API_ENDPOINTS.register)

    const response = await fetch(API_ENDPOINTS.register, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Error al crear cuenta")
    }

    console.log("[v0] Registro exitoso")
    return { success: true, usuario: data.data.user }
  } catch (error) {
    console.error("[v0] Error en registro:", error.message)
    throw error
  }
}

/**
 * Cierra sesión
 */
async function logout() {
  try {
    const token = AuthStorage.getToken()

    if (token) {
      await fetch(API_ENDPOINTS.logout, {
        method: "POST",
        credentials: "include",
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
    AuthStorage.removeToken()
    AuthStorage.removeUser()
    return false
  }
}

/**
 * Realiza una petición HTTP autenticada
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
    credentials: "include",
    headers,
  })

  if (response.status === 401) {
    AuthStorage.removeToken()
    AuthStorage.removeUser()
    window.location.href = "/login"
    throw new Error("Sesión expirada")
  }

  return response.json()
}

export { login, register, logout, fetchWithAuth }