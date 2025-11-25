import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

// 🔒 VERIFICAR AUTENTICACIÓN
if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

// 📊 ESTADO GLOBAL
let ventasActuales = []
let productosDisponibles = []
let carrito = []
let paginacionActual = {
  current_page: 1,
  per_page: 10,
  total: 0,
  total_pages: 0,
  has_next_page: false,
  has_prev_page: false
}
let filtrosActivos = {
  search: '',
  metodo_pago: '',
  sortBy: 'fecha_creacion',
  sortOrder: 'desc'
}

lucide.createIcons()

// 🕒 ACTUALIZAR FECHA Y HORA
const actualizarFechaHora = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
  const headerEl = document.getElementById("fecha-hora-header")
  if (headerEl) headerEl.textContent = `${fecha} | ${hora}`
}
actualizarFechaHora()
setInterval(actualizarFechaHora, 60000)

// 🚪 LOGOUT
const logoutBtn = document.getElementById("logoutBtn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await logout()
    window.location.href = "/login"
  })
}

// 📦 CARGAR PRODUCTOS DISPONIBLES
async function cargarProductosDisponibles() {
  try {
    console.log("[Ventas] Cargando productos disponibles...")
    
    const response = await fetch(`${API_ENDPOINTS.products}?page=1&limit=100&status_produto=en stock`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al cargar productos')
    }
    
    productosDisponibles = data.data?.productos || []
    console.log("[Ventas] Productos cargados:", productosDisponibles.length)
    
  } catch (error) {
    console.error("[Ventas] Error al cargar productos:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron cargar los productos'
    })
  }
}

// 📋 CARGAR VENTAS
async function cargarVentas(page = 1) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: paginacionActual.per_page.toString(),
      sortBy: filtrosActivos.sortBy,
      sortOrder: filtrosActivos.sortOrder
    })
    
    console.log("[Ventas] Cargando ventas desde:", `${API_ENDPOINTS.sales}?${params}`)
    
    const response = await fetch(`${API_ENDPOINTS.sales}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al cargar ventas')
    }
    
    ventasActuales = data.data?.ventas || []
    paginacionActual = data.data?.pagination || paginacionActual
    
    console.log("[Ventas] Ventas cargadas:", ventasActuales.length)
    console.log("[Ventas] Paginación:", paginacionActual)
    
    renderizarVentas()
    renderizarPaginacion()
    
  } catch (error) {
    console.error("[Ventas] Error al cargar ventas:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron cargar las ventas'
    })
  }
}

// 🎨 RENDERIZAR PAGINACIÓN
function renderizarPaginacion() {
  const paginacionContainer = document.getElementById('paginacion-ventas')
  if (!paginacionContainer) return
  
  const { current_page, total_pages, has_prev_page, has_next_page, total } = paginacionActual
  
  paginacionContainer.innerHTML = `
    <div class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-400">
        Mostrando ${ventasActuales.length} de ${total} ventas
      </div>
      <div class="flex items-center space-x-2">
        <button 
          ${!has_prev_page ? 'disabled' : ''} 
          onclick="cambiarPagina(${current_page - 1})" 
          class="px-3 py-2 text-sm rounded-lg ${!has_prev_page ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-500'}">
          Anterior
        </button>
        
        <div class="flex items-center space-x-1">
          ${generarNumerosPagina(current_page, total_pages)}
        </div>
        
        <button 
          ${!has_next_page ? 'disabled' : ''} 
          onclick="cambiarPagina(${current_page + 1})" 
          class="px-3 py-2 text-sm rounded-lg ${!has_next_page ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-500'}">
          Siguiente
        </button>
      </div>
    </div>
  `
}

function generarNumerosPagina(currentPage, totalPages) {
  const maxVisible = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  
  let pages = []
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(`
      <button 
        onclick="cambiarPagina(${i})" 
        class="px-3 py-2 text-sm rounded-lg ${i === currentPage ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}">
        ${i}
      </button>
    `)
  }
  
  return pages.join('')
}

function cambiarPagina(page) {
  if (page < 1 || page > paginacionActual.total_pages) return
  cargarVentas(page)
}

// Hacer funciones disponibles globalmente
window.cambiarPagina = cambiarPagina
window.eliminarDelCarrito = eliminarDelCarrito
window.limpiarFiltros = limpiarFiltros

// 🎨 RENDERIZAR VENTAS EN LA TABLA
function renderizarVentas() {
  const tbody = document.querySelector('tbody')
  if (!tbody) return
  
  if (ventasActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>'
    return
  }

  tbody.innerHTML = ventasActuales.map(venta => {
    const fechaVenta = venta.fecha_creacion?.seconds 
      ? new Date(venta.fecha_creacion.seconds * 1000).toLocaleDateString('es-ES')
      : new Date(venta.fecha_creacion).toLocaleDateString('es-ES')
    
    const numeroVenta = venta.numero_venta || venta.id?.substring(0, 8) || 'N/A'
    
    return `
      <tr class="hover:bg-gray-700 transition duration-200">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">#${numeroVenta}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${fechaVenta}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${venta.productos?.length || 0} productos</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">$${parseFloat(venta.total || 0).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <span class="px-3 py-1 text-xs font-semibold rounded-full" style="background-color: rgba(75, 181, 67, 0.2); color: #00DA68;">
            ${venta.metodo_pago || 'Efectivo'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
          <button class="view-btn text-gray-400 hover:text-blue-400" data-id="${venta.id}" title="Ver Detalles">
            <i data-lucide="eye" class="w-5 h-5"></i>
          </button>
          <button class="delete-btn text-gray-400 hover:text-red-500" data-id="${venta.id}" title="Eliminar">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()
  
  // 🎯 EVENT LISTENERS PARA BOTONES
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => verDetalleVenta(btn.dataset.id))
  })

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarVenta(btn.dataset.id))
  })
}

// 👁️ VER DETALLE DE VENTA
async function verDetalleVenta(ventaId) {
  try {
    console.log("[Ventas] Obteniendo detalle de venta:", ventaId)
    
    const response = await fetch(`${API_ENDPOINTS.sales}/${ventaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al obtener venta')
    }
    
    const venta = data.data.venta
    const fechaVenta = venta.fecha_creacion?.seconds 
      ? new Date(venta.fecha_creacion.seconds * 1000).toLocaleDateString('es-ES')
      : new Date(venta.fecha_creacion).toLocaleDateString('es-ES')
    
    let productosHtml = ''
    if (venta.productos && venta.productos.length > 0) {
      productosHtml = venta.productos.map(producto => `
        <tr>
          <td class="px-3 py-2 border-b border-gray-600">${producto.nombre_producto}</td>
          <td class="px-3 py-2 border-b border-gray-600 text-center">${producto.cantidad}</td>
          <td class="px-3 py-2 border-b border-gray-600 text-right">$${parseFloat(producto.precio_unitario).toFixed(2)}</td>
          <td class="px-3 py-2 border-b border-gray-600 text-right">$${parseFloat(producto.subtotal).toFixed(2)}</td>
        </tr>
      `).join('')
    }
    
    Swal.fire({
      title: `Detalle de Venta #${venta.numero_venta || venta.id.substring(0, 8)}`,
      html: `
        <div class="text-left">
          <div class="mb-4">
            <p><strong>Fecha:</strong> ${fechaVenta}</p>
            <p><strong>Método de Pago:</strong> ${venta.metodo_pago}</p>
            <p><strong>Total:</strong> $${parseFloat(venta.total).toFixed(2)}</p>
          </div>
          <h4 class="font-semibold mb-2">Productos:</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Producto</th>
                  <th class="px-3 py-2 text-center">Cant.</th>
                  <th class="px-3 py-2 text-right">Precio</th>
                  <th class="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productosHtml}
              </tbody>
            </table>
          </div>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#ff3b3b'
    })
    
  } catch (error) {
    console.error("[Ventas] Error al ver detalle:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo obtener el detalle de la venta'
    })
  }
}

// 🗑️ ELIMINAR VENTA
async function eliminarVenta(ventaId) {
  const venta = ventasActuales.find(v => v.id === ventaId)
  if (!venta) return
  
  const numeroVenta = venta.numero_venta || venta.id.substring(0, 8)
  const confirmResult = await Swal.fire({
    title: '¿Eliminar venta?',
    text: `Se eliminará la venta #${numeroVenta}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })
  
  if (confirmResult.isConfirmed) {
    try {
      console.log("[Ventas] Eliminando venta:", ventaId)
      
      const response = await fetch(`${API_ENDPOINTS.sales}/${ventaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar venta')
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: 'Venta eliminada correctamente',
        confirmButtonColor: '#ff3b3b'
      })
      
      cargarVentas(paginacionActual.current_page)
      
    } catch (error) {
      console.error("[Ventas] Error al eliminar venta:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo eliminar la venta'
      })
    }
  }
}

// 🛒 GESTIÓN DEL CARRITO
function agregarAlCarrito(producto, cantidad) {
  const existente = carrito.find(item => item.id === producto.id)
  
  if (existente) {
    existente.cantidad += cantidad
    existente.subtotal = existente.cantidad * existente.precio_unitario
  } else {
    carrito.push({
      id: producto.id,
      codigo_producto: producto.codigo_producto,
      nombre_producto: producto.nombre_producto,
      precio_unitario: producto.precio,
      cantidad: cantidad,
      subtotal: cantidad * producto.precio
    })
  }
  
  actualizarVistaCarrito()
}

function eliminarDelCarrito(productoId) {
  carrito = carrito.filter(item => item.id !== productoId)
  actualizarVistaCarrito()
}

// Hacer la función disponible globalmente
window.eliminarDelCarrito = eliminarDelCarrito

function actualizarVistaCarrito() {
  const carritoContainer = document.getElementById('carrito-items')
  const totalContainer = document.getElementById('carrito-total')
  
  if (!carritoContainer || !totalContainer) return
  
  if (carrito.length === 0) {
    carritoContainer.innerHTML = '<p class="text-gray-400 text-center py-4">Carrito vacío</p>'
    totalContainer.textContent = '$0.00'
    return
  }
  
  carritoContainer.innerHTML = carrito.map(item => `
    <div class="flex justify-between items-center py-2 border-b border-gray-600">
      <div>
        <div class="font-medium text-sm">${item.nombre_producto}</div>
        <div class="text-xs text-gray-400">${item.cantidad} x $${item.precio_unitario.toFixed(2)}</div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="font-semibold">$${item.subtotal.toFixed(2)}</span>
        <button onclick="eliminarDelCarrito('${item.id}')" class="text-red-400 hover:text-red-300">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('')
  
  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  totalContainer.textContent = `$${total.toFixed(2)}`
  
  lucide.createIcons()
}

// 🔍 BÚSQUEDA Y FILTROS
async function buscarVentas() {
  const searchInput = document.getElementById('buscar-venta')
  const metodoPagoSelect = document.getElementById('metodo-pago-filtro')
  
  if (!searchInput || !metodoPagoSelect) return
  
  const searchTerm = searchInput.value.trim()
  const metodoPago = metodoPagoSelect.value
  
  try {
    let url = API_ENDPOINTS.sales
    const params = new URLSearchParams({
      page: '1',
      limit: paginacionActual.per_page.toString(),
      sortBy: filtrosActivos.sortBy,
      sortOrder: filtrosActivos.sortOrder
    })
    
    // Si hay términos de búsqueda, usar endpoint de búsqueda
    if (searchTerm) {
      url = `${API_ENDPOINTS.sales}/search`
      params.append('search', searchTerm)
    }
    
    console.log("[Ventas] Buscando ventas:", { searchTerm, metodoPago })
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al buscar ventas')
    }
    
    let ventas = data.data?.ventas || []
    
    // Filtrar por método de pago en el frontend si es necesario
    if (metodoPago && metodoPago !== 'todos') {
      ventas = ventas.filter(venta => {
        const metodo = venta.observaciones?.toLowerCase().includes(metodoPago.toLowerCase())
        return metodo
      })
    }
    
    ventasActuales = ventas
    
    // Actualizar paginación para resultados de búsqueda
    paginacionActual = {
      current_page: 1,
      per_page: paginacionActual.per_page,
      total: ventas.length,
      total_pages: 1,
      has_next_page: false,
      has_prev_page: false
    }
    
    renderizarVentas()
    renderizarPaginacion()
    
  } catch (error) {
    console.error("[Ventas] Error al buscar:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Error al buscar ventas'
    })
  }
}

function limpiarFiltros() {
  const searchInput = document.getElementById('buscar-venta')
  const metodoPagoSelect = document.getElementById('metodo-pago-filtro')
  
  if (searchInput) searchInput.value = ''
  if (metodoPagoSelect) metodoPagoSelect.value = 'todos'
  
  // Recargar ventas sin filtros
  cargarVentas(1)
}

// ➕ CREAR NUEVA VENTA
async function crearNuevaVenta() {
  await cargarProductosDisponibles() // Asegurar productos actualizados
  
  const { value: formResult } = await Swal.fire({
    title: 'Nueva Venta',
    html: `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Seleccionar Producto:</label>
          <select id="producto-select" class="swal2-select w-full">
            <option value="">-- Seleccionar Producto --</option>
            ${productosDisponibles.map(p => 
              `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.cantidad_stock || 0}">
                ${p.nombre_producto} - $${p.precio} (Stock: ${p.cantidad_stock || 0})
              </option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Cantidad:</label>
          <input id="cantidad-input" type="number" min="1" value="1" class="swal2-input">
        </div>
        <button id="agregar-producto-btn" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Agregar al Carrito
        </button>
        <div class="border-t pt-4">
          <h4 class="font-semibold mb-2">Carrito de Compras:</h4>
          <div id="carrito-items" class="max-h-40 overflow-y-auto mb-2">
            <p class="text-gray-400 text-center py-4">Carrito vacío</p>
          </div>
          <div class="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span id="carrito-total">$0.00</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Método de Pago:</label>
          <select id="metodo-pago" class="swal2-select w-full">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
      </div>
    `,
    width: 600,
    showCancelButton: true,
    confirmButtonText: 'Procesar Venta',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ff3b3b',
    preConfirm: () => {
      if (carrito.length === 0) {
        Swal.showValidationMessage('El carrito está vacío')
        return false
      }
      
      const metodoPago = document.getElementById('metodo-pago').value
      const total = carrito.reduce((sum, item) => sum + item.subtotal, 0)
      
      // Convertir carrito para que coincida con el schema del backend
      const productosParaBackend = carrito.map(item => ({
        producto_id: item.id, // Cambiar 'id' por 'producto_id'
        codigo_producto: item.codigo_producto,
        nombre_producto: item.nombre_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }))
      
      return {
        productos: productosParaBackend,
        observaciones: `Método de pago: ${metodoPago}`,
        total: total // Mantener para el frontend, aunque el backend no lo use
      }
    },
    didOpen: () => {
      carrito = [] // Limpiar carrito al abrir
      
      const agregarBtn = document.getElementById('agregar-producto-btn')
      const productoSelect = document.getElementById('producto-select')
      const cantidadInput = document.getElementById('cantidad-input')
      
      agregarBtn.addEventListener('click', () => {
        const productoId = productoSelect.value
        const cantidad = parseInt(cantidadInput.value)
        
        if (!productoId || cantidad <= 0) {
          Swal.showValidationMessage('Selecciona un producto y cantidad válida')
          return
        }
        
        const productoSeleccionado = productosDisponibles.find(p => p.id === productoId)
        const stockDisponible = productoSeleccionado.cantidad_stock || 0
        
        if (cantidad > stockDisponible) {
          Swal.showValidationMessage(`Stock insuficiente. Disponible: ${stockDisponible}`)
          return
        }
        
        agregarAlCarrito(productoSeleccionado, cantidad)
        
        // Resetear formulario
        productoSelect.value = ''
        cantidadInput.value = '1'
        
        // Limpiar mensaje de validación
        const validationMessage = document.querySelector('.swal2-validation-message')
        if (validationMessage) validationMessage.style.display = 'none'
      })
    }
  })
  
  if (formResult) {
    try {
      console.log("[Ventas] Procesando venta:", formResult)
      
      // Crear objeto para enviar al backend (sin el campo total)
      const ventaData = {
        productos: formResult.productos,
        observaciones: formResult.observaciones
      }
      
      const response = await fetch(API_ENDPOINTS.sales, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ventaData)
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar venta')
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Venta Exitosa!',
        text: `Venta procesada correctamente por $${formResult.total.toFixed(2)}`,
        confirmButtonColor: '#ff3b3b'
      })
      
      carrito = [] // Limpiar carrito
      cargarVentas(paginacionActual.current_page) // Mantener página actual
      
    } catch (error) {
      console.error("[Ventas] Error al crear venta:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo procesar la venta'
      })
    }
  }
}

// 🎯 EVENT LISTENERS
const crearVentaBtn = document.querySelector('.btn-principal')
if (crearVentaBtn) {
  crearVentaBtn.addEventListener('click', crearNuevaVenta)
}

// Event listeners para filtros
const aplicarFiltrosBtn = document.getElementById('aplicar-filtros-btn')
if (aplicarFiltrosBtn) {
  aplicarFiltrosBtn.addEventListener('click', buscarVentas)
}

const limpiarFiltrosBtn = document.getElementById('limpiar-filtros-btn')
if (limpiarFiltrosBtn) {
  limpiarFiltrosBtn.addEventListener('click', limpiarFiltros)
}

// Búsqueda en tiempo real
const buscarInput = document.getElementById('buscar-venta')
if (buscarInput) {
  let timeoutId
  buscarInput.addEventListener('input', () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(buscarVentas, 500) // Búsqueda con delay de 500ms
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

// 🚀 INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  cargarProductosDisponibles()
  cargarVentas()
})