import { API_ENDPOINTS, AuthStorage, AlertConfig } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

if (!AuthStorage.isAuthenticated()) {
  window.location.href = "/login"
}

lucide.createIcons()

// Actualizar fecha y hora
const actualizarFechaHora = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
  const headerEl = document.getElementById("fecha-hora-header")
  if (headerEl) headerEl.textContent = `${fecha} | ${hora} | Exportar en Excel`
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

// Funciones para generar reportes
async function generarReporte(tipo) {
  try {
    console.log("[v0] Generando reporte:", tipo)
    
    const reporteTextos = {
      inventario: "Reporte de Inventario - Stock disponible por producto",
      socios: "Reporte de Socios - Membresías activas e inactivas",
      ventas: "Reporte de Ventas - Ingresos totales del período",
      pagos: "Reporte de Pagos - Pagos de membresías procesados",
      visitantes: "Reporte de Visitantes - Registro de accesos al gimnasio",
      general: "Reporte General - Resumen completo de operaciones"
    }

    await AlertConfig.showSuccess('Reporte Generado', reporteTextos[tipo] || 'Reporte en construcción')
  } catch (error) {
    console.error("[v0] Error:", error)
    await AlertConfig.showError('Error', 'No se pudo generar el reporte')
  }
}

// Event listeners para botones de reportes
document.getElementById('reporte-inventario')?.addEventListener('click', () => generarReporte('inventario'))
document.getElementById('reporte-socios')?.addEventListener('click', () => generarReporte('socios'))
document.getElementById('reporte-ventas')?.addEventListener('click', () => generarReporte('ventas'))
document.getElementById('reporte-pagos')?.addEventListener('click', () => generarReporte('pagos'))
document.getElementById('reporte-visitantes')?.addEventListener('click', () => generarReporte('visitantes'))
document.getElementById('reporte-general')?.addEventListener('click', () => generarReporte('general'))

// Toggle sidebar
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
