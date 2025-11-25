import { API_ENDPOINTS, AuthStorage } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

// Variables globales
let productosActuales = []
let productoEditando = null
let paginaActual = 1
let totalPaginas = 1
let filtrosActivos = {
  busqueda: '',
  status: '',
  precio_min: '',
  precio_max: ''
}

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

// 📋 FUNCIÓN PRINCIPAL: CARGAR PRODUCTOS
async function cargarProductos(pagina = 1) {
  try {
    console.log("[Inventario] Cargando productos página:", pagina)
    
    let url = `${API_ENDPOINTS.products}?page=${pagina}&limit=10`
    const response = await fetch(url, {
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
    
    productosActuales = data.data.productos || []
    paginaActual = data.data.pagination?.current_page || 1
    totalPaginas = data.data.pagination?.total_pages || 1
    
    console.log("[Inventario] Productos cargados:", productosActuales.length)
    renderizarProductos()
    renderizarPaginacion()
    
  } catch (error) {
    console.error("[Inventario] Error:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron cargar los productos'
    })
  }
}

// 🎨 RENDERIZAR PRODUCTOS EN LA TABLA
function renderizarProductos() {
  const tbody = document.querySelector('tbody')
  if (!tbody) return
  
  if (productosActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">No hay productos registrados</td></tr>'
    return
  }

  tbody.innerHTML = productosActuales.map(prod => {
    const statusColor = prod.status_producto === 'en stock' ? '#00DA68' : '#FF3D3D'
    const statusBg = prod.status_producto === 'en stock' ? 'rgba(75, 181, 67, 0.2)' : 'rgba(255, 61, 61, 0.2)'
    const statusText = prod.status_producto === 'en stock' ? 'En Stock' : 'Agotado'
    
    return `
      <tr class="hover:bg-gray-700 transition">
        <td class="px-6 py-4 whitespace-nowrap font-bold text-sm">${prod.codigo_producto}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${prod.nombre_producto}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${prod.descripcion || 'Sin descripción'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">$${parseFloat(prod.costo || 0).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">$${parseFloat(prod.precio || 0).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <span class="px-2 py-1 text-xs rounded-full font-semibold" style="background-color: ${statusBg}; color: ${statusColor};">
            ${statusText}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
          <button class="view-btn text-gray-400 hover:text-blue-400" data-id="${prod.id}" title="Ver Detalles">
            <i data-lucide="eye" class="w-5 h-5"></i>
          </button>
          <button class="edit-btn text-gray-400 hover:text-yellow-400" data-id="${prod.id}" title="Editar">
            <i data-lucide="square-pen" class="w-5 h-5"></i>
          </button>
          <button class="delete-btn text-gray-400 hover:text-red-500" data-id="${prod.id}" title="Eliminar">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()
  
  // Event listeners
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => verProducto(btn.dataset.id))
  })
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editarProducto(btn.dataset.id))
  })
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => eliminarProducto(btn.dataset.id))
  })
}

// 📄 RENDERIZAR PAGINACIÓN
function renderizarPaginacion() {
  const paginacionContainer = document.getElementById('paginacion-container')
  if (!paginacionContainer) return
  
  let html = '<div class="flex justify-center items-center space-x-2 mt-4">'
  
  // Botón anterior
  if (paginaActual > 1) {
    html += `<button onclick="cambiarPagina(${paginaActual - 1})" class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Anterior</button>`
  }
  
  // Números de página
  for (let i = 1; i <= totalPaginas; i++) {
    const active = i === paginaActual ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    html += `<button onclick="cambiarPagina(${i})" class="px-3 py-1 ${active} rounded">${i}</button>`
  }
  
  // Botón siguiente
  if (paginaActual < totalPaginas) {
    html += `<button onclick="cambiarPagina(${paginaActual + 1})" class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Siguiente</button>`
  }
  
  html += '</div>'
  paginacionContainer.innerHTML = html
}

// 📄 CAMBIAR PÁGINA
function cambiarPagina(nuevaPagina) {
  paginaActual = nuevaPagina
  cargarProductos(paginaActual)
}

// 👁️ VER PRODUCTO INDIVIDUAL
async function verProducto(productoId) {
  try {
    console.log("[Inventario] Obteniendo producto:", productoId)
    
    const response = await fetch(`${API_ENDPOINTS.products}/${productoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al obtener producto')
    }
    
    const producto = data.data.producto
    const fechaCreacion = new Date(producto.fecha_creacion.seconds * 1000).toLocaleDateString('es-ES')
    const fechaActualizacion = producto.fecha_actualizacion 
      ? new Date(producto.fecha_actualizacion.seconds * 1000).toLocaleDateString('es-ES')
      : 'No actualizado'
    
    Swal.fire({
      title: 'Detalles del Producto',
      html: `
        <div class="text-left space-y-2">
          <p><strong>Código:</strong> ${producto.codigo_producto}</p>
          <p><strong>Nombre:</strong> ${producto.nombre_producto}</p>
          <p><strong>Descripción:</strong> ${producto.descripcion || 'Sin descripción'}</p>
          <p><strong>Costo:</strong> $${parseFloat(producto.costo).toFixed(2)}</p>
          <p><strong>Precio:</strong> $${parseFloat(producto.precio).toFixed(2)}</p>
          <p><strong>Estado:</strong> ${producto.status_producto}</p>
          <p><strong>Creado:</strong> ${fechaCreacion}</p>
          <p><strong>Actualizado:</strong> ${fechaActualizacion}</p>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#ff3b3b'
    })
    
  } catch (error) {
    console.error("[Inventario] Error al ver producto:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo obtener el producto'
    })
  }
}

// ➕ CREAR NUEVO PRODUCTO
async function crearProducto() {
  const { value: formValues } = await Swal.fire({
    title: 'Nuevo Producto',
    html: `
      <div class="space-y-4">
        <input id="codigo" type="text" placeholder="Código del producto" class="swal2-input" required>
        <input id="nombre" type="text" placeholder="Nombre del producto" class="swal2-input" required>
        <textarea id="descripcion" placeholder="Descripción (opcional)" class="swal2-textarea"></textarea>
        <input id="costo" type="number" step="0.01" placeholder="Costo" class="swal2-input" required>
        <input id="precio" type="number" step="0.01" placeholder="Precio de venta" class="swal2-input" required>
        <select id="status" class="swal2-select">
          <option value="en stock">En Stock</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const codigo = document.getElementById('codigo').value
      const nombre = document.getElementById('nombre').value
      const descripcion = document.getElementById('descripcion').value
      const costo = parseFloat(document.getElementById('costo').value)
      const precio = parseFloat(document.getElementById('precio').value)
      const status = document.getElementById('status').value
      
      if (!codigo || !nombre || !costo || !precio) {
        Swal.showValidationMessage('Por favor completa todos los campos obligatorios')
        return false
      }
      
      if (costo < 0 || precio < 0) {
        Swal.showValidationMessage('El costo y precio deben ser positivos')
        return false
      }
      
      return { codigo_producto: codigo, nombre_producto: nombre, descripcion, costo, precio, status_producto: status }
    },
    showCancelButton: true,
    confirmButtonText: 'Crear Producto',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ff3b3b'
  })
  
  if (formValues) {
    try {
      console.log("[Inventario] Creando producto:", formValues)
      
      const response = await fetch(API_ENDPOINTS.products, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formValues)
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear producto')
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Producto creado correctamente',
        confirmButtonColor: '#ff3b3b'
      })
      
      cargarProductos(paginaActual)
      
    } catch (error) {
      console.error("[Inventario] Error al crear producto:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear el producto'
      })
    }
  }
}

// ✏️ EDITAR PRODUCTO EXISTENTE
async function editarProducto(productoId) {
  const producto = productosActuales.find(p => p.id === productoId)
  if (!producto) return
  
  const { value: formValues } = await Swal.fire({
    title: 'Editar Producto',
    html: `
      <div class="space-y-4">
        <input id="codigo" type="text" value="${producto.codigo_producto}" placeholder="Código del producto" class="swal2-input">
        <input id="nombre" type="text" value="${producto.nombre_producto}" placeholder="Nombre del producto" class="swal2-input">
        <textarea id="descripcion" placeholder="Descripción (opcional)" class="swal2-textarea">${producto.descripcion || ''}</textarea>
        <input id="costo" type="number" step="0.01" value="${producto.costo}" placeholder="Costo" class="swal2-input">
        <input id="precio" type="number" step="0.01" value="${producto.precio}" placeholder="Precio de venta" class="swal2-input">
        <select id="status" class="swal2-select">
          <option value="en stock" ${producto.status_producto === 'en stock' ? 'selected' : ''}>En Stock</option>
          <option value="agotado" ${producto.status_producto === 'agotado' ? 'selected' : ''}>Agotado</option>
        </select>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const codigo = document.getElementById('codigo').value
      const nombre = document.getElementById('nombre').value
      const descripcion = document.getElementById('descripcion').value
      const costo = parseFloat(document.getElementById('costo').value)
      const precio = parseFloat(document.getElementById('precio').value)
      const status = document.getElementById('status').value
      
      if (!codigo || !nombre || !costo || !precio) {
        Swal.showValidationMessage('Por favor completa todos los campos obligatorios')
        return false
      }
      
      if (costo < 0 || precio < 0) {
        Swal.showValidationMessage('El costo y precio deben ser positivos')
        return false
      }
      
      return { codigo_producto: codigo, nombre_producto: nombre, descripcion, costo, precio, status_producto: status }
    },
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ff3b3b'
  })
  
  if (formValues) {
    try {
      console.log("[Inventario] Actualizando producto:", productoId, formValues)
      
      const response = await fetch(`${API_ENDPOINTS.products}/${productoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formValues)
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar producto')
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Producto actualizado correctamente',
        confirmButtonColor: '#ff3b3b'
      })
      
      cargarProductos(paginaActual)
      
    } catch (error) {
      console.error("[Inventario] Error al actualizar producto:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar el producto'
      })
    }
  }
}

// 🗑️ ELIMINAR PRODUCTO
async function eliminarProducto(productoId) {
  const producto = productosActuales.find(p => p.id === productoId)
  if (!producto) return
  
  const confirmResult = await Swal.fire({
    title: '¿Eliminar producto?',
    text: `Se eliminará el producto "${producto.nombre_producto}". Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })
  
  if (confirmResult.isConfirmed) {
    try {
      console.log("[Inventario] Eliminando producto:", productoId)
      
      const response = await fetch(`${API_ENDPOINTS.products}/${productoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthStorage.getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar producto')
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Producto eliminado correctamente',
        confirmButtonColor: '#ff3b3b'
      })
      
      cargarProductos(paginaActual)
      
    } catch (error) {
      console.error("[Inventario] Error al eliminar producto:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo eliminar el producto'
      })
    }
  }
}

// 🔍 BÚSQUEDA DE PRODUCTOS
async function buscarProductos(termino) {
  try {
    console.log("[Inventario] Buscando productos:", termino)
    
    const response = await fetch(`${API_ENDPOINTS.products}/search?search=${encodeURIComponent(termino)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al buscar productos')
    }
    
    productosActuales = data.data.productos || []
    renderizarProductos()
    
    // Limpiar paginación en búsqueda
    const paginacionContainer = document.getElementById('paginacion-container')
    if (paginacionContainer) {
      paginacionContainer.innerHTML = `<p class="text-center text-gray-400 mt-4">Mostrando ${productosActuales.length} resultados para "${termino}"</p>`
    }
    
  } catch (error) {
    console.error("[Inventario] Error en búsqueda:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron buscar los productos'
    })
  }
}

// 🔽 FILTRAR PRODUCTOS
async function filtrarProductos(filtros) {
  try {
    console.log("[Inventario] Filtrando productos:", filtros)
    
    let url = `${API_ENDPOINTS.products}/filter?`
    const params = new URLSearchParams()
    
    if (filtros.status) params.append('status', filtros.status)
    if (filtros.precio_min) params.append('precio_min', filtros.precio_min)
    if (filtros.precio_max) params.append('precio_max', filtros.precio_max)
    
    const response = await fetch(`${url}${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthStorage.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al filtrar productos')
    }
    
    productosActuales = data.data.productos || []
    renderizarProductos()
    
    // Mostrar información del filtro
    const paginacionContainer = document.getElementById('paginacion-container')
    if (paginacionContainer) {
      paginacionContainer.innerHTML = `<p class="text-center text-gray-400 mt-4">Mostrando ${productosActuales.length} productos filtrados</p>`
    }
    
  } catch (error) {
    console.error("[Inventario] Error en filtros:", error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudieron filtrar los productos'
    })
  }
}

// 🎯 EVENT LISTENERS
const crearProductoBtn = document.querySelector('.btn-principal')
if (crearProductoBtn) {
  crearProductoBtn.addEventListener('click', crearProducto)
}

// Búsqueda en tiempo real
const inputBusqueda = document.querySelector('input[placeholder="Ej. Proteína"]')
if (inputBusqueda) {
  let timeoutId = null
  inputBusqueda.addEventListener('input', (e) => {
    clearTimeout(timeoutId)
    const termino = e.target.value.trim()
    
    timeoutId = setTimeout(() => {
      if (termino.length >= 2) {
        buscarProductos(termino)
      } else if (termino.length === 0) {
        cargarProductos(1)
      }
    }, 500)
  })
}

// Filtro por estado
const selectEstado = document.querySelector('select')
if (selectEstado) {
  selectEstado.addEventListener('change', (e) => {
    const estado = e.target.value
    if (estado === 'Todos') {
      cargarProductos(1)
    } else if (estado === 'En Stock') {
      filtrarProductos({ status: 'en stock' })
    } else if (estado === 'Agotado') {
      filtrarProductos({ status: 'agotado' })
    }
  })
}

// Botón aplicar filtros
const btnFiltros = document.querySelector('.btn-secundario')
if (btnFiltros) {
  btnFiltros.addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Filtros Avanzados',
      html: `
        <div class="space-y-4">
          <select id="status-filter" class="swal2-select">
            <option value="">Todos los estados</option>
            <option value="en stock">En Stock</option>
            <option value="agotado">Agotado</option>
          </select>
          <input id="precio-min" type="number" step="0.01" placeholder="Precio mínimo" class="swal2-input">
          <input id="precio-max" type="number" step="0.01" placeholder="Precio máximo" class="swal2-input">
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const status = document.getElementById('status-filter').value
        const precio_min = document.getElementById('precio-min').value
        const precio_max = document.getElementById('precio-max').value
        
        return { status, precio_min, precio_max }
      },
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtros',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00bfff'
    })
    
    if (formValues) {
      const filtros = Object.fromEntries(
        Object.entries(formValues).filter(([key, value]) => value !== '')
      )
      
      if (Object.keys(filtros).length > 0) {
        filtrarProductos(filtros)
      } else {
        cargarProductos(1)
      }
    }
  })
}

// Sidebar toggle
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

// Funciones globales para paginación
window.cambiarPagina = cambiarPagina

// 🚀 INICIALIZACIÓN
cargarProductos()
