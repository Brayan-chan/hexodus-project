import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

// Verificar autenticación
if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

// Variables globales
let sociosActuales = []
let filtroEstado = 'todos'
let textoBusqueda = ''
let paginacion = {
    hasMore: false,
    lastDocId: null,
    currentPage: 1,
    totalSocios: 0
}
let membresiasDisponibles = []
let socioSeleccionado = null

// Inicializar Lucide
lucide.createIcons()

// Actualizar fecha y hora
const actualizarFechaHora = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
  const headerEl = document.getElementById("fecha-hora-header")
  if (headerEl) headerEl.textContent = `${fecha} | ${hora}`
}
actualizarFechaHora()
setInterval(actualizarFechaHora, 60000)

// Logout
const logoutBtn = document.getElementById("logoutBtn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await logout()
    window.location.href = "/login"
  })
}

// ===== GESTIÓN DE MODALES =====
const modal = document.getElementById('modal-agregar-socio')
const btnAgregar = document.getElementById('btn-agregar-socio')
const btnCerrar = document.getElementById('btn-cerrar-modal')
const btnCancelar = document.getElementById('btn-cancelar-registro')

if (btnAgregar) {
  btnAgregar.addEventListener('click', async () => {
    socioSeleccionado = null
    await cargarMembresiasDisponibles()
    limpiarFormularioSocio()
    actualizarTituloModal()
    modal.classList.remove('hidden')
  })
}

const closeModal = () => {
  if (modal) modal.classList.add('hidden')
  socioSeleccionado = null
}

if (btnCerrar) btnCerrar.addEventListener('click', closeModal)
if (btnCancelar) btnCancelar.addEventListener('click', closeModal)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
    closeModal()
  }
})

// ===== CARGAR DATOS INICIALES =====
async function inicializar() {
  try {
    await cargarMembresiasDisponibles()
    await cargarSocios()
    await configurarFiltros()
  } catch (error) {
    console.error('Error inicializando:', error)
    await AlertConfig.showError('Error', 'Error al cargar datos iniciales')
  }
}

// ===== MEMBRESÍAS DISPONIBLES =====
async function cargarMembresiasDisponibles() {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/memberships/available`)
    
    if (response.success) {
      membresiasDisponibles = response.data.membresias || []
      renderizarSelectMembresias()
    }
  } catch (error) {
    console.error('Error cargando membresías:', error)
  }
}

function renderizarSelectMembresias() {
  const selectMembresia = document.getElementById('membresia')
  if (!selectMembresia) return

  selectMembresia.innerHTML = `
    <option value="">Sin membresía</option>
    ${membresiasDisponibles.map(m => 
      `<option value="${m.uuid_membresia}">${m.nombre_membresia} - $${m.precio}</option>`
    ).join('')}
  `
}

// ===== CARGAR SOCIOS =====
async function cargarSocios(reset = false) {
  try {
    if (reset) {
      paginacion.lastDocId = null
      paginacion.currentPage = 1
      sociosActuales = []
    }

    const params = new URLSearchParams({
      limit: '10'
    })
    
    if (paginacion.lastDocId) {
      params.append('lastDocId', paginacion.lastDocId)
    }
    
    if (filtroEstado !== 'todos') {
      params.append('status', filtroEstado)
    }
    
    if (textoBusqueda.trim()) {
      params.append('search', textoBusqueda.trim())
    }

    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}?${params}`)

    if (response.success) {
      const nuevosSocios = response.data.socios || []
      
      if (reset) {
        sociosActuales = nuevosSocios
      } else {
        sociosActuales.push(...nuevosSocios)
      }

      paginacion.hasMore = response.data.hasMore || false
      paginacion.lastDocId = response.data.lastDocId || null

      renderizarSocios()
      renderizarPaginacion()
    } else {
      throw new Error(response.error || 'Error desconocido')
    }
  } catch (error) {
    console.error('Error cargando socios:', error)
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar los socios')
  }
}

// ===== RENDERIZAR TABLA DE SOCIOS =====
function renderizarSocios() {
  const tbody = document.querySelector('tbody')
  
  if (!tbody) return

  if (sociosActuales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
          No hay socios para mostrar
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = sociosActuales.map(socio => {
    const fechaCreacion = new Date(socio.fecha_creacion).toLocaleDateString('es-ES')
    
    // Estado del socio
    const estadoSocio = socio.status === 'activo' 
      ? '<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-900/30 text-green-400">Activo</span>'
      : '<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-900/30 text-red-400">Inactivo</span>'

    // Estado de membresía
    let estadoMembresia = '<span class="px-2 py-1 text-xs text-gray-400">Sin membresía</span>'
    let tipoMembresia = 'N/A'
    
    if (socio.membresia_activa) {
      tipoMembresia = socio.membresia_activa.informacion_membresia?.nombre_membresia || 'Membresía'
      const isPagado = socio.membresia_activa.status_membresia_socio === 'pagado'
      const fechaFin = new Date(socio.membresia_activa.fecha_fin)
      const hoy = new Date()
      const estaVencida = fechaFin < hoy
      
      if (isPagado && !estaVencida) {
        estadoMembresia = '<span class="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded">Pagado</span>'
      } else if (isPagado && estaVencida) {
        estadoMembresia = '<span class="px-2 py-1 text-xs bg-orange-900/30 text-orange-400 rounded">Vencido</span>'
      } else {
        estadoMembresia = '<span class="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded">No pagado</span>'
      }
    }

    return `
      <tr class="hover:bg-gray-700 transition duration-200">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#${socio.id.substring(0, 8)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
          <div>
            <div class="font-medium">${socio.nombre_socio} ${socio.apellido_paterno}</div>
            <div class="text-gray-400 text-xs">${socio.correo_electronico}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${socio.telefono || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${tipoMembresia}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center">${estadoMembresia}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center">${estadoSocio}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
          <div class="flex justify-center space-x-2">
            <button class="text-blue-400 hover:text-blue-300 view-btn" data-id="${socio.id}" title="Ver detalles">
              <i data-lucide="eye" class="w-5 h-5"></i>
            </button>
            <button class="text-yellow-400 hover:text-yellow-300 edit-btn" data-id="${socio.id}" title="Editar">
              <i data-lucide="square-pen" class="w-5 h-5"></i>
            </button>
            <button class="text-green-400 hover:text-green-300 membership-btn" data-id="${socio.id}" title="Gestionar membresías">
              <i data-lucide="credit-card" class="w-5 h-5"></i>
            </button>
            ${socio.status === 'activo' ? 
              `<button class="text-orange-400 hover:text-orange-300 disable-btn" data-id="${socio.id}" title="Deshabilitar">
                <i data-lucide="user-x" class="w-5 h-5"></i>
              </button>` :
              `<button class="text-green-500 hover:text-green-400 enable-btn" data-id="${socio.id}" title="Habilitar">
                <i data-lucide="user-check" class="w-5 h-5"></i>
              </button>`
            }
            <button class="text-red-500 hover:text-red-400 delete-btn" data-id="${socio.id}" title="Eliminar">
              <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()
  configurarEventosBotones()
}

// ===== CONFIGURAR EVENTOS DE BOTONES =====
function configurarEventosBotones() {
  // Ver detalles
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => verDetallesSocio(btn.dataset.id))
  })

  // Editar
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editarSocio(btn.dataset.id))
  })

  // Gestionar membresías
  document.querySelectorAll('.membership-btn').forEach(btn => {
    btn.addEventListener('click', () => gestionarMembresias(btn.dataset.id))
  })

  // Deshabilitar
  document.querySelectorAll('.disable-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoSocio(btn.dataset.id, 'disable'))
  })

  // Habilitar
  document.querySelectorAll('.enable-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoSocio(btn.dataset.id, 'enable'))
  })

  // Eliminar
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarSocio(btn.dataset.id))
  })
}

// ===== PAGINACIÓN =====
function renderizarPaginacion() {
  const paginacionContainer = document.getElementById('paginacion')
  if (!paginacionContainer) return

  const hasMore = paginacion.hasMore
  const currentPage = paginacion.currentPage

  paginacionContainer.innerHTML = `
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-400">
        Mostrando ${sociosActuales.length} socios
      </div>
      <div class="flex space-x-2">
        ${currentPage > 1 ? 
          `<button id="btn-prev-page" class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
            Anterior
          </button>` : ''
        }
        ${hasMore ? 
          `<button id="btn-next-page" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
            Siguiente
          </button>` : ''
        }
      </div>
    </div>
  `

  // Eventos de paginación
  const btnPrev = document.getElementById('btn-prev-page')
  const btnNext = document.getElementById('btn-next-page')

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      paginacion.currentPage--
      cargarSocios(true) // Reset y cargar desde el inicio
    })
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      paginacion.currentPage++
      cargarSocios(false) // Cargar siguiente página
    })
  }
}

// ===== FILTROS =====
async function configurarFiltros() {
  const btnFiltroTodos = document.getElementById('filtro-todos')
  const btnFiltroActivos = document.getElementById('filtro-activos')
  const btnFiltroInactivos = document.getElementById('filtro-inactivos')
  const inputBusqueda = document.getElementById('busqueda-socios')

  // Eventos de filtros
  if (btnFiltroTodos) {
    btnFiltroTodos.addEventListener('click', () => aplicarFiltro('todos'))
  }
  if (btnFiltroActivos) {
    btnFiltroActivos.addEventListener('click', () => aplicarFiltro('activo'))
  }
  if (btnFiltroInactivos) {
    btnFiltroInactivos.addEventListener('click', () => aplicarFiltro('inactivo'))
  }

  // Búsqueda en tiempo real
  if (inputBusqueda) {
    let timeoutId = null
    inputBusqueda.addEventListener('input', (e) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        textoBusqueda = e.target.value.trim()
        cargarSocios(true)
      }, 500)
    })
  }
}

function aplicarFiltro(estado) {
  filtroEstado = estado
  
  // Actualizar botones activos
  document.querySelectorAll('[id^="filtro-"]').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white')
    btn.classList.add('bg-gray-700', 'text-gray-300')
  })
  
  const btnActivo = document.getElementById(`filtro-${estado}s`) || document.getElementById('filtro-todos')
  if (btnActivo) {
    btnActivo.classList.remove('bg-gray-700', 'text-gray-300')
    btnActivo.classList.add('bg-blue-600', 'text-white')
  }

  cargarSocios(true)
}

// ===== FUNCIONES CRUD =====
function limpiarFormularioSocio() {
  const campos = ['nombre-socio', 'apellido-paterno', 'apellido-materno', 
                 'correo-socio', 'telefono-socio', 'membresia', 'fecha-inicio', 'observaciones-membresia']
  
  campos.forEach(id => {
    const elemento = document.getElementById(id)
    if (elemento) elemento.value = ''
  })
}

function actualizarTituloModal() {
  const tituloModal = modal?.querySelector('h2')
  if (tituloModal) {
    tituloModal.textContent = socioSeleccionado ? 'Editar Socio' : 'Agregar Nuevo Socio'
  }
}

// Crear/Actualizar socio
const form = document.querySelector('form')
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const nombre_socio = document.getElementById('nombre-socio').value.trim()
    const apellido_paterno = document.getElementById('apellido-paterno')?.value.trim() || ''
    const apellido_materno = document.getElementById('apellido-materno')?.value.trim() || ''
    const correo_electronico = document.getElementById('correo-socio').value.trim()
    const telefono = document.getElementById('telefono-socio').value.trim()
    const tipo_membresia = document.getElementById('membresia')?.value || ''
    const fecha_inicio = document.getElementById('fecha-inicio')?.value || ''
    const observaciones_membresia = document.getElementById('observaciones-membresia')?.value || ''

    if (!nombre_socio || !correo_electronico) {
      await AlertConfig.showError('Error', 'Nombre y correo son obligatorios')
      return
    }

    // Para apellido_paterno, usar parte del nombre si no se proporciona
    let apellido = apellido_paterno
    if (!apellido && nombre_socio.includes(' ')) {
      const partes = nombre_socio.split(' ')
      apellido = partes.pop() || 'Apellido'
    } else if (!apellido) {
      apellido = 'Apellido'
    }

    try {
      const datosEnvio = {
        nombre_socio,
        apellido_paterno: apellido,
        apellido_materno,
        correo_electronico,
        telefono,
        status: 'activo'
      }

      // Si hay membresía seleccionada, agregar datos
      if (tipo_membresia && fecha_inicio) {
        datosEnvio.tipo_membresia = tipo_membresia
        datosEnvio.fecha_inicio = fecha_inicio
        datosEnvio.observaciones_membresia = observaciones_membresia
      }

      let response
      if (socioSeleccionado) {
        // Actualizar socio existente
        response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioSeleccionado.id}`, {
          method: 'PUT',
          body: JSON.stringify(datosEnvio)
        })
      } else {
        // Crear nuevo socio
        response = await fetchWithAuth(API_ENDPOINTS.socios, {
          method: 'POST',
          body: JSON.stringify(datosEnvio)
        })
      }

      if (!response.success) {
        throw new Error(response.error)
      }

      const mensaje = socioSeleccionado ? 'Socio actualizado correctamente' : 'Socio creado correctamente'
      await AlertConfig.showSuccess('¡Éxito!', mensaje)
      closeModal()
      cargarSocios(true)
    } catch (error) {
      console.error('Error guardando socio:', error)
      await AlertConfig.showError('Error', error.message)
    }
  })
}

// Ver detalles del socio
async function verDetallesSocio(socioId) {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}`)
    
    if (!response.success) {
      throw new Error(response.error)
    }

    const socio = response.data.socio
    const membresias = socio.membresias || []

    let membresiaInfo = 'Sin membresía activa'
    if (membresias.length > 0) {
      const membresiaActual = membresias[0] // La más reciente
      const fechaInicio = new Date(membresiaActual.fecha_inicio).toLocaleDateString('es-ES')
      const fechaFin = new Date(membresiaActual.fecha_fin).toLocaleDateString('es-ES')
      const estadoPago = membresiaActual.status_membresia_socio === 'pagado' ? 'Pagado' : 'No pagado'
      const nombre = membresiaActual.informacion_membresia?.nombre_membresia || 'Membresía'
      
      membresiaInfo = `
        <strong>${nombre}</strong><br>
        Periodo: ${fechaInicio} - ${fechaFin}<br>
        Estado: <span class="${estadoPago === 'Pagado' ? 'text-green-400' : 'text-red-400'}">${estadoPago}</span><br>
        ${membresiaActual.observaciones ? `Observaciones: ${membresiaActual.observaciones}` : ''}
      `
    }

    await Swal.fire({
      title: 'Detalles del Socio',
      html: `
        <div class="text-left space-y-4">
          <div>
            <strong>Nombre:</strong> ${socio.nombre_socio} ${socio.apellido_paterno} ${socio.apellido_materno || ''}
          </div>
          <div>
            <strong>Correo:</strong> ${socio.correo_electronico}
          </div>
          <div>
            <strong>Teléfono:</strong> ${socio.telefono || 'No registrado'}
          </div>
          <div>
            <strong>Estado:</strong> <span class="${socio.status === 'activo' ? 'text-green-400' : 'text-red-400'}">${socio.status}</span>
          </div>
          <div>
            <strong>Fecha de registro:</strong> ${new Date(socio.fecha_creacion).toLocaleDateString('es-ES')}
          </div>
          <div>
            <strong>Membresía:</strong><br>
            ${membresiaInfo}
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: 600
    })
  } catch (error) {
    console.error('Error obteniendo detalles:', error)
    await AlertConfig.showError('Error', 'No se pudieron cargar los detalles del socio')
  }
}

// Editar socio
async function editarSocio(socioId) {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}`)
    
    if (!response.success) {
      throw new Error(response.error)
    }

    socioSeleccionado = response.data.socio
    await cargarMembresiasDisponibles()
    
    // Llenar formulario con datos actuales
    document.getElementById('nombre-socio').value = socioSeleccionado.nombre_socio || ''
    if (document.getElementById('apellido-paterno')) {
      document.getElementById('apellido-paterno').value = socioSeleccionado.apellido_paterno || ''
    }
    if (document.getElementById('apellido-materno')) {
      document.getElementById('apellido-materno').value = socioSeleccionado.apellido_materno || ''
    }
    document.getElementById('correo-socio').value = socioSeleccionado.correo_electronico || ''
    document.getElementById('telefono-socio').value = socioSeleccionado.telefono || ''
    
    // Solo actualizar el título, no limpiar campos
    actualizarTituloModal()
    modal.classList.remove('hidden')
  } catch (error) {
    console.error('Error cargando socio para editar:', error)
    await AlertConfig.showError('Error', 'No se pudo cargar el socio para editar')
  }
}

// Cambiar estado del socio
async function cambiarEstadoSocio(socioId, accion) {
  const textoAccion = accion === 'enable' ? 'habilitar' : 'deshabilitar'
  
  const result = await Swal.fire({
    title: `¿${textoAccion.charAt(0).toUpperCase() + textoAccion.slice(1)} socio?`,
    text: `Esta acción ${textoAccion}á al socio`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: `Sí, ${textoAccion}`,
    cancelButtonText: 'Cancelar'
  })

  if (!result.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}/${accion}`, {
      method: 'PATCH'
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    await AlertConfig.showSuccess('¡Éxito!', `Socio ${textoAccion}do correctamente`)
    cargarSocios(true)
  } catch (error) {
    console.error(`Error ${textoAccion}ndo socio:`, error)
    await AlertConfig.showError('Error', `No se pudo ${textoAccion} el socio`)
  }
}

// Eliminar socio
async function eliminarSocio(socioId) {
  const result = await Swal.fire({
    title: '¿Eliminar socio?',
    text: 'Esta acción eliminará al socio y todas sus membresías. Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  })

  if (!result.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}`, {
      method: 'DELETE'
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    await AlertConfig.showSuccess('¡Eliminado!', 'Socio eliminado correctamente')
    cargarSocios(true)
  } catch (error) {
    console.error('Error eliminando socio:', error)
    await AlertConfig.showError('Error', 'No se pudo eliminar el socio')
  }
}

// ===== GESTIÓN DE MEMBRESÍAS =====
async function gestionarMembresias(socioId) {
  try {
    // Obtener socio con sus membresías
    const [socioResponse, membresiasResponse] = await Promise.all([
      fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}`),
      fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}/memberships`)
    ])

    if (!socioResponse.success || !membresiasResponse.success) {
      throw new Error('Error cargando datos del socio o membresías')
    }

    const socio = socioResponse.data.socio
    const membresias = membresiasResponse.data.membresias || []

    await mostrarModalGestionMembresias(socio, membresias)
  } catch (error) {
    console.error('Error gestionando membresías:', error)
    await AlertConfig.showError('Error', 'No se pudieron cargar las membresías del socio')
  }
}

async function mostrarModalGestionMembresias(socio, membresias) {
  const membresiasList = membresias.length > 0 ? 
    membresias.map(m => {
      const fechaInicio = new Date(m.fecha_inicio).toLocaleDateString('es-ES')
      const fechaFin = new Date(m.fecha_fin).toLocaleDateString('es-ES')
      const estadoColor = m.status_membresia_socio === 'pagado' ? 'text-green-400' : 'text-red-400'
      const nombre = m.informacion_membresia?.nombre_membresia || 'Membresía'
      const precio = m.informacion_membresia?.precio || 0
      
      return `
        <div class="bg-gray-700 p-4 rounded-lg">
          <div class="flex justify-between items-start mb-2">
            <div>
              <strong>${nombre}</strong> - $${precio}
              <div class="text-sm text-gray-400">${fechaInicio} - ${fechaFin}</div>
            </div>
            <span class="${estadoColor} text-sm font-semibold">
              ${m.status_membresia_socio === 'pagado' ? 'Pagado' : 'No pagado'}
            </span>
          </div>
          ${m.observaciones ? `<div class="text-sm text-gray-400">${m.observaciones}</div>` : ''}
          <div class="flex space-x-2 mt-2">
            ${m.status_membresia_socio !== 'pagado' ? 
              `<button onclick="pagarMembresia('${m.id}')" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500">
                Marcar como pagado
              </button>` : ''
            }
            <button onclick="eliminarMembresia('${m.id}')" class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500">
              Eliminar
            </button>
          </div>
        </div>
      `
    }).join('') : 
    '<p class="text-gray-400 text-center py-4">No hay membresías registradas</p>'

  // Opciones para nueva membresía
  const opcionesMembresias = membresiasDisponibles.map(m => 
    `<option value="${m.uuid_membresia}">${m.nombre_membresia} - $${m.precio}</option>`
  ).join('')

  await Swal.fire({
    title: `Membresías de ${socio.nombre_socio}`,
    html: `
      <div class="text-left">
        <div class="mb-6">
          <h4 class="font-semibold mb-3">Membresías actuales:</h4>
          ${membresiasList}
        </div>
        
        <div class="border-t border-gray-600 pt-6">
          <h4 class="font-semibold mb-3">Asignar nueva membresía:</h4>
          <form id="form-nueva-membresia">
            <select id="nueva-membresia" class="w-full p-2 mb-3 bg-gray-700 border border-gray-600 rounded text-white">
              <option value="">Seleccionar membresía</option>
              ${opcionesMembresias}
            </select>
            <input type="date" id="fecha-inicio-membresia" class="w-full p-2 mb-3 bg-gray-700 border border-gray-600 rounded text-white" value="${new Date().toISOString().split('T')[0]}">
            <textarea id="observaciones-nueva-membresia" placeholder="Observaciones (opcional)" class="w-full p-2 mb-3 bg-gray-700 border border-gray-600 rounded text-white h-20"></textarea>
            <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
              Asignar membresía
            </button>
          </form>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    width: 700,
    didOpen: () => {
      // Configurar evento del formulario
      document.getElementById('form-nueva-membresia').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const uuid_membresia = document.getElementById('nueva-membresia').value
        const fecha_inicio = document.getElementById('fecha-inicio-membresia').value
        const observaciones = document.getElementById('observaciones-nueva-membresia').value
        
        if (!uuid_membresia || !fecha_inicio) {
          await AlertConfig.showError('Error', 'Debe seleccionar una membresía y fecha de inicio')
          return
        }

        try {
          const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socio.id}/membership`, {
            method: 'POST',
            body: JSON.stringify({
              uuid_socio: socio.id,
              uuid_membresia,
              fecha_inicio,
              observaciones,
              status_membresia_socio: 'no_pagado'
            })
          })

          if (!response.success) {
            throw new Error(response.error)
          }

          await AlertConfig.showSuccess('¡Éxito!', 'Membresía asignada correctamente')
          Swal.close()
          cargarSocios(true) // Recargar para mostrar cambios
        } catch (error) {
          console.error('Error asignando membresía:', error)
          await AlertConfig.showError('Error', 'No se pudo asignar la membresía')
        }
      })
    }
  })
}

// Funciones globales para los botones de membresías
window.pagarMembresia = async function(membresiaId) {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/membership/${membresiaId}/pay`, {
      method: 'PATCH'
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    await AlertConfig.showSuccess('¡Pagado!', 'Membresía marcada como pagada')
    Swal.close()
    cargarSocios(true)
  } catch (error) {
    console.error('Error pagando membresía:', error)
    await AlertConfig.showError('Error', 'No se pudo marcar la membresía como pagada')
  }
}

window.eliminarMembresia = async function(membresiaId) {
  const result = await Swal.fire({
    title: '¿Eliminar membresía?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  })

  if (!result.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/membership/${membresiaId}`, {
      method: 'DELETE'
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    await AlertConfig.showSuccess('¡Eliminado!', 'Membresía eliminada correctamente')
    Swal.close()
    cargarSocios(true)
  } catch (error) {
    console.error('Error eliminando membresía:', error)
    await AlertConfig.showError('Error', 'No se pudo eliminar la membresía')
  }
}

// Toggle sidebar móvil
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', inicializar)