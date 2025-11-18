import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

let productosActuales = []
let productoEditando = null
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

async function cargarProductos() {
  try {
    console.log("[v0] Cargando productos desde:", API_ENDPOINTS.products)
    const data = await fetchWithAuth(API_ENDPOINTS.products)
    if (!data.success) throw new Error(data.error || 'Error desconocido')
    // La respuesta viene con estructura data.data.products
    productosActuales = Array.isArray(data.data) ? data.data : data.data.products || []
    console.log("[v0] Productos cargados:", productosActuales.length)
    renderizarProductos()
  } catch (error) {
    console.error("[v0] Error al cargar productos:", error)
    await AlertConfig.showError('Error', error.message || 'No se pudieron cargar los productos')
  }
}

function renderizarProductos() {
  const tbody = document.querySelector('tbody')
  if (!tbody) return
  
  if (productosActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay productos registrados</td></tr>'
    return
  }

  tbody.innerHTML = productosActuales.map(prod => `
    <tr class="hover:bg-gray-700 transition">
      <td class="px-6 py-4 whitespace-nowrap font-bold text-sm">#${prod.codigo || prod.id.substring(0, 8)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${prod.nombre || 'N/A'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm">${prod.stock || 0}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">$${parseFloat(prod.precio || 0).toFixed(2)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">
        <span class="px-2 py-1 text-xs rounded-full font-semibold" style="background-color: ${prod.stock > 10 ? 'rgba(75, 181, 67, 0.2)' : 'rgba(255, 61, 61, 0.2)'}; color: ${prod.stock > 10 ? '#00DA68' : '#FF3D3D'};">
          ${prod.stock > 10 ? 'Normal' : 'Bajo'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
        <button class="edit-btn text-gray-400 hover:text-yellow-400" data-id="${prod.id}" title="Editar"><i data-lucide="square-pen" class="w-5 h-5"></i></button>
        <button class="delete-btn text-gray-400 hover:text-red-500" data-id="${prod.id}" title="Eliminar"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
      </td>
    </tr>
  `).join('')

  lucide.createIcons()
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarProducto(btn.dataset.id))
  })

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editarProducto(btn.dataset.id))
  })
}

async function eliminarProducto(productoId) {
  const confirm = await AlertConfig.showConfirm('Eliminar Producto', '¿Está seguro de que desea eliminar este producto?')
  if (!confirm.isConfirmed) return

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.products}/${productoId}`, { method: 'DELETE' })
    if (!response.success) throw new Error(response.error)
    await AlertConfig.showSuccess('Éxito', 'Producto eliminado correctamente')
    cargarProductos()
  } catch (error) {
    console.error("[v0] Error:", error)
    await AlertConfig.showError('Error', error.message)
  }
}

async function editarProducto(productoId) {
  const producto = productosActuales.find(p => p.id === productoId)
  if (!producto) return
  
  await AlertConfig.showSuccess('Editar Producto', `Producto: ${producto.nombre}\nStock: ${producto.stock}\nPrecio: $${producto.precio}`)
}

const crearProductoBtn = document.querySelector('.btn-principal')
if (crearProductoBtn) {
  crearProductoBtn.addEventListener('click', async () => {
    await AlertConfig.showSuccess('Nuevo Producto', 'Función de crear producto en desarrollo')
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

cargarProductos()
