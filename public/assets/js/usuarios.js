import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

let usuariosActuales = []
lucide.createIcons()

const actualizarFechaHora = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
  const headerEl = document.getElementById("fecha-hora-header")
  if (headerEl) headerEl.textContent = `${fecha} | ${hora}`
}
actualizarFechaHora()
setInterval(actualizarFechaHora, 60000)

const logoutBtn = document.getElementById("logoutBtn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await logout()
    window.location.href = "/login"
  })
}

async function cargarUsuarios() {
  try {
    console.log("[v0] Cargando usuarios desde:", API_ENDPOINTS.usuarios)
    const data = await fetchWithAuth(API_ENDPOINTS.usuarios)
    if (!data.success) throw new Error(data.error || 'Error desconocido')
    // La respuesta viene con estructura data.data.usuarios
    usuariosActuales = Array.isArray(data.data) ? data.data : data.data.usuarios || []
    console.log("[v0] Usuarios cargados:", usuariosActuales.length)
    renderizarUsuarios()
  } catch (error) {
    console.error("[v0] Error al cargar usuarios:", error)
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar los usuarios')
  }
}

function renderizarUsuarios() {
  const tbody = document.querySelector('tbody')
  if (!tbody) return
  
  if (usuariosActuales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
          <p>No hay usuarios registrados</p>
        </td>
      </tr>
    `
    lucide.createIcons()
    return
  }

  tbody.innerHTML = usuariosActuales.map(usuario => {
    const fechaCreacion = usuario.fecha_creacion ? 
      new Date(usuario.fecha_creacion).toLocaleDateString('es-ES') : 
      (usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : 'N/A');
    
    return `
    <tr class="hover:bg-gray-700 transition">
      <td class="px-6 py-4 font-bold">#${usuario.id}</td>
      <td class="px-6 py-4">${usuario.nombre_completo || usuario.email}</td>
      <td class="px-6 py-4">${usuario.telefono || 'N/A'}</td>
      <td class="px-6 py-4 text-center">
        <span class="px-3 py-1 text-xs font-semibold rounded-full" style="background-color: rgba(75, 181, 67, 0.2); color: #00DA68;">
          activo
        </span>
      </td>
      <td class="px-6 py-4 text-center">${usuario.rol || 'usuario'}</td>
      <td class="px-6 py-4 text-center text-sm text-gray-400">${fechaCreacion}</td>
      <td class="px-6 py-4 text-center space-x-2">
        <button class="text-gray-400 hover:text-yellow-400" onclick="editarUsuario('${usuario.id}')">
          <i data-lucide="square-pen" class="w-5 h-5"></i>
        </button>
        <button class="text-gray-400 hover:text-red-500" onclick="eliminarUsuario('${usuario.id}')">
          <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
      </td>
    </tr>
  `}).join('')

  lucide.createIcons()
}

async function crearUsuario() {
  const { value: formValues } = await Swal.fire({
    title: 'Crear Nuevo Usuario',
    html: `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-left mb-2">Email:</label>
          <input id="swal-email" class="swal2-input" placeholder="usuario@ejemplo.com" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Nombre Completo:</label>
          <input id="swal-nombre" class="swal2-input" placeholder="Juan Pérez" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Teléfono (opcional):</label>
          <input id="swal-telefono" class="swal2-input" placeholder="555-1234" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Contraseña:</label>
          <input id="swal-password" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Rol:</label>
          <select id="swal-rol" class="swal2-select" style="margin: 0; width: 100%;">
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="recepcion">Recepción</option>
          </select>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'bg-gray-800 text-white',
      title: 'text-white',
      confirmButton: 'bg-blue-600 hover:bg-blue-700',
      cancelButton: 'bg-gray-600 hover:bg-gray-700'
    },
    preConfirm: () => {
      const email = document.getElementById('swal-email').value
      const nombre = document.getElementById('swal-nombre').value
      const telefono = document.getElementById('swal-telefono').value
      const password = document.getElementById('swal-password').value
      const rol = document.getElementById('swal-rol').value
      
      if (!email.trim() || !nombre.trim() || !password.trim()) {
        Swal.showValidationMessage('Email, nombre y contraseña son requeridos')
        return false
      }
      
      if (!email.includes('@')) {
        Swal.showValidationMessage('Email debe ser válido')
        return false
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('Contraseña debe tener al menos 6 caracteres')
        return false
      }
      
      return { email: email.trim(), fullName: nombre.trim(), telefono: telefono.trim(), password, rol }
    }
  })

  if (formValues) {
    try {
      const nuevoUsuario = {
        email: formValues.email,
        password: formValues.password,
        fullName: formValues.fullName,
        telefono: formValues.telefono,
        rol: formValues.rol
      }

      // Usar el endpoint de registro para crear usuario
      const data = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      })
      
      const response = await data.json()
      
      if (!response.success) throw new Error(response.error || 'Error al crear el usuario')

      await AlertConfig.showSuccess('Éxito', 'Usuario creado correctamente')
      await cargarUsuarios() // Recargar la lista
    } catch (error) {
      console.error("[v0] Error al crear usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo crear el usuario')
    }
  }
}

// Función para editar un usuario existente
async function editarUsuario(id) {
  const usuario = usuariosActuales.find(u => u.id === id)
  if (!usuario) {
    await AlertConfig.showError('Error', 'Usuario no encontrado')
    return
  }

  const { value: formValues } = await Swal.fire({
    title: 'Editar Usuario',
    html: `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-left mb-2">Email:</label>
          <input id="swal-email" class="swal2-input" value="${usuario.email}" disabled style="margin: 0; background-color: #374151;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Nombre Completo:</label>
          <input id="swal-nombre" class="swal2-input" value="${usuario.nombre_completo || ''}" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Teléfono:</label>
          <input id="swal-telefono" class="swal2-input" value="${usuario.telefono || ''}" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Rol:</label>
          <select id="swal-rol" class="swal2-select" style="margin: 0; width: 100%;">
            <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="vendedor" ${usuario.rol === 'vendedor' ? 'selected' : ''}>Vendedor</option>
            <option value="recepcion" ${usuario.rol === 'recepcion' ? 'selected' : ''}>Recepción</option>
          </select>
        </div>

      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'bg-gray-800 text-white',
      title: 'text-white',
      confirmButton: 'bg-blue-600 hover:bg-blue-700',
      cancelButton: 'bg-gray-600 hover:bg-gray-700'
    },
    preConfirm: () => {
      const nombre = document.getElementById('swal-nombre').value
      const telefono = document.getElementById('swal-telefono').value
      const rol = document.getElementById('swal-rol').value
      
      if (!nombre.trim()) {
        Swal.showValidationMessage('El nombre es requerido')
        return false
      }
      
      return { nombre_completo: nombre.trim(), telefono: telefono.trim(), rol }
    }
  })

  if (formValues) {
    try {
      const datosActualizados = {
        nombre_completo: formValues.nombre_completo,
        telefono: formValues.telefono,
        rol: formValues.rol
      }

      const data = await fetchWithAuth(`${API_ENDPOINTS.usuarios}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })

      if (!data.success) throw new Error(data.error || 'Error al actualizar el usuario')

      await AlertConfig.showSuccess('Éxito', 'Usuario actualizado correctamente')
      await cargarUsuarios() // Recargar la lista
    } catch (error) {
      console.error("[v0] Error al actualizar usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo actualizar el usuario')
    }
  }
}

// Función para eliminar un usuario
async function eliminarUsuario(id) {
  const usuario = usuariosActuales.find(u => u.id === id)
  if (!usuario) {
    await AlertConfig.showError('Error', 'Usuario no encontrado')
    return
  }

  const resultado = await Swal.fire({
    title: '¿Estás seguro?',
    html: `¿Deseas eliminar al usuario "<strong>${usuario.nombre_completo || usuario.email}</strong>"?<br><br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'bg-gray-800 text-white',
      title: 'text-white'
    }
  })

  if (resultado.isConfirmed) {
    try {
      const data = await fetchWithAuth(`${API_ENDPOINTS.usuarios}/${id}`, {
        method: 'DELETE'
      })

      if (!data.success) throw new Error(data.error || 'Error al eliminar el usuario')

      await AlertConfig.showSuccess('Eliminado', 'Usuario eliminado correctamente')
      await cargarUsuarios() // Recargar la lista
    } catch (error) {
      console.error("[v0] Error al eliminar usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo eliminar el usuario')
    }
  }
}

// Función para buscar usuarios
function buscarUsuarios() {
  const termino = document.querySelector('#buscar-usuarios')?.value?.toLowerCase() || ''
  
  if (!termino.trim()) {
    renderizarUsuarios()
    return
  }

  const usuariosFiltrados = usuariosActuales.filter(usuario => 
    (usuario.nombre_completo && usuario.nombre_completo.toLowerCase().includes(termino)) ||
    (usuario.email && usuario.email.toLowerCase().includes(termino)) ||
    (usuario.telefono && usuario.telefono.toLowerCase().includes(termino)) ||
    (usuario.rol && usuario.rol.toLowerCase().includes(termino)) ||
    (usuario.status && usuario.status.toLowerCase().includes(termino))
  )

  const tbody = document.querySelector('tbody')
  if (!tbody) return

  if (!usuariosFiltrados.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
          <i data-lucide="search" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
          <p>No se encontraron usuarios con el término: "${termino}"</p>
        </td>
      </tr>
    `
  } else {
    tbody.innerHTML = usuariosFiltrados.map(usuario => {
      const fechaCreacion = usuario.fecha_creacion ? 
        new Date(usuario.fecha_creacion).toLocaleDateString('es-ES') : 
        (usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : 'N/A');
      
      return `
      <tr class="hover:bg-gray-700 transition">
        <td class="px-6 py-4 font-bold">#${usuario.id}</td>
        <td class="px-6 py-4">${usuario.nombre_completo || usuario.email}</td>
        <td class="px-6 py-4">${usuario.telefono || 'N/A'}</td>
        <td class="px-6 py-4 text-center">
          <span class="px-3 py-1 text-xs font-semibold rounded-full" style="background-color: rgba(75, 181, 67, 0.2); color: #00DA68;">
            ${usuario.status || 'activo'}
          </span>
        </td>
        <td class="px-6 py-4 text-center">${usuario.rol || 'usuario'}</td>
        <td class="px-6 py-4 text-center text-sm text-gray-400">${fechaCreacion}</td>
        <td class="px-6 py-4 text-center space-x-2">
          <button class="text-gray-400 hover:text-yellow-400" onclick="editarUsuario('${usuario.id}')">
            <i data-lucide="square-pen" class="w-5 h-5"></i>
          </button>
          <button class="text-gray-400 hover:text-red-500" onclick="eliminarUsuario('${usuario.id}')">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </td>
      </tr>
    `}).join('')
  }

  lucide.createIcons()
}

// Configurar botón de crear nuevo usuario
const agregarBtn = document.querySelector('.btn-principal')
if (agregarBtn) {
  agregarBtn.addEventListener('click', crearUsuario)
}

// Configurar buscador si existe
const inputBuscar = document.querySelector('input[placeholder*="Buscar"]')
if (inputBuscar) {
  inputBuscar.addEventListener('input', buscarUsuarios)
  inputBuscar.id = 'buscar-usuarios'
}

const menuToggle = document.getElementById('menu-toggle')
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar')
    const backdrop = document.getElementById('backdrop')
    if (sidebar) sidebar.classList.toggle('-translate-x-full')
    if (backdrop) backdrop.classList.toggle('hidden')
  })
}

const backdrop = document.getElementById('backdrop')
if (backdrop) {
  backdrop.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) sidebar.classList.add('-translate-x-full')
    backdrop.classList.add('hidden')
  })
}

// Exportar funciones para uso global
window.crearUsuario = crearUsuario
window.editarUsuario = editarUsuario
window.eliminarUsuario = eliminarUsuario
window.buscarUsuarios = buscarUsuarios

// Cargar usuarios al inicio
cargarUsuarios()