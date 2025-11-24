import { AuthStorage, API_ENDPOINTS } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

// Variables globales
let usuarioActual = null;
let preferenciasPerfil = {
    idioma: 'es',
    modoClaro: false,
    notificacionesCorreo: 'importantes',
    recordatoriosDiarios: 'mañana',
    guardarSesion: 'siempre'
};

// Inicializar página de perfil
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarPerfilUsuario();
        await cargarPreferencias();
        inicializarEventos();
        actualizarFechaHora();
    } catch (error) {
        console.error('[Perfil] Error al inicializar:', error);
        mostrarAlerta('Error al cargar el perfil', 'error');
    }
});

/**
 * Cargar información del usuario actual
 */
async function cargarPerfilUsuario() {
    try {
        // Obtener información del usuario desde localStorage
        usuarioActual = AuthStorage.getUser();
        
        if (usuarioActual) {
            // Llenar formulario con información del usuario
            document.getElementById('nombreCompleto').value = usuarioActual.fullName || '';
            document.getElementById('correoUsuario').value = usuarioActual.email || '';
            
            // Mostrar nombre en el encabezado
            document.getElementById('userNameDisplay').textContent = usuarioActual.fullName || 'Usuario';
            
            // Intentar obtener información adicional del backend
            try {
                const response = await fetchWithAuth(API_ENDPOINTS.me);
                if (response.success && response.data) {
                    // Actualizar con información del backend si está disponible
                    const userInfo = response.data;
                    document.getElementById('telefonoUsuario').value = userInfo.telefono || '';
                }
            } catch (error) {
                console.log('[Perfil] No se pudo obtener información adicional del usuario');
            }
        }
    } catch (error) {
        console.error('[Perfil] Error al cargar perfil:', error);
        throw error;
    }
}

/**
 * Cargar preferencias del usuario
 */
async function cargarPreferencias() {
    try {
        // Cargar preferencias desde localStorage
        const preferenciasGuardadas = localStorage.getItem('preferencias_perfil');
        if (preferenciasGuardadas) {
            preferenciasPerfil = { ...preferenciasPerfil, ...JSON.parse(preferenciasGuardadas) };
        }
        
        // Aplicar preferencias a la UI
        aplicarPreferenciasAUI();
    } catch (error) {
        console.error('[Perfil] Error al cargar preferencias:', error);
    }
}

/**
 * Aplicar preferencias a la interfaz
 */
function aplicarPreferenciasAUI() {
    // Idioma
    document.getElementById('idiomaSelect').value = preferenciasPerfil.idioma;
    
    // Modo claro
    const modoClaro = document.getElementById('modoClaro');
    const toggleSwitch = modoClaro.nextElementSibling;
    modoClaro.checked = preferenciasPerfil.modoClaro;
    if (preferenciasPerfil.modoClaro) {
        toggleSwitch.classList.add('active');
    }
    
    // Notificaciones por correo
    document.getElementById('notificacionesCorreo').value = preferenciasPerfil.notificacionesCorreo;
    
    // Recordatorios diarios
    document.getElementById('recordatoriosDiarios').value = preferenciasPerfil.recordatoriosDiarios;
    
    // Guardar sesión
    document.getElementById('guardarSesion').value = preferenciasPerfil.guardarSesion;
}

/**
 * Inicializar eventos
 */
function inicializarEventos() {
    // Botón editar perfil
    document.getElementById('editarPerfilBtn').addEventListener('click', editarPerfil);
    
    // Botón aplicar preferencias
    document.getElementById('aplicarPreferenciasBtn').addEventListener('click', aplicarPreferencias);
    
    // Botón logout
    document.getElementById('logoutBtn').addEventListener('click', cerrarSesion);
    
    // Toggle sidebar en móvil
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('backdrop');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            backdrop.classList.toggle('hidden');
        });
    }
    
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('hidden');
        });
    }
    
    // Actualizar fecha y hora cada minuto
    setInterval(actualizarFechaHora, 60000);
}

/**
 * Editar perfil del usuario
 */
async function editarPerfil() {
    try {
        const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
        const telefono = document.getElementById('telefonoUsuario').value.trim();
        
        if (!nombreCompleto) {
            mostrarAlerta('El nombre completo es obligatorio', 'error');
            return;
        }
        
        // Mostrar loading
        const btn = document.getElementById('editarPerfilBtn');
        const textoOriginal = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Guardando...';
        
        // Intentar actualizar en el backend
        try {
            const datosActualizar = {
                nombre_completo: nombreCompleto,
                telefono: telefono || null
            };
            
            await fetchWithAuth(`${API_ENDPOINTS.me}`, {
                method: 'PUT',
                body: JSON.stringify(datosActualizar)
            });
            
            // Actualizar información local
            usuarioActual.fullName = nombreCompleto;
            AuthStorage.saveUser(usuarioActual);
            document.getElementById('userNameDisplay').textContent = nombreCompleto;
            
            mostrarAlerta('Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error('[Perfil] Error al actualizar perfil:', error);
            mostrarAlerta('Error al actualizar perfil', 'error');
        }
        
        // Restaurar botón
        btn.disabled = false;
        btn.textContent = textoOriginal;
        
    } catch (error) {
        console.error('[Perfil] Error en editarPerfil:', error);
        mostrarAlerta('Error inesperado', 'error');
    }
}

/**
 * Aplicar preferencias del sistema
 */
async function aplicarPreferencias() {
    try {
        // Recopilar preferencias del formulario
        preferenciasPerfil.idioma = document.getElementById('idiomaSelect').value;
        preferenciasPerfil.modoClaro = document.getElementById('modoClaro').checked;
        preferenciasPerfil.notificacionesCorreo = document.getElementById('notificacionesCorreo').value;
        preferenciasPerfil.recordatoriosDiarios = document.getElementById('recordatoriosDiarios').value;
        preferenciasPerfil.guardarSesion = document.getElementById('guardarSesion').value;
        
        // Guardar preferencias en localStorage
        localStorage.setItem('preferencias_perfil', JSON.stringify(preferenciasPerfil));
        
        // Aplicar tema si cambió
        if (preferenciasPerfil.modoClaro) {
            // Aquí puedes agregar lógica para cambiar al tema claro
            console.log('Aplicando tema claro...');
        } else {
            console.log('Aplicando tema oscuro...');
        }
        
        mostrarAlerta('Preferencias aplicadas correctamente', 'success');
    } catch (error) {
        console.error('[Perfil] Error al aplicar preferencias:', error);
        mostrarAlerta('Error al aplicar preferencias', 'error');
    }
}

/**
 * Cerrar sesión
 */
async function cerrarSesion() {
    try {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            background: 'var(--color-tarjeta-fondo)',
            color: 'white'
        });

        if (result.isConfirmed) {
            await logout();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('[Perfil] Error al cerrar sesión:', error);
        mostrarAlerta('Error al cerrar sesión', 'error');
    }
}

/**
 * Actualizar fecha y hora
 */
function actualizarFechaHora() {
    const ahora = new Date();
    const opcionesFecha = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };
    const opcionesHora = { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    };
    
    const fecha = ahora.toLocaleDateString('es-ES', opcionesFecha);
    const hora = ahora.toLocaleTimeString('es-ES', opcionesHora);
    
    const elementoFechaHora = document.getElementById('fecha-hora');
    if (elementoFechaHora) {
        elementoFechaHora.textContent = `${fecha} | ${hora}`;
    }
}

/**
 * Mostrar alertas
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    Swal.fire({
        title: tipo === 'success' ? '¡Éxito!' : tipo === 'error' ? '¡Error!' : 'Información',
        text: mensaje,
        icon: tipo,
        confirmButtonColor: '#3b82f6',
        background: 'var(--color-tarjeta-fondo)',
        color: 'white'
    });
}

// Inicializar iconos de Lucide
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});