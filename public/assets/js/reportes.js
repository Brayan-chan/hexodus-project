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
    
    // Encabezado
    doc.setFontSize(20);
    doc.text('HEXODUS - Reporte de ' + currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1), 20, 20);
    
    doc.setFontSize(12);
    doc.text('Fecha: ' + new Date().toLocaleDateString(), 20, 35);
    
    // Solo estadísticas para PDF
    let yPosition = 50;
    if (currentReportData.success && currentReportData.data && currentReportData.data.report && currentReportData.data.report.estadisticas) {
      const stats = currentReportData.data.report.estadisticas;
      
      doc.setFontSize(14);
      doc.text('Estadísticas:', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      Object.entries(stats).forEach(([key, value]) => {
        if (typeof value !== 'object' && value !== null) {
          doc.text(`${key}: ${value}`, 20, yPosition);
          yPosition += 10;
        }
      });
    }
    
    const fileName = `reporte_${currentReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    AlertConfig.showSuccess('Éxito', 'Reporte PDF descargado correctamente');
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
    let worksheetData = [];
    
    // Preparar datos según el tipo
    if (currentReportType === 'inventario' && data.datos) {
      worksheetData = [
        ['Producto', 'Stock', 'Precio', 'Valor Total', 'Estado'],
        ...data.datos.map(p => {
          const stock = p.cantidad_stock || p.stock || 0;
          const precio = p.precio || 0;
          return [
            p.nombre || 'Sin nombre',
            stock,
            precio,
            (stock * precio).toFixed(2),
            stock > 10 ? 'Disponible' : stock > 0 ? 'Bajo Stock' : 'Agotado'
          ];
        })
      ];
    } else if (currentReportType === 'ventas' && data.datos) {
      worksheetData = [
        ['ID', 'Vendedor', 'Total', 'Fecha', 'Productos'],
        ...data.datos.map(v => [
          v.id,
          v.vendedor_nombre || 'N/A',
          v.total || v.monto_total || 0,
          v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleDateString() : 'N/A',
          v.cantidad || 1
        ])
      ];
    } else {
      // Datos genéricos
      worksheetData = [['Tipo de Reporte', 'Fecha'], [currentReportType, new Date().toLocaleDateString()]];
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    
    const fileName = `reporte_${currentReportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    AlertConfig.showSuccess('Éxito', 'Reporte Excel descargado correctamente');
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