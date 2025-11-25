import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

let usuariosActuales = []
let paginaActual = 1
let totalPaginas = 1
let totalUsuarios = 0
let filtrosActivos = {
  busqueda: '',
  rol: '',
  status: ''
}
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

async function cargarUsuarios(pagina = 1, aplicarFiltros = false) {
  try {
    const params = new URLSearchParams({
      page: pagina,
      limit: 10
    })

    // Aplicar filtros si están activos
    if (aplicarFiltros || filtrosActivos.busqueda || filtrosActivos.rol || filtrosActivos.status) {
      if (filtrosActivos.busqueda) params.append('search', filtrosActivos.busqueda)
      if (filtrosActivos.rol) params.append('rol', filtrosActivos.rol)
      if (filtrosActivos.status) params.append('status', filtrosActivos.status)
    }

    const url = `${API_ENDPOINTS.usuarios}?${params.toString()}`
    console.log("[v0] Cargando usuarios desde:", url)
    
    const data = await fetchWithAuth(url)
    if (!data.success) throw new Error(data.error || 'Error desconocido')
    
    // Actualizar variables de paginación
    usuariosActuales = data.data.users || [] // Cambiar de 'usuarios' a 'users'
    paginaActual = data.data.pagination.current_page
    totalPaginas = data.data.pagination.total_pages
    totalUsuarios = data.data.pagination.total
    
    console.log("[v0] Usuarios cargados:", usuariosActuales.length, "de", totalUsuarios)
    renderizarUsuarios()
    renderizarPaginacion()
    actualizarContadores()
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
      new Date(usuario.fecha_creacion.seconds * 1000).toLocaleDateString('es-ES') : 'N/A'
    
    const statusColor = usuario.status === 'activo' ? 
      'background-color: rgba(75, 181, 67, 0.2); color: #00DA68;' : 
      'background-color: rgba(239, 68, 68, 0.2); color: #EF4444;'
    
    return `
    <tr class="hover:bg-gray-700 transition">
      <td class="px-6 py-4 font-bold">#${usuario.uid.slice(-6)}</td>
      <td class="px-6 py-4">
        <div>
          <div class="font-medium">${usuario.nombre || usuario.email}</div>
          <div class="text-sm text-gray-400">${usuario.email}</div>
        </div>
      </td>
      <td class="px-6 py-4">${usuario.telefono || 'N/A'}</td>
      <td class="px-6 py-4 text-center">
        <button onclick="toggleStatus('${usuario.uid}')" class="px-3 py-1 text-xs font-semibold rounded-full hover:opacity-80 transition" style="${statusColor}">
          ${usuario.status || 'activo'}
        </button>
      </td>
      <td class="px-6 py-4 text-center">
        <span class="px-2 py-1 text-xs font-medium rounded" style="background-color: rgba(59, 130, 246, 0.2); color: #3B82F6;">
          ${usuario.rol || 'vendedor'}
        </span>
      </td>
      <td class="px-6 py-4 text-center text-sm text-gray-400">${fechaCreacion}</td>
      <td class="px-6 py-4 text-center space-x-2">
        <button class="text-gray-400 hover:text-blue-400" onclick="verUsuario('${usuario.uid}')" title="Ver detalles">
          <i data-lucide="eye" class="w-5 h-5"></i>
        </button>
        <button class="text-gray-400 hover:text-yellow-400" onclick="editarUsuario('${usuario.uid}')" title="Editar">
          <i data-lucide="square-pen" class="w-5 h-5"></i>
        </button>
        <button class="text-gray-400 hover:text-red-500" onclick="eliminarUsuario('${usuario.uid}')" title="Eliminar">
          <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
      </td>
    </tr>
  `}).join('')

  lucide.createIcons()
}

// Función para renderizar controles de paginación
function renderizarPaginacion() {
  const contenedorTabla = document.querySelector('.lg\\:col-span-3 .tarjeta')
  let contenedorPaginacion = document.querySelector('#paginacion-container')
  
  if (!contenedorPaginacion && contenedorTabla) {
    contenedorPaginacion = document.createElement('div')
    contenedorPaginacion.id = 'paginacion-container'
    contenedorPaginacion.className = 'flex items-center justify-between mt-4 px-6 py-4 border-t border-gray-700'
    contenedorTabla.appendChild(contenedorPaginacion)
  }
  
  contenedorPaginacion.innerHTML = `
    <div class="text-sm text-gray-400">
      Mostrando ${(paginaActual - 1) * 10 + 1} - ${Math.min(paginaActual * 10, totalUsuarios)} de ${totalUsuarios} usuarios
    </div>
    <div class="flex space-x-2">
      <button onclick="cambiarPagina(${paginaActual - 1})" 
              ${paginaActual <= 1 ? 'disabled' : ''} 
              class="px-3 py-1 text-sm rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        <i data-lucide="chevron-left" class="w-4 h-4"></i>
      </button>
      <span class="px-3 py-1 text-sm bg-blue-600 rounded">
        ${paginaActual} / ${totalPaginas}
      </span>
      <button onclick="cambiarPagina(${paginaActual + 1})" 
              ${paginaActual >= totalPaginas ? 'disabled' : ''} 
              class="px-3 py-1 text-sm rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        <i data-lucide="chevron-right" class="w-4 h-4"></i>
      </button>
    </div>
  `
  lucide.createIcons()
}

// Función para cambiar página
function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return
  cargarUsuarios(nuevaPagina, true)
}

// Función para actualizar contadores en la interfaz
function actualizarContadores() {
  const tituloLista = Array.from(document.querySelectorAll('h2')).find(h2 => 
    h2.textContent.includes('Lista de Usuarios'))
  if (tituloLista) {
    tituloLista.innerHTML = `
      <i data-lucide="users" class="w-6 h-6 mr-2" style="color: var(--color-azul-acento);"></i>
      Lista de Usuarios (${totalUsuarios})
    `
    lucide.createIcons()
  }
}

// Función para ver detalles de un usuario
async function verUsuario(id) {
  try {
    const usuario = usuariosActuales.find(u => u.uid === id)
    if (!usuario) throw new Error('Usuario no encontrado')
    
    const fechaCreacion = usuario.fecha_creacion ? 
      new Date(usuario.fecha_creacion.seconds * 1000).toLocaleString('es-ES') : 'N/A'
    
    await Swal.fire({
      title: 'Detalles del Usuario',
      html: `
        <div class="text-left space-y-3">
          <div><strong>ID:</strong> ${usuario.uid}</div>
          <div><strong>Email:</strong> ${usuario.email}</div>
          <div><strong>Nombre:</strong> ${usuario.nombre || 'N/A'}</div>
          <div><strong>Teléfono:</strong> ${usuario.telefono || 'N/A'}</div>
          <div><strong>Rol:</strong> ${usuario.rol}</div>
          <div><strong>Estado:</strong> ${usuario.status}</div>
          <div><strong>Creado:</strong> ${fechaCreacion}</div>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: 'bg-gray-800 text-white',
        title: 'text-white',
        confirmButton: 'bg-blue-600 hover:bg-blue-700'
      }
    })
  } catch (error) {
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar los detalles')
  }
}

// Función para cambiar estado de usuario
async function toggleStatus(id) {
  try {
    const usuario = usuariosActuales.find(u => u.uid === id)
    if (!usuario) throw new Error('Usuario no encontrado')
    
    const nuevoStatus = usuario.status === 'activo' ? 'inactivo' : 'activo'
    const accion = nuevoStatus === 'activo' ? 'activar' : 'desactivar'
    
    const confirmacion = await Swal.fire({
      title: `¿Confirmar acción?`,
      text: `¿Deseas ${accion} al usuario ${usuario.nombre || usuario.email}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'bg-gray-800 text-white',
        title: 'text-white'
      }
    })
    
    if (!confirmacion.isConfirmed) return
    
    const data = await fetchWithAuth(`${API_ENDPOINTS.usuarios}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nuevoStatus })
    })
    
    if (!data.success) throw new Error(data.error || 'Error al cambiar estado')
    
    await AlertConfig.showSuccess('Éxito', `Usuario ${nuevoStatus === 'activo' ? 'activado' : 'desactivado'} correctamente`)
    await cargarUsuarios(paginaActual, true)
  } catch (error) {
    console.error("[v0] Error al cambiar estado:", error)
    await AlertConfig.showError('Error', error.message || 'No se pudo cambiar el estado')
  }
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
          <input id="swal-nombre" class="swal2-input" placeholder="nombre apellido" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Teléfono (opcional):</label>
          <input id="swal-telefono" class="swal2-input" placeholder="Ej: 1234567890 (opcional)" style="margin: 0;">
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
      
      // Validar teléfono si no está vacío
      if (telefono.trim() && telefono.trim() !== '') {
        // Verificar que solo contenga números
        if (!/^\d+$/.test(telefono.trim())) {
          Swal.showValidationMessage('El teléfono debe contener solo números')
          return false
        }
        // Verificar que tenga exactamente 10 dígitos
        if (telefono.trim().length !== 10) {
          Swal.showValidationMessage('El teléfono debe tener exactamente 10 dígitos')
          return false
        }
      }
      
      return { email: email.trim(), nombre: nombre.trim(), telefono: telefono.trim(), password, rol }
    }
  })

  if (formValues) {
    try {
      const nuevoUsuario = {
        email: formValues.email,
        password: formValues.password,
        nombre: formValues.nombre,
        telefono: formValues.telefono,
        rol: formValues.rol
      }

      // Usar el endpoint de registro para crear usuario
      const data = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      })
      
      const response = await data.json()
      
      if (!response.success) throw new Error(response.error || 'Error al crear el usuario')

      await AlertConfig.showSuccess('Éxito', 'Usuario creado correctamente')
      await cargarUsuarios(1, true) // Ir a la primera página
    } catch (error) {
      console.error("[v0] Error al crear usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo crear el usuario')
    }
  }
}

// Función para editar un usuario existente
async function editarUsuario(id) {
  const usuario = usuariosActuales.find(u => u.uid === id)
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
          <input id="swal-nombre" class="swal2-input" value="${usuario.nombre || ''}" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Teléfono (opcional):</label>
          <input id="swal-telefono" class="swal2-input" value="${usuario.telefono === 'sin telefono' ? '' : (usuario.telefono || '')}" placeholder="Ej: 1234567890 (opcional)" style="margin: 0;">
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Rol:</label>
          <select id="swal-rol" class="swal2-select" style="margin: 0; width: 100%;">
            <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="vendedor" ${usuario.rol === 'vendedor' ? 'selected' : ''}>Vendedor</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-left mb-2">Estado:</label>
          <select id="swal-status" class="swal2-select" style="margin: 0; width: 100%;">
            <option value="activo" ${usuario.status === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${usuario.status === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
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
      const status = document.getElementById('swal-status').value
      
      if (!nombre.trim()) {
        Swal.showValidationMessage('El nombre es requerido')
        return false
      }
      
      // Verificar que el usuario no se esté desactivando a sí mismo
      const currentUser = AuthStorage.getUser()
      if (currentUser && currentUser.id === usuario.uid && status === 'inactivo') {
        Swal.showValidationMessage('No puedes desactivar tu propio usuario')
        return false
      }
      
      // Validar teléfono si no está vacío
      if (telefono.trim() && telefono.trim() !== '') {
        // Verificar que solo contenga números
        if (!/^\d+$/.test(telefono.trim())) {
          Swal.showValidationMessage('El teléfono debe contener solo números')
          return false
        }
        // Verificar que tenga exactamente 10 dígitos
        if (telefono.trim().length !== 10) {
          Swal.showValidationMessage('El teléfono debe tener exactamente 10 dígitos')
          return false
        }
      }
      
      return { nombre: nombre.trim(), telefono: telefono.trim(), rol, status }
    }
  })

  if (formValues) {
    try {
      const datosActualizados = {
        nombre: formValues.nombre,
        telefono: formValues.telefono,
        rol: formValues.rol,
        status: formValues.status
      }

      const data = await fetchWithAuth(`${API_ENDPOINTS.usuarios}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })

      if (!data.success) throw new Error(data.error || 'Error al actualizar el usuario')

      await AlertConfig.showSuccess('Éxito', 'Usuario actualizado correctamente')
      await cargarUsuarios(paginaActual, true) // Mantener página actual
    } catch (error) {
      console.error("[v0] Error al actualizar usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo actualizar el usuario')
    }
  }
}

// Función para eliminar un usuario
async function eliminarUsuario(id) {
  const usuario = usuariosActuales.find(u => u.uid === id)
  if (!usuario) {
    await AlertConfig.showError('Error', 'Usuario no encontrado')
    return
  }

  const resultado = await Swal.fire({
    title: '¿Estás seguro?',
    html: `¿Deseas eliminar al usuario "<strong>${usuario.nombre || usuario.email}</strong>"?<br><br>Esta acción no se puede deshacer.`,
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
      // Si era el último de la página, ir a la anterior
      const nuevaPagina = usuariosActuales.length === 1 && paginaActual > 1 ? paginaActual - 1 : paginaActual
      await cargarUsuarios(nuevaPagina, true)
    } catch (error) {
      console.error("[v0] Error al eliminar usuario:", error)
      await AlertConfig.showError('Error', error.message || 'No se pudo eliminar el usuario')
    }
  }
}

// Función para aplicar filtros
function aplicarFiltros() {
  const busqueda = document.querySelector('#buscar-usuarios')?.value?.trim() || ''
  const rol = document.querySelector('#filtro-rol')?.value || ''
  const status = document.querySelector('#filtro-status')?.value || ''
  
  filtrosActivos = { busqueda, rol, status }
  
  console.log("[v0] Aplicando filtros:", filtrosActivos)
  cargarUsuarios(1, true) // Ir a la primera página con filtros
}

// Función para limpiar filtros
function limpiarFiltros() {
  filtrosActivos = { busqueda: '', rol: '', status: '' }
  
  // Limpiar campos
  const inputBuscar = document.querySelector('#buscar-usuarios')
  const selectRol = document.querySelector('#filtro-rol') 
  const selectStatus = document.querySelector('#filtro-status')
  
  if (inputBuscar) inputBuscar.value = ''
  if (selectRol) selectRol.value = ''
  if (selectStatus) selectStatus.value = ''
  
  cargarUsuarios(1, false) // Cargar sin filtros
}

// Función para buscar usuarios en tiempo real
function buscarUsuarios() {
  aplicarFiltros() // Usar la función de filtros
}

// Configurar botón de crear nuevo usuario
const agregarBtn = document.querySelector('.btn-principal')
if (agregarBtn) {
  agregarBtn.addEventListener('click', crearUsuario)
}

// Configurar filtros
const inputBuscar = document.querySelector('#buscar-usuarios')
if (inputBuscar) {
  inputBuscar.addEventListener('input', buscarUsuarios)
}

// Configurar select de rol
const selectRol = document.querySelector('#filtro-rol')
if (selectRol) {
  selectRol.addEventListener('change', aplicarFiltros)
}

// Configurar select de estado
const selectStatus = document.querySelector('#filtro-status')
if (selectStatus) {
  selectStatus.addEventListener('change', aplicarFiltros)
}

// Configurar botón de aplicar filtros para limpiar
const btnFiltros = document.querySelector('.btn-secundario')
if (btnFiltros) {
  btnFiltros.textContent = 'Limpiar Filtros'
  btnFiltros.addEventListener('click', limpiarFiltros)
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
window.verUsuario = verUsuario
window.toggleStatus = toggleStatus
window.buscarUsuarios = buscarUsuarios
window.aplicarFiltros = aplicarFiltros
window.limpiarFiltros = limpiarFiltros
window.cambiarPagina = cambiarPagina

// Cargar usuarios al inicio
cargarUsuarios()