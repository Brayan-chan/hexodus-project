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
async function cargarVentas() {
  try {
    console.log("[Ventas] Cargando ventas desde:", API_ENDPOINTS.sales)
    
    const response = await fetch(API_ENDPOINTS.sales, {
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
    console.log("[Ventas] Ventas cargadas:", ventasActuales.length)
    renderizarVentas()
    
  } catch (error) {
    console.error("[Ventas] Error al cargar ventas:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron cargar las ventas'
    })
  }
}

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
      
      cargarVentas()
      
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
      
      return {
        productos: carrito,
        metodo_pago: metodoPago,
        total: total
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
      
      const response = await fetch(API_ENDPOINTS.sales, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formResult)
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
      cargarVentas()
      
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