import { AuthStorage, API_ENDPOINTS } from './config.js';
import { logout, fetchWithAuth } from './auth.js';

// Variables globales
let configuracionRespaldo = {
    baseDatos: true,
    archivosAdjuntos: true,
    usuariosRoles: true,
    configuracionesSistema: true,
    ubicacionAlmacenamiento: '',
    rutaDestino: ''
};

let respaldosDisponibles = [];

// Inicializar página de configuración
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarConfiguracionRespaldo();
        await cargarRespaldosDisponibles();
        inicializarEventos();
        actualizarFechaHora();
    } catch (error) {
        console.error('[Settings] Error al inicializar:', error);
        mostrarAlerta('Error al cargar configuración', 'error');
    }
});

/**
 * Cargar configuración de respaldo
 */
async function cargarConfiguracionRespaldo() {
    try {
        // Cargar configuración desde localStorage
        const configGuardada = localStorage.getItem('configuracion_respaldo');
        if (configGuardada) {
            configuracionRespaldo = { ...configuracionRespaldo, ...JSON.parse(configGuardada) };
        }
        
        // Aplicar configuración a la UI
        aplicarConfiguracionAUI();
    } catch (error) {
        console.error('[Settings] Error al cargar configuración:', error);
    }
}

/**
 * Cargar respaldos disponibles
 */
async function cargarRespaldosDisponibles() {
    try {
        // Simular carga de respaldos desde el servidor
        // En una implementación real, esto vendría de una API
        respaldosDisponibles = [
            {
                id: 'respaldo_20231120',
                fecha: '20/11/2023',
                hora: '14:30',
                tamaño: '125 MB',
                tipo: 'Completo'
            },
            {
                id: 'respaldo_20231115',
                fecha: '15/11/2023',
                hora: '09:15',
                tamaño: '98 MB',
                tipo: 'Completo'
            },
            {
                id: 'respaldo_20231110',
                fecha: '10/11/2023',
                hora: '18:45',
                tamaño: '102 MB',
                tipo: 'Parcial'
            }
        ];
        
        // Actualizar select de respaldos
        const selectRespaldos = document.getElementById('seleccionarRespaldos');
        selectRespaldos.innerHTML = '<option value="">Selecciona una ...</option>';
        
        respaldosDisponibles.forEach(respaldo => {
            const option = document.createElement('option');
            option.value = respaldo.id;
            option.textContent = `${respaldo.fecha} - ${respaldo.hora} (${respaldo.tamaño})`;
            selectRespaldos.appendChild(option);
        });
    } catch (error) {
        console.error('[Settings] Error al cargar respaldos:', error);
    }
}

/**
 * Aplicar configuración a la interfaz
 */
function aplicarConfiguracionAUI() {
    // Aplicar estado de switches
    const switches = ['baseDatos', 'archivosAdjuntos', 'usuariosRoles', 'configuracionesSistema'];
    
    switches.forEach(switchName => {
        const switchElement = document.getElementById(switchName);
        const toggleElement = switchElement.nextElementSibling;
        
        if (configuracionRespaldo[switchName]) {
            switchElement.checked = true;
            toggleElement.classList.remove('inactive');
        } else {
            switchElement.checked = false;
            toggleElement.classList.add('inactive');
        }
    });
    
    // Aplicar selects
    document.getElementById('ubicacionAlmacenamiento').value = configuracionRespaldo.ubicacionAlmacenamiento;
    document.getElementById('rutaDestino').value = configuracionRespaldo.rutaDestino;
}

/**
 * Inicializar eventos
 */
function inicializarEventos() {
    // Botones de respaldo
    document.getElementById('historialBtn').addEventListener('click', mostrarHistorial);
    document.getElementById('editarProgramacionBtn').addEventListener('click', editarProgramacion);
    document.getElementById('generarRespaldoBtn').addEventListener('click', generarRespaldo);
    
    // Botones de restauración
    document.getElementById('cancelarBtn').addEventListener('click', cancelarRestauracion);
    document.getElementById('iniciarRestauracionBtn').addEventListener('click', iniciarRestauracion);
    
    // Botón logout
    document.getElementById('logoutBtn').addEventListener('click', cerrarSesion);
    
    // Eventos de cambio en configuración
    const switches = ['baseDatos', 'archivosAdjuntos', 'usuariosRoles', 'configuracionesSistema'];
    switches.forEach(switchName => {
        const switchElement = document.getElementById(switchName);
        switchElement.addEventListener('change', () => {
            configuracionRespaldo[switchName] = switchElement.checked;
            guardarConfiguracion();
        });
    });
    
    // Eventos de selects
    document.getElementById('ubicacionAlmacenamiento').addEventListener('change', (e) => {
        configuracionRespaldo.ubicacionAlmacenamiento = e.target.value;
        guardarConfiguracion();
    });
    
    document.getElementById('rutaDestino').addEventListener('change', (e) => {
        configuracionRespaldo.rutaDestino = e.target.value;
        guardarConfiguracion();
    });
    
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
 * Mostrar historial de respaldos
 */
async function mostrarHistorial() {
    try {
        let historialHtml = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-blue-400">Historial de respaldos</h3>
                <div class="max-h-64 overflow-y-auto">
        `;
        
        respaldosDisponibles.forEach(respaldo => {
            historialHtml += `
                <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2">
                    <div>
                        <div class="font-medium text-white">${respaldo.fecha} - ${respaldo.hora}</div>
                        <div class="text-sm text-gray-400">Tipo: ${respaldo.tipo} | Tamaño: ${respaldo.tamaño}</div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded">Descargar</button>
                        <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">Eliminar</button>
                    </div>
                </div>
            `;
        });
        
        historialHtml += '</div></div>';
        
        await Swal.fire({
            title: 'Historial de respaldos',
            html: historialHtml,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#3b82f6',
            background: 'var(--color-tarjeta-fondo)',
            color: 'white'
        });
    } catch (error) {
        console.error('[Settings] Error al mostrar historial:', error);
        mostrarAlerta('Error al cargar historial', 'error');
    }
}

/**
 * Editar programación de respaldos
 */
async function editarProgramacion() {
    try {
        const { value: configuracion } = await Swal.fire({
            title: 'Programar respaldos automáticos',
            html: `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Frecuencia</label>
                        <select id="frecuencia" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                            <option value="diario">Diario</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensual">Mensual</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Hora</label>
                        <input type="time" id="hora" value="02:00" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Retener respaldos</label>
                        <select id="retencion" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                            <option value="7">7 días</option>
                            <option value="30">30 días</option>
                            <option value="90">90 días</option>
                            <option value="365">1 año</option>
                        </select>
                    </div>
                </div>
            `,
            confirmButtonText: 'Guardar programación',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            background: 'var(--color-tarjeta-fondo)',
            color: 'white',
            preConfirm: () => {
                return {
                    frecuencia: document.getElementById('frecuencia').value,
                    hora: document.getElementById('hora').value,
                    retencion: document.getElementById('retencion').value
                };
            }
        });
        
        if (configuracion) {
            // Guardar programación
            localStorage.setItem('programacion_respaldos', JSON.stringify(configuracion));
            mostrarAlerta('Programación guardada correctamente', 'success');
        }
    } catch (error) {
        console.error('[Settings] Error al editar programación:', error);
        mostrarAlerta('Error al configurar programación', 'error');
    }
}

/**
 * Generar respaldo ahora
 */
async function generarRespaldo() {
    try {
        const result = await Swal.fire({
            title: '¿Generar respaldo ahora?',
            text: 'Se creará un respaldo completo con la configuración actual',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, generar respaldo',
            cancelButtonText: 'Cancelar',
            background: 'var(--color-tarjeta-fondo)',
            color: 'white'
        });

        if (result.isConfirmed) {
            // Mostrar progreso
            Swal.fire({
                title: 'Generando respaldo...',
                html: 'Por favor espera mientras se genera el respaldo',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: 'var(--color-tarjeta-fondo)',
                color: 'white'
            });
            
            // Simular proceso de respaldo
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            Swal.close();
            mostrarAlerta('Respaldo generado correctamente', 'success');
            await cargarRespaldosDisponibles(); // Recargar lista
        }
    } catch (error) {
        console.error('[Settings] Error al generar respaldo:', error);
        mostrarAlerta('Error al generar respaldo', 'error');
    }
}

/**
 * Cancelar restauración
 */
function cancelarRestauracion() {
    // Limpiar selecciones
    document.getElementById('seleccionarRespaldos').value = '';
    document.getElementById('restauracionCompleta').checked = true;
    document.getElementById('restauracionParcial').checked = false;
    
    // Resetear radio switches
    const radioSwitches = document.querySelectorAll('.radio-switch');
    radioSwitches.forEach((radio, index) => {
        if (index === 0) {
            radio.classList.remove('inactive');
        } else {
            radio.classList.add('inactive');
        }
    });
    
    mostrarAlerta('Proceso de restauración cancelado', 'info');
}

/**
 * Iniciar restauración
 */
async function iniciarRestauracion() {
    try {
        const respaldoSeleccionado = document.getElementById('seleccionarRespaldos').value;
        
        if (!respaldoSeleccionado) {
            mostrarAlerta('Por favor selecciona un respaldo', 'warning');
            return;
        }
        
        const tipoRestauracion = document.querySelector('input[name="tipoRestauracion"]:checked').id;
        
        const result = await Swal.fire({
            title: '⚠️ ¡Advertencia!',
            html: `
                <div class="text-left">
                    <p class="mb-3">La restauración reemplazará los datos actuales del sistema.</p>
                    <p class="mb-3"><strong>Respaldo seleccionado:</strong> ${respaldoSeleccionado}</p>
                    <p class="mb-3"><strong>Tipo:</strong> ${tipoRestauracion === 'restauracionCompleta' ? 'Completa' : 'Parcial'}</p>
                    <p class="text-red-400 font-semibold">Esta acción no se puede deshacer.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, iniciar restauración',
            cancelButtonText: 'Cancelar',
            background: 'var(--color-tarjeta-fondo)',
            color: 'white'
        });

        if (result.isConfirmed) {
            // Mostrar progreso
            Swal.fire({
                title: 'Restaurando datos...',
                html: 'Por favor espera mientras se restaura la información. <strong>NO cierres esta ventana.</strong>',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: 'var(--color-tarjeta-fondo)',
                color: 'white'
            });
            
            // Simular proceso de restauración
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            Swal.close();
            mostrarAlerta('Restauración completada correctamente', 'success');
        }
    } catch (error) {
        console.error('[Settings] Error al iniciar restauración:', error);
        mostrarAlerta('Error al iniciar restauración', 'error');
    }
}

/**
 * Guardar configuración
 */
function guardarConfiguracion() {
    try {
        localStorage.setItem('configuracion_respaldo', JSON.stringify(configuracionRespaldo));
    } catch (error) {
        console.error('[Settings] Error al guardar configuración:', error);
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
        console.error('[Settings] Error al cerrar sesión:', error);
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
        title: tipo === 'success' ? '¡Éxito!' : tipo === 'error' ? '¡Error!' : tipo === 'warning' ? '¡Atención!' : 'Información',
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