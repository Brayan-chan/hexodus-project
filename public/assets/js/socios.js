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

// Modal
const modal = document.getElementById('modal-agregar-socio')
const btnAgregar = document.getElementById('btn-agregar-socio')
const btnCerrar = document.getElementById('btn-cerrar-modal')
const btnCancelar = document.getElementById('btn-cancelar-registro')

if (btnAgregar) {
  btnAgregar.addEventListener('click', () => {
    modal.classList.remove('hidden')
    document.getElementById('nombre-socio').value = ''
    document.getElementById('correo-socio').value = ''
    document.getElementById('telefono-socio').value = ''
    document.getElementById('direccion-socio').value = ''
    document.getElementById('membresia').value = ''
    document.getElementById('fecha-inicio').value = ''
  })
}

const closeModal = () => {
  if (modal) modal.classList.add('hidden')
}

if (btnCerrar) btnCerrar.addEventListener('click', closeModal)
if (btnCancelar) btnCancelar.addEventListener('click', closeModal)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
    closeModal()
  }
})

// Cargar socios
async function cargarSocios() {
  try {
    console.log("[v0] Cargando socios...")
    
    const response = await fetchWithAuth(API_ENDPOINTS.socios)

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido')
    }

    sociosActuales = Array.isArray(response.data) ? response.data : response.data.socios || []
    console.log("[v0] Socios cargados:", sociosActuales.length)
    renderizarSocios()
  } catch (error) {
    console.error("[v0] Error al cargar socios:", error)
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar los socios')
  }
}

// Renderizar tabla de socios
function renderizarSocios() {
  const tbody = document.querySelector('tbody')
  
  if (!tbody) return

  if (sociosActuales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-400">
          No hay socios para mostrar
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = sociosActuales.map(socio => {
    const estado = socio.estado === 'activo' 
      ? '<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full" style="background-color: rgba(75, 181, 67, 0.2); color: #00DA68;">Al corriente</span>'
      : '<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full" style="background-color: rgba(255, 61, 61, 0.2); color: #FF3D3D;">Adeudo</span>'

    return `
      <tr class="hover:bg-gray-700 transition duration-200">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#${socio.codigo || socio.id.substring(0, 8)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${socio.nombre || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${socio.membresia_tipo || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400">${socio.membresia_vencimiento || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center">${estado}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
          <button class="text-gray-400 hover:text-yellow-400 edit-btn" data-id="${socio.id}" title="Editar"><i data-lucide="square-pen" class="w-5 h-5"></i></button>
          <button class="text-gray-400 hover:text-red-500 delete-btn" data-id="${socio.id}" title="Eliminar"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editarSocio(btn.dataset.id))
  })

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarSocio(btn.dataset.id))
  })
}

const form = document.querySelector('form')
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const nombre = document.getElementById('nombre-socio').value.trim()
    const email = document.getElementById('correo-socio').value.trim()
    const telefono = document.getElementById('telefono-socio').value.trim()
    const direccion = document.getElementById('direccion-socio').value.trim()
    const membresia = document.getElementById('membresia').value
    const fecha_inicio = document.getElementById('fecha-inicio').value

    if (!nombre || !email) {
      await AlertConfig.showError('Error', 'Nombre y correo son obligatorios')
      return
    }

    try {
      const response = await fetchWithAuth(API_ENDPOINTS.socios, {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          direccion: direccion || '',
          membresia_tipo: membresia || '',
          membresia_fecha_inicio: fecha_inicio || new Date().toISOString().split('T')[0],
          estado: 'activo'
        })
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      await AlertConfig.showSuccess('¡SOCIO REGISTRADO!', 'El socio ha sido registrado exitosamente')
      closeModal()
      cargarSocios()
    } catch (error) {
      console.error("[v0] Error:", error)
      await AlertConfig.showError('Error', error.message)
    }
  })
}

async function eliminarSocio(socioId) {
  const confirm = await AlertConfig.showConfirm('Eliminar Socio', '¿Está seguro de que desea eliminar este socio? Esta acción no se puede deshacer.')
  
  if (!confirm.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.socios}/${socioId}`, {
      method: 'DELETE'
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    await AlertConfig.showSuccess('¡SOCIO ELIMINADO!', 'El socio ha sido eliminado exitosamente')
    cargarSocios()
  } catch (error) {
    console.error("[v0] Error:", error)
    await AlertConfig.showError('Error', error.message)
  }
}

async function editarSocio(socioId) {
  const socio = sociosActuales.find(s => s.id === socioId)
  if (!socio) return

  document.getElementById('nombre-socio').value = socio.nombre || ''
  document.getElementById('correo-socio').value = socio.email || ''
  document.getElementById('telefono-socio').value = socio.telefono || ''
  document.getElementById('direccion-socio').value = socio.direccion || ''
  document.getElementById('membresia').value = socio.membresia_tipo || ''
  document.getElementById('fecha-inicio').value = socio.membresia_fecha_inicio || ''

  if (modal) modal.classList.remove('hidden')
}

// Filtros
const estatusSelect = document.getElementById('estatus')
if (estatusSelect) {
  estatusSelect.addEventListener('change', (e) => {
    filtroEstado = e.target.value
  })
}

const buscarInput = document.getElementById('buscar')
if (buscarInput) {
  buscarInput.addEventListener('input', (e) => {
    textoBusqueda = e.target.value
  })
}

// Botón aplicar filtros
const buttons = document.querySelectorAll('button')
buttons.forEach(btn => {
  if (btn.textContent.includes('Aplicar Filtros')) {
    btn.addEventListener('click', cargarSocios)
  }
})

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

// Cargar socios al inicio
cargarSocios()