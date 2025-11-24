import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import cors from "cors"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())

// Configurar tipo MIME para módulos JavaScript
app.use(express.static(path.join(__dirname, "..", "public"), {
  setHeaders: (res, path) => {
    if (path.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript")
    }
  }
}))

// Ruta principal y login redirigen al login
app.get(["/", "/login"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "login.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "dashboard.html"))
})

app.get("/socios", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "socios.html"))
})

app.get("/ventas", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "ventas.html"))
})

app.get("/inventario", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "inventario.html"))
})

app.get("/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "usuarios.html"))
})

app.get("/reportes", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "reportes.html"))
})

app.get("/perfil", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "perfil.html"))
})

const PORT = process.env.PORT || 5500
app.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}`)
})
