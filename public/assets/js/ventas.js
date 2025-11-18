import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

let ventasActuales = []
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

async function cargarVentas() {
  try {
    console.log("[v0] Cargando ventas desde:", API_ENDPOINTS.sales)
    const data = await fetchWithAuth(API_ENDPOINTS.sales)
    if (!data.success) throw new Error(data.error || 'Error desconocido')
    // La respuesta viene con estructura data.data.sales
    ventasActuales = Array.isArray(data.data) ? data.data : data.data.sales || []
    console.log("[v0] Ventas cargadas:", ventasActuales.length)
    renderizarVentas()
  } catch (error) {
    console.error("[v0] Error al cargar ventas:", error)
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar las ventas')
  }
}

function renderizarVentas() {
  const tbody = document.querySelector('tbody')
  if (!tbody) return
  
  if (ventasActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>'
    return
  }

  tbody.innerHTML = ventasActuales.map(venta => `
    <tr class="hover:bg-gray-700 transition duration-200">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">#${venta.numero || venta.id.substring(0, 8)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(venta.fecha_creacion).toLocaleDateString('es-ES')}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">$${parseFloat(venta.monto_total || 0).toFixed(2)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">
        <span class="px-3 py-1 text-xs font-semibold rounded-full" style="background-color: rgba(75, 181, 67, 0.2); color: #00DA68;">${venta.tipo_pago || 'Efectivo'}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
        <button class="view-btn text-gray-400 hover:text-blue-400" data-id="${venta.id}" title="Ver"><i data-lucide="eye" class="w-5 h-5"></i></button>
        <button class="delete-btn text-gray-400 hover:text-red-500" data-id="${venta.id}" title="Eliminar"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
      </td>
    </tr>
  `).join('')

  lucide.createIcons()
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarVenta(btn.dataset.id))
  })

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => verDetalleVenta(btn.dataset.id))
  })
}

async function eliminarVenta(ventaId) {
  const confirm = await AlertConfig.showConfirm('Eliminar Venta', '¿Está seguro de que desea eliminar esta venta?')
  if (!confirm.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.sales}/${ventaId}`, { method: 'DELETE' })
    if (!response.success) throw new Error(response.error)
    await AlertConfig.showSuccess('Éxito', 'Venta eliminada correctamente')
    cargarVentas()
  } catch (error) {
    console.error("[v0] Error:", error)
    await AlertConfig.showError('Error', error.message)
  }
}

async function verDetalleVenta(ventaId) {
  const venta = ventasActuales.find(v => v.id === ventaId)
  if (venta) {
    await AlertConfig.showSuccess('Detalle de Venta', `Venta #${venta.numero}\nTotal: $${parseFloat(venta.monto_total).toFixed(2)}\nMétodo: ${venta.tipo_pago}`)
  }
}

const crearVentaBtn = document.querySelector('.btn-principal')
if (crearVentaBtn) {
  crearVentaBtn.addEventListener('click', async () => {
    await AlertConfig.showSuccess('Nueva Venta', 'Función de crear venta en desarrollo')
    cargarVentas()
  })
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

cargarVentas()