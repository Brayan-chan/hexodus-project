// Importar las dependencias necesarias
import { AuthStorage } from './config.js';
import { logout } from './auth.js';

// Inicializa los íconos de Lucide
lucide.createIcons();

// Verificar autenticación
if (!AuthStorage.isAuthenticated()) {
  console.log("[v0] Usuario no autenticado, redirigiendo a login")
  window.location.href = "/login"
}

// Mostrar nombre de usuario
const user = AuthStorage.getUser()
if (user) {
  document.getElementById("userNameDisplay").textContent = user.email.split("@")[0]
  console.log("[v0] Usuario autenticado:", user.email)
}

// Lógica de logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  console.log("[v0] Iniciando logout")
  await logout()
  window.location.href = "/login"
})

// Navegación móvil - Toggle sidebar
document.getElementById("menu-toggle").addEventListener("click", () => {
  const sidebar = document.querySelector(".sidebar")
  const backdrop = document.getElementById("backdrop")
  sidebar.classList.toggle("-translate-x-full")
  backdrop.classList.toggle("hidden")
})

document.getElementById("backdrop").addEventListener("click", () => {
  const sidebar = document.querySelector(".sidebar")
  const backdrop = document.getElementById("backdrop")
  sidebar.classList.add("-translate-x-full")
  backdrop.classList.add("hidden")
})

// Actualizar fecha y hora
const actualizarFechaHora = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
  document.getElementById("fecha-hora").textContent = `${fecha} | ${hora}`
}
setInterval(actualizarFechaHora, 60000)
actualizarFechaHora()

const colorRojo = "rgba(255, 59, 59, 1)"
const colorAzul = "rgba(0, 191, 255, 1)"
const colorGris = "rgba(160, 160, 160, 1)"

// Gráfico de Ventas vs. Mes Anterior
const ctxVentas = document.getElementById("graficoVentas").getContext("2d")
new Chart(ctxVentas, {
  type: "bar",
  data: {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: "Ventas Actuales",
        data: [1200, 1900, 3000, 500, 2000, 3000, 2500],
        backgroundColor: colorRojo,
        borderRadius: 4,
      },
      {
        label: "Mes Anterior",
        data: [900, 1500, 2500, 1000, 1800, 2800, 2000],
        backgroundColor: colorGris,
        borderRadius: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "white" } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  },
})

// Gráfico de Membresías Activas (Doughnut)
const ctxMembresias = document.getElementById("graficoMembresias").getContext("2d")
new Chart(ctxMembresias, {
  type: "doughnut",
  data: {
    labels: ["Mensual", "Trimestral", "Semestral", "Anual"],
    datasets: [
      {
        data: [180, 80, 50, 35],
        backgroundColor: [colorRojo, colorAzul, "#FF9900", "#6600CC"],
        hoverOffset: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "white", usePointStyle: true },
      },
    },
  },
})

// Gráfico de Concurrencia por Horario
const ctxConcurrencia = document.getElementById("graficoConcurrencia").getContext("2d")
new Chart(ctxConcurrencia, {
  type: "bar",
  data: {
    labels: ["07:00", "13:00", "18:00", "20:00"],
    datasets: [
      {
        label: "Personas",
        data: [45, 60, 95, 80],
        backgroundColor: [colorAzul, colorAzul, colorRojo, colorAzul],
        borderRadius: 4,
      },
    ],
  },
  options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  },
})

console.log("[v0] Dashboard cargado exitosamente")
