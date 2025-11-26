import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

lucide.createIcons()

// Variables globales
let currentReportData = null;
let currentReportType = null;

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

const logoutBtn = document.getElementById("logoutBtn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await logout()
    window.location.href = "/login"
  })
}

// Función para mostrar el loading
function mostrarLoading() {
  Swal.fire({
    title: 'Generando Reporte...',
    text: 'Por favor espera mientras procesamos la información',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  });
}

// Funciones para consumir endpoints de reportes
async function obtenerReporte(endpoint, tipo) {
  try {
    console.log(`Obteniendo reporte ${tipo} desde:`, endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthStorage.getToken()}`
      }
    });
    
    console.log(`Respuesta para ${tipo}:`, response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Datos obtenidos para ${tipo}:`, data);
      return data;
    } else {
      const errorText = await response.text();
      console.error(`Error ${response.status} para ${tipo}:`, errorText);
      throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener reporte'}`);
    }
  } catch (error) {
    console.error(`Error al obtener reporte ${tipo}:`, error);
    throw error;
  }
}

// Función para mostrar estadísticas
function mostrarEstadisticas(estadisticas, tipo) {
  const statsContainer = document.getElementById('reporte-stats');
  let html = '';
  
  if (estadisticas) {
    switch (tipo) {
      case 'inventario':
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400">${estadisticas.totalProductos || 0}</div>
            <div class="text-sm text-gray-300">Total Productos</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400">$${estadisticas.valorTotal || '0.00'}</div>
            <div class="text-sm text-gray-300">Valor Total</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-red-400">${estadisticas.productosAgotados || 0}</div>
            <div class="text-sm text-gray-300">Agotados</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-400">${estadisticas.productosBajoStock || 0}</div>
            <div class="text-sm text-gray-300">Bajo Stock</div>
          </div>
        `;
        break;
      case 'ventas':
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400">${estadisticas.total_ventas || 0}</div>
            <div class="text-sm text-gray-300">Total Ventas</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400">$${estadisticas.monto_total || '0.00'}</div>
            <div class="text-sm text-gray-300">Ingresos</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-400">$${estadisticas.promedio_venta || '0.00'}</div>
            <div class="text-sm text-gray-300">Promedio</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-400">${estadisticas.productos_vendidos || 0}</div>
            <div class="text-sm text-gray-300">Productos</div>
          </div>
        `;
        break;
      case 'membresias':
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400">${estadisticas.total_membresias || 0}</div>
            <div class="text-sm text-gray-300">Total</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400">${estadisticas.membresias_pagadas || 0}</div>
            <div class="text-sm text-gray-300">Pagadas</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-red-400">${estadisticas.membresias_no_pagadas || 0}</div>
            <div class="text-sm text-gray-300">Pendientes</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-400">$${estadisticas.ingresos_por_membresias || '0.00'}</div>
            <div class="text-sm text-gray-300">Ingresos</div>
          </div>
        `;
        break;
      case 'socios':
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400">${estadisticas.total_socios || 0}</div>
            <div class="text-sm text-gray-300">Total Socios</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400">${estadisticas.socios_con_membresia_activa || 0}</div>
            <div class="text-sm text-gray-300">Con Membresía</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-400">${estadisticas.tasa_socios_con_membresia || 0}%</div>
            <div class="text-sm text-gray-300">% Membresías</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-400">${estadisticas.socios_activos || 0}</div>
            <div class="text-sm text-gray-300">Activos</div>
          </div>
        `;
        break;
      case 'historial':
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400">${estadisticas.total_reportes || 0}</div>
            <div class="text-sm text-gray-300">Total Reportes</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400">${estadisticas.reportes_hoy || 0}</div>
            <div class="text-sm text-gray-300">Hoy</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-400">${estadisticas.tipo_mas_frecuente || 'N/A'}</div>
            <div class="text-sm text-gray-300">Más Usado</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-400">${estadisticas.ultimo_reporte || 'N/A'}</div>
            <div class="text-sm text-gray-300">Último</div>
          </div>
        `;
        break;
      default:
        html = `
          <div class="bg-gray-700 p-4 rounded-lg text-center col-span-4">
            <div class="text-xl font-bold text-blue-400">Información Disponible</div>
            <div class="text-sm text-gray-300">Datos del reporte cargados correctamente</div>
          </div>
        `;
    }
  }
  
  statsContainer.innerHTML = html;
}

// Función para mostrar tabla de datos
function mostrarTabla(data, tipo) {
  const tableHead = document.getElementById('reporte-table-head');
  const tableBody = document.getElementById('reporte-table-body');
  
  let headerHtml = '';
  let bodyHtml = '';
  
  switch (tipo) {
    case 'inventario':
      if (data.datos && data.datos.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Producto</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Stock</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Precio</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Valor Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Estado</th>
          </tr>
        `;
        bodyHtml = data.datos.map(producto => {
          const stock = producto.cantidad_stock || producto.stock || 0;
          const precio = producto.precio || 0;
          return `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${producto.nombre_producto || 'Sin nombre'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">$${precio}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">$${(stock * precio).toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                producto.status_producto === 'en stock' ? 'bg-green-800 text-green-100' : 
                producto.status_producto === 'stock bajo' ? 'bg-yellow-800 text-yellow-100' : 'bg-red-800 text-red-100'
              }">
                ${producto.status_producto === 'en stock' ? 'Disponible' : 
                  producto.status_producto === 'stock bajo' ? 'Bajo Stock' : 'Agotado'}
              </span>
            </td>
          </tr>
        `}).join('');
      }
      break;
      
    case 'ventas':
      if (data.datos && data.datos.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Vendedor</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Productos</th>
          </tr>
        `;
        bodyHtml = data.datos.map(venta => `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${venta.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${venta.id_usuario || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">$${venta.total || venta.monto_total || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${venta.fecha_creacion ? new Date(venta.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${venta.productos ? venta.productos.length : 1} items</td>
          </tr>
        `).join('');
      }
      break;
      
    case 'membresias':
      if (data.datos && data.datos.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Socio</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Membresía</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Inicio</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Fin</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Precio</th>
          </tr>
        `;
        bodyHtml = data.datos.map(membresia => `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${membresia.socio_info?.nombre_socio || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${membresia.membresia_info?.nombre_membresia || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                membresia.status_membresia_socio === 'pagado' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
              }">
                ${membresia.status_membresia_socio}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${new Date(membresia.fecha_inicio).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${new Date(membresia.fecha_fin).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">$${membresia.membresia_info?.precio || 0}</td>
          </tr>
        `).join('');
      }
      break;
      
    case 'socios':
      if (data.datos && data.datos.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Teléfono</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Membresía</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Registro</th>
          </tr>
        `;
        bodyHtml = data.datos.map(socio => `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${socio.nombre_socio}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${socio.correo_electronico}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${socio.telefono || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${
              socio.membresia_activa ? 
                `${socio.membresia_activa.status_membresia_socio === 'pagado' ? '✅ ' : '⏳ '}Membresía activa` : 
                'Sin membresía'
            }</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                socio.status === 'activo' ? 'bg-green-800 text-green-100' : 'bg-gray-800 text-gray-100'
              }">
                ${socio.status === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${socio.fecha_creacion ? new Date(socio.fecha_creacion.seconds ? socio.fecha_creacion.seconds * 1000 : socio.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('');
      }
      break;
      
    case 'usuarios':
      if (data.datos && data.datos.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Rol</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Registro</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Último Acceso</th>
          </tr>
        `;
        bodyHtml = data.datos.map(usuario => `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${usuario.nombre || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${usuario.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${usuario.rol}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                usuario.status === 'activo' ? 'bg-green-800 text-green-100' : 'bg-gray-800 text-gray-100'
              }">
                ${usuario.status === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleDateString() : 'Nunca'}</td>
          </tr>
        `).join('');
      } else {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Sin Datos</th>
          </tr>
        `;
        bodyHtml = `
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">No hay usuarios registrados</td>
          </tr>
        `;
      }
      break;
      
    case 'historial':
      // Historial usa data.reportes en lugar de data.datos
      const reportesData = data.reportes || [];
      if (reportesData && reportesData.length > 0) {
        headerHtml = `
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Tipo</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Usuario</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Registros</th>
          </tr>
        `;
        bodyHtml = reportesData.map(reporte => `
          <tr class="hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${reporte.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                ${reporte.tipo_reporte || 'N/A'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${reporte.fecha_generacion ? new Date(reporte.fecha_generacion).toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${reporte.user_id || 'Sistema'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${reporte.total_registros || 'N/A'}</td>
          </tr>
        `).join('');
      }
      break;
      
    default:
      headerHtml = `
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-300">Información</th>
        </tr>
      `;
      bodyHtml = `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Datos disponibles para visualización</td>
        </tr>
      `;
  }
  
  tableHead.innerHTML = headerHtml;
  tableBody.innerHTML = bodyHtml;
}

// Función principal para mostrar reporte
function mostrarReporte(data, tipo, titulo) {
  currentReportData = data;
  currentReportType = tipo;
  
  // Ocultar placeholder y mostrar contenido
  document.getElementById('reporte-placeholder').style.display = 'none';
  document.getElementById('reporte-content').classList.remove('hidden');
  
  // Actualizar título
  document.getElementById('reporte-title').innerHTML = `
    <i data-lucide="file-text" class="w-6 h-6 mr-2" style="color: var(--color-azul-acento);"></i>
    ${titulo}
  `;
  
  // Actualizar fecha
  document.getElementById('reporte-fecha').textContent = new Date().toLocaleString();
  
  if (data.success && data.data && data.data.report) {
    // Mostrar estadísticas
    mostrarEstadisticas(data.data.report.estadisticas, tipo);
    
    // Mostrar tabla
    mostrarTabla(data.data.report, tipo);
  } else {
    // Mostrar error
    document.getElementById('reporte-stats').innerHTML = `
      <div class="col-span-4 bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-800">
        <div class="flex items-center text-red-300">
          <i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i>
          <span class="font-medium">Error al cargar el reporte</span>
        </div>
        <p class="text-red-200 text-sm mt-1">${data.message || 'No se pudieron obtener los datos'}</p>
      </div>
    `;
    document.getElementById('reporte-table-head').innerHTML = '';
    document.getElementById('reporte-table-body').innerHTML = '';
  }
  
  // Recrear iconos
  lucide.createIcons();
}

// Funciones de exportación
function exportarAPDF() {
  if (!currentReportData || !currentReportType) {
    AlertConfig.showError('Error', 'No hay datos para exportar');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Colores del tema Hexodus
    const primaryColor = [33, 150, 243]; // Azul
    const secondaryColor = [96, 125, 139]; // Gris azulado
    const accentColor = [255, 193, 7]; // Amarillo/Dorado
    const darkGray = [55, 71, 79];
    const lightGray = [245, 245, 245];
    
    // Encabezado con estilo
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo y título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HEXODUS', 15, 20);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión', 15, 28);
    
    // Título del reporte
    doc.setTextColor(...darkGray);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const reportTitle = 'Reporte de ' + currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1);
    doc.text(reportTitle, 15, 50);
    
    // Línea separadora
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(2);
    doc.line(15, 55, 195, 55);
    
    // Información del reporte
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Fecha de generación: ${currentDate}`, 15, 65);
    
    let yPosition = 80;
    
    // Estadísticas mejoradas
    if (currentReportData.success && currentReportData.data && currentReportData.data.report && currentReportData.data.report.estadisticas) {
      const stats = currentReportData.data.report.estadisticas;
      
      // Título de estadísticas
      doc.setFillColor(...lightGray);
      doc.rect(15, yPosition - 5, 180, 20, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Estadísticas Principales', 20, yPosition + 7);
      yPosition += 25;
      
      // Grid de estadísticas
      doc.setTextColor(...darkGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let col1X = 20, col2X = 110;
      let isLeftColumn = true;
      
      Object.entries(stats).forEach(([key, value]) => {
        if (typeof value !== 'object' && value !== null) {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const formattedValue = typeof value === 'number' && value > 1000 ? 
            value.toLocaleString() : value;
          
          const xPos = isLeftColumn ? col1X : col2X;
          
          // Clave en negrita
          doc.setFont('helvetica', 'bold');
          doc.text(`${formattedKey}:`, xPos, yPosition);
          
          // Valor normal
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...primaryColor);
          doc.text(`${formattedValue}`, xPos + 60, yPosition);
          
          if (isLeftColumn) {
            isLeftColumn = false;
          } else {
            isLeftColumn = true;
            yPosition += 12;
          }
          
          doc.setTextColor(...darkGray);
        }
      });
      
      if (!isLeftColumn) yPosition += 12;
      yPosition += 10;
    }
    
    // Datos de tabla (solo para algunos tipos)
    const data = currentReportData.data.report;
    if (data.datos && data.datos.length > 0 && yPosition < 250) {
      // Título de datos
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPosition - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 Datos Detallados', 20, yPosition + 5);
      yPosition += 20;
      
      // Mostrar solo algunos registros principales
      const limitedData = data.datos.slice(0, 8);
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      if (currentReportType === 'inventario') {
        limitedData.forEach((producto, index) => {
          const bgColor = index % 2 === 0 ? lightGray : [255, 255, 255];
          doc.setFillColor(...bgColor);
          doc.rect(15, yPosition - 3, 180, 12, 'F');
          
          doc.text(producto.nombre_producto || 'Sin nombre', 20, yPosition + 3);
          doc.text(`Stock: ${producto.cantidad_stock || 0}`, 100, yPosition + 3);
          doc.text(`$${producto.precio || 0}`, 140, yPosition + 3);
          doc.text(producto.status_producto || 'N/A', 165, yPosition + 3);
          yPosition += 12;
        });
      }
      
      if (data.datos.length > 8) {
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'italic');
        doc.text(`... y ${data.datos.length - 8} registros más (consulte el archivo Excel para datos completos)`, 20, yPosition + 5);
      }
    }
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Generado por Sistema Hexodus - hexodus.com', 15, 285);
    doc.text(`Página 1 de 1 | ${new Date().toLocaleDateString()}`, 15, 290);
    
    const fileName = `HEXODUS_${currentReportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    AlertConfig.showSuccess('Éxito', 'Reporte PDF descargado correctamente con formato profesional');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    AlertConfig.showError('Error', 'No se pudo exportar a PDF');
  }
}

function exportarAExcel() {
  if (!currentReportData || !currentReportType) {
    AlertConfig.showError('Error', 'No hay datos para exportar');
    return;
  }

  try {
    const data = currentReportData.data.report;
    const wb = XLSX.utils.book_new();
    
    // Crear hojas separadas
    const statsData = [];
    const detailsData = [];
    
    // === HOJA DE ESTADÍSTICAS ===
    statsData.push(['HEXODUS - SISTEMA DE GESTIÓN']);
    statsData.push(['']);
    statsData.push([`Reporte de ${currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1)}`]);
    statsData.push([`Fecha: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}`]);
    statsData.push(['']);
    statsData.push(['ESTADÍSTICAS PRINCIPALES']);
    statsData.push(['']);
    
    if (data.estadisticas) {
      statsData.push(['Métrica', 'Valor']);
      Object.entries(data.estadisticas).forEach(([key, value]) => {
        if (typeof value !== 'object' && value !== null) {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const formattedValue = typeof value === 'number' && value > 1000 ? 
            value.toLocaleString() : value;
          statsData.push([formattedKey, formattedValue]);
        }
      });
    }
    
    // === HOJA DE DATOS DETALLADOS ===
    if (currentReportType === 'inventario' && data.datos) {
      detailsData.push(['INVENTARIO DETALLADO']);
      detailsData.push(['']);
      detailsData.push(['Producto', 'Código', 'Stock', 'Precio', 'Valor Total', 'Estado', 'Stock Mínimo', 'Descripción']);
      
      data.datos.forEach(p => {
        const stock = p.cantidad_stock || 0;
        const precio = p.precio || 0;
        detailsData.push([
          p.nombre_producto || 'Sin nombre',
          p.codigo_producto || 'N/A',
          stock,
          precio,
          (stock * precio).toFixed(2),
          p.status_producto || 'N/A',
          p.stock_minimo || 0,
          p.descripcion || 'Sin descripción'
        ]);
      });
    } else if (currentReportType === 'ventas' && data.datos) {
      detailsData.push(['VENTAS DETALLADAS']);
      detailsData.push(['']);
      detailsData.push(['ID', 'Usuario', 'Total', 'Fecha', 'Estado', 'Productos', 'Observaciones']);
      
      data.datos.forEach(v => {
        detailsData.push([
          v.id,
          v.id_usuario || 'N/A',
          `$${v.total || 0}`,
          v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleDateString() : 'N/A',
          v.status_venta || 'N/A',
          v.productos ? v.productos.length : 0,
          v.observaciones || 'Sin observaciones'
        ]);
      });
    } else if (currentReportType === 'membresias' && data.datos) {
      detailsData.push(['MEMBRESÍAS DETALLADAS']);
      detailsData.push(['']);
      detailsData.push(['Socio', 'Membresía', 'Estado', 'Inicio', 'Fin', 'Precio', 'Email', 'Teléfono']);
      
      data.datos.forEach(m => {
        detailsData.push([
          m.socio_info?.nombre_socio || 'N/A',
          m.membresia_info?.nombre_membresia || 'N/A',
          m.status_membresia_socio || 'N/A',
          m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString() : 'N/A',
          m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString() : 'N/A',
          `$${m.membresia_info?.precio || 0}`,
          m.socio_info?.correo_electronico || 'N/A',
          m.socio_info?.telefono || 'N/A'
        ]);
      });
    } else if (currentReportType === 'socios' && data.datos) {
      detailsData.push(['SOCIOS DETALLADOS']);
      detailsData.push(['']);
      detailsData.push(['Nombre', 'Email', 'Teléfono', 'Estado', 'Registro', 'Membresías', 'Estado Membresía']);
      
      data.datos.forEach(s => {
        detailsData.push([
          s.nombre_socio || 'N/A',
          s.correo_electronico || 'N/A',
          s.telefono || 'N/A',
          s.status || 'N/A',
          s.fecha_creacion ? new Date(
            s.fecha_creacion.seconds ? s.fecha_creacion.seconds * 1000 : s.fecha_creacion
          ).toLocaleDateString() : 'N/A',
          s.total_membresias || 0,
          s.membresia_activa ? 
            (s.membresia_activa.status_membresia_socio === 'pagado' ? 'Membresía Pagada' : 'Membresía Pendiente') : 
            'Sin membresía'
        ]);
      });
    } else if (currentReportType === 'usuarios' && data.datos) {
      detailsData.push(['USUARIOS DETALLADOS']);
      detailsData.push(['']);
      detailsData.push(['Nombre', 'Email', 'Rol', 'Estado', 'Registro', 'Último Acceso']);
      
      data.datos.forEach(u => {
        detailsData.push([
          u.nombre || 'N/A',
          u.email || 'N/A',
          u.rol || 'N/A',
          u.status || 'N/A',
          u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString() : 'N/A',
          u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString() : 'Nunca'
        ]);
      });
    } else if (currentReportType === 'historial') {
      const reportesData = currentReportData.data.reportes || [];
      detailsData.push(['HISTORIAL DE REPORTES']);
      detailsData.push(['']);
      detailsData.push(['ID', 'Tipo', 'Fecha', 'Usuario', 'Registros', 'Estado']);
      
      reportesData.forEach(r => {
        detailsData.push([
          r.id,
          r.tipo_reporte || 'N/A',
          r.fecha_generacion ? new Date(r.fecha_generacion).toLocaleDateString() : 'N/A',
          r.user_id || 'Sistema',
          r.total_registros || 0,
          r.status || 'N/A'
        ]);
      });
    }
    
    // Crear hoja de estadísticas
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    
    // Aplicar estilos a la hoja de estadísticas
    statsWs['!cols'] = [{ width: 30 }, { width: 20 }];
    
    // Crear hoja de datos detallados
    if (detailsData.length > 0) {
      const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
      
      // Auto-ajustar ancho de columnas
      const maxWidths = [];
      detailsData.forEach(row => {
        row.forEach((cell, colIndex) => {
          const cellLength = cell ? cell.toString().length : 0;
          maxWidths[colIndex] = Math.max(maxWidths[colIndex] || 0, cellLength + 2);
        });
      });
      
      detailsWs['!cols'] = maxWidths.map(width => ({ width: Math.min(width, 50) }));
      
      XLSX.utils.book_append_sheet(wb, detailsWs, 'Datos Detallados');
    }
    
    XLSX.utils.book_append_sheet(wb, statsWs, 'Resumen Ejecutivo');
    
    // Agregar metadata del libro
    wb.Props = {
      Title: `Reporte ${currentReportType}`,
      Subject: 'Reporte generado por Sistema Hexodus',
      Author: 'Sistema Hexodus',
      CreatedDate: new Date()
    };
    
    const fileName = `HEXODUS_${currentReportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    AlertConfig.showSuccess('Éxito', 'Reporte Excel descargado con formato profesional y múltiples hojas');
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    AlertConfig.showError('Error', 'No se pudo exportar a Excel');
  }
}

// Función principal para generar reportes
async function generarReporte(tipo) {
  try {
    mostrarLoading();
    
    let endpoint;
    let titulo;
    
    switch (tipo) {
      case 'inventario':
        endpoint = API_ENDPOINTS.reportsInventory;
        titulo = 'Reporte de Inventario';
        break;
      case 'ventas':
        endpoint = API_ENDPOINTS.reportsSales;
        titulo = 'Reporte de Ventas';
        break;
      case 'membresias':
        endpoint = API_ENDPOINTS.reportsMemberships;
        titulo = 'Reporte de Membresías';
        break;
      case 'socios':
        endpoint = API_ENDPOINTS.reportsSocios;
        titulo = 'Reporte de Socios';
        break;
      case 'usuarios':
        endpoint = API_ENDPOINTS.reportsUsers;
        titulo = 'Reporte de Usuarios';
        break;
      case 'historial':
        endpoint = API_ENDPOINTS.reportsHistory;
        titulo = 'Historial de Reportes';
        break;
      default:
        throw new Error('Tipo de reporte no válido');
    }
    
    const data = await obtenerReporte(endpoint, tipo);
    Swal.close();
    mostrarReporte(data, tipo, titulo);
    
  } catch (error) {
    Swal.close();
    console.error('Error al generar reporte:', error);
    await AlertConfig.showError('Error', `No se pudo generar el reporte: ${error.message}`);
  }
}

// Event listeners para botones
document.getElementById('reporte-inventario')?.addEventListener('click', () => generarReporte('inventario'));
document.getElementById('reporte-ventas')?.addEventListener('click', () => generarReporte('ventas'));
document.getElementById('reporte-membresias')?.addEventListener('click', () => generarReporte('membresias'));
document.getElementById('reporte-socios')?.addEventListener('click', () => generarReporte('socios'));
document.getElementById('reporte-usuarios')?.addEventListener('click', () => generarReporte('usuarios'));
document.getElementById('reporte-historial')?.addEventListener('click', () => generarReporte('historial'));

// Event listeners para exportación
document.getElementById('exportPDF')?.addEventListener('click', exportarAPDF);
document.getElementById('exportExcel')?.addEventListener('click', exportarAExcel);
document.getElementById('refreshReporte')?.addEventListener('click', () => {
  if (currentReportType) {
    generarReporte(currentReportType);
  }
});

// Toggle sidebar
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const backdrop = document.getElementById('backdrop');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
    if (backdrop) backdrop.classList.toggle('hidden');
  });
}

if (backdrop) {
  backdrop.addEventListener('click', () => {
    if (sidebar) sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  });
}