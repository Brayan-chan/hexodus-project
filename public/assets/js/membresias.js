import { fetchWithAuth } from './auth.js';
import { API_ENDPOINTS, AuthStorage } from './config.js';
import { logout } from './auth.js';

// Verificar autenticación
if (!AuthStorage.isAuthenticated()) {
    window.location.href = "/login";
}

class MembresiasManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.searchQuery = '';
        this.selectedStatus = '';
        this.selectedType = '';
        this.isLoading = false;
        this.isEditing = false;
        this.currentEditId = null;
        
        // Paginación actual (como en ventas)
        this.paginacionActual = {
            current_page: 1,
            total_pages: 1,
            per_page: 10,
            total: 0,
            has_prev_page: false,
            has_next_page: false
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDateTimeUpdater();
        this.setupLogout();
        this.loadMembresias();
        
        // Inicializar iconos de Lucide después de cargar el DOM
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    setupDateTimeUpdater() {
        const actualizarFechaHora = () => {
            const now = new Date();
            const fecha = now.toLocaleDateString("es-ES", { 
                day: "2-digit", 
                month: "2-digit", 
                year: "numeric" 
            });
            const hora = now.toLocaleTimeString("es-ES", { 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
            });
            const headerEl = document.getElementById("fecha-hora-header");
            if (headerEl) headerEl.textContent = `${fecha} | ${hora}`;
        };
        
        actualizarFechaHora();
        setInterval(actualizarFechaHora, 60000);
    }

    setupLogout() {
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await logout();
                window.location.href = "/login";
            });
        }
    }

    setupEventListeners() {
        // Botón agregar nueva membresía
        document.getElementById('btn-agregar-membresia')?.addEventListener('click', () => {
            this.showModal();
        });

        // Búsqueda
        const searchInput = document.getElementById('busqueda-membresia');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadMembresias();
                }, 300);
            });
        }

        // Filtros
        document.getElementById('filtro-estado')?.addEventListener('change', (e) => {
            this.selectedStatus = e.target.value;
            this.currentPage = 1;
            this.loadMembresias();
        });

        document.getElementById('filtro-tipo')?.addEventListener('change', (e) => {
            this.selectedType = e.target.value;
            this.currentPage = 1;
            this.loadMembresias();
        });

        // Botón aplicar filtros
        document.getElementById('btn-aplicar-filtros')?.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadMembresias();
        });

        // Botón limpiar filtros
        document.getElementById('btn-limpiar-filtros')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal eventos
        this.setupModalEvents();

        // Form submit
        document.getElementById('form-membresia')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMembresia();
        });
    }

    setupModalEvents() {
        // Cerrar modales
        const closeButtons = ['btn-cerrar-modal', 'btn-cancelar-modal', 'btn-cerrar-detalle', 'btn-cerrar-detalle-2'];
        closeButtons.forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Editar desde detalle
        document.getElementById('btn-editar-desde-detalle')?.addEventListener('click', () => {
            document.getElementById('modal-detalle-membresia').classList.add('hidden');
            this.showModal(true, this.currentEditId);
        });

        // Cerrar modal con click fuera
        ['modal-membresia', 'modal-detalle-membresia'].forEach(modalId => {
            document.getElementById(modalId)?.addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    this.closeModals();
                }
            });
        });
    }

    async loadMembresias() {
        try {
            this.showLoadingState();
            
            let url = `${API_ENDPOINTS.memberships}?page=${this.currentPage}&limit=${this.limit}`;
            
            console.log('[Membresías] URL base:', url);
            
            // Determinar el tipo de solicitud basado en filtros y búsqueda
            if (this.searchQuery) {
                // Si hay búsqueda, usar el endpoint de search
                url = `${API_ENDPOINTS.memberships}/search?q=${encodeURIComponent(this.searchQuery)}&page=${this.currentPage}&limit=${this.limit}`;
                
                // Agregar filtros como query params a la búsqueda
                const filters = [];
                if (this.selectedStatus) {
                    filters.push(`status=${this.selectedStatus === 'true' ? 'activo' : 'inactivo'}`);
                }
                if (this.selectedType) {
                    filters.push(`tipo=${this.selectedType}`);
                }
                if (filters.length > 0) {
                    url += `&${filters.join('&')}`;
                }
                console.log('[Membresías] URL con búsqueda y filtros:', url);
            }
            else if (this.selectedStatus && this.selectedType) {
                // Si hay ambos filtros, obtener todos y filtrar localmente
                console.log('[Membresías] Aplicando filtros combinados localmente');
                await this.loadCombinedFilters();
                return;
            }
            else if (this.selectedStatus) {
                // Solo filtro por estado
                url = `${API_ENDPOINTS.memberships}/filter/status?status=${this.selectedStatus === 'true' ? 'activo' : 'inactivo'}&page=${this.currentPage}&limit=${this.limit}`;
                console.log('[Membresías] URL con filtro por estado:', url);
            }
            else if (this.selectedType) {
                // Solo filtro por tipo
                url = `${API_ENDPOINTS.memberships}/filter/type?tipo=${this.selectedType}&page=${this.currentPage}&limit=${this.limit}`;
                console.log('[Membresías] URL con filtro por tipo:', url);
            }

            console.log('[Membresías] Haciendo petición a:', url);
            const data = await fetchWithAuth(url);
            
            console.log('[Membresías] Datos recibidos:', data);
            
            if (data.success) {
                const memberships = data.data?.membresias || data.membresias || [];
                
                // Actualizar paginación como en ventas
                this.paginacionActual = {
                    current_page: data.data?.pagination?.current_page || this.currentPage,
                    total_pages: data.data?.pagination?.total_pages || 1,
                    per_page: data.data?.pagination?.per_page || this.limit,
                    total: data.data?.pagination?.total || memberships.length,
                    has_prev_page: data.data?.pagination?.has_prev_page || false,
                    has_next_page: data.data?.pagination?.has_next_page || false
                };
                
                console.log('[Membresías] Paginación:', this.paginacionActual);
                
                this.renderMembresias(memberships);
                this.renderizarPaginacion();
            } else {
                throw new Error(data.error || 'Error al cargar membresías');
            }
        } catch (error) {
            console.error('[Membresías] Error completo:', error);
            this.showErrorState('Error al cargar las membresías: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    renderMembresias(memberships) {
        const tbody = document.getElementById('tabla-membresias');
        if (!tbody) return;

        if (!memberships || memberships.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                            <i data-lucide="search-x" class="w-12 h-12 mb-4 opacity-50"></i>
                            <p class="text-lg mb-2">No se encontraron membresías</p>
                            <p class="text-sm">Intenta ajustar los filtros o agregar una nueva membresía.</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = memberships.map(membership => {
                const isActive = membership.status_membresia === 'activo';
                return `
                    <tr class="tabla-row transition-colors">
                        <td class="px-6 py-4 font-medium text-gray-100">${membership.nombre_membresia}</td>
                        <td class="px-6 py-4 text-gray-300">$${parseFloat(membership.precio).toFixed(2)}</td>
                        <td class="px-6 py-4 text-gray-300 capitalize">${membership.tipo_membresia}</td>
                        <td class="px-6 py-4 text-gray-300">
                            ${this.formatDuration(membership.meses, membership.semanas, membership.dias)}
                        </td>
                        <td class="px-6 py-4 text-gray-300">${this.formatDate(membership.fecha_creacion)}</td>
                        <td class="px-6 py-4">
                            <span class="badge ${
                                isActive ? 'badge-activo' : 'badge-inactivo'
                            }">
                                ${isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex space-x-2">
                                <button 
                                    onclick="membresiasManager.viewMembership('${membership.id}')"
                                    class="btn-accion btn-ver"
                                    title="Ver detalles"
                                >
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                                <button 
                                    onclick="membresiasManager.editMembership('${membership.id}')"
                                    class="btn-accion btn-editar"
                                    title="Editar"
                                >
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button 
                                    onclick="membresiasManager.toggleMembershipStatus('${membership.id}', ${isActive})"
                                    class="btn-accion btn-toggle"
                                    title="${isActive ? 'Deshabilitar' : 'Habilitar'}"
                                >
                                    <i data-lucide="${isActive ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
                                </button>
                                <button 
                                    onclick="membresiasManager.deleteMembership('${membership.id}')"
                                    class="btn-accion btn-eliminar"
                                    title="Eliminar"
                                >
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Reinicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // 🎨 RENDERIZAR PAGINACIÓN (idéntica a ventas)
    renderizarPaginacion() {
        const paginacionContainer = document.getElementById('paginacion-membresias');
        if (!paginacionContainer) return;
        
        const { current_page, total_pages, has_prev_page, has_next_page, total } = this.paginacionActual;
        const membershipsCount = document.getElementById('tabla-membresias')?.children?.length || 0;
        
        paginacionContainer.innerHTML = `
            <div class="flex items-center justify-between mt-6">
                <div class="text-sm text-gray-400">
                    Mostrando ${membershipsCount} de ${total} membresías
                </div>
                <div class="flex items-center space-x-2">
                    <button 
                        ${!has_prev_page ? 'disabled' : ''} 
                        onclick="membresiasManager.cambiarPagina(${current_page - 1})" 
                        class="px-3 py-2 text-sm rounded-lg ${!has_prev_page ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-500'}">
                        Anterior
                    </button>
                    
                    <div class="flex items-center space-x-1">
                        ${this.generarNumerosPagina(current_page, total_pages)}
                    </div>
                    
                    <button 
                        ${!has_next_page ? 'disabled' : ''} 
                        onclick="membresiasManager.cambiarPagina(${current_page + 1})" 
                        class="px-3 py-2 text-sm rounded-lg ${!has_next_page ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-500'}">
                        Siguiente
                    </button>
                </div>
            </div>
        `;
    }

    generarNumerosPagina(currentPage, totalPages) {
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        let pages = [];
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button 
                    onclick="membresiasManager.cambiarPagina(${i})" 
                    class="px-3 py-2 text-sm rounded-lg ${i === currentPage ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
    }

    cambiarPagina(page) {
        if (page < 1 || page > this.paginacionActual.total_pages) return;
        this.currentPage = page;
        this.loadMembresias();
    }

    async loadCombinedFilters() {
        try {
            // Obtener todas las membresías sin filtros
            const url = `${API_ENDPOINTS.memberships}?page=1&limit=1000`; // Obtener un gran número para incluir todas
            const data = await fetchWithAuth(url);
            
            if (data.success) {
                let memberships = data.data?.membresias || data.membresias || [];
                
                // Aplicar filtros localmente
                const statusValue = this.selectedStatus === 'true' ? 'activo' : 'inactivo';
                
                console.log('[Membresías] Aplicando filtros:', {
                    status: statusValue,
                    tipo: this.selectedType,
                    total_inicial: memberships.length
                });
                
                // Filtrar por estado
                if (this.selectedStatus) {
                    memberships = memberships.filter(m => m.status_membresia === statusValue);
                    console.log('[Membresías] Después de filtro por estado:', memberships.length);
                }
                
                // Filtrar por tipo
                if (this.selectedType) {
                    memberships = memberships.filter(m => m.tipo_membresia === this.selectedType);
                    console.log('[Membresías] Después de filtro por tipo:', memberships.length);
                }
                
                // Aplicar paginación local
                const startIndex = (this.currentPage - 1) * this.limit;
                const endIndex = startIndex + this.limit;
                const paginatedMemberships = memberships.slice(startIndex, endIndex);
                
                // Simular paginación
                this.paginacionActual = {
                    current_page: this.currentPage,
                    total_pages: Math.ceil(memberships.length / this.limit),
                    per_page: this.limit,
                    total: memberships.length,
                    has_prev_page: this.currentPage > 1,
                    has_next_page: this.currentPage < Math.ceil(memberships.length / this.limit)
                };
                
                console.log('[Membresías] Paginación filtros combinados:', this.paginacionActual);
                
                this.renderMembresias(paginatedMemberships);
                this.renderizarPaginacion();
            } else {
                throw new Error(data.error || 'Error al cargar membresías');
            }
        } catch (error) {
            console.error('[Membresías] Error en filtros combinados:', error);
            this.showErrorState('Error al aplicar filtros combinados: ' + error.message);
        }
    }

    formatDuration(meses, semanas, dias) {
        const parts = [];
        if (meses && meses > 0) parts.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
        if (semanas && semanas > 0) parts.push(`${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`);
        if (dias && dias > 0) parts.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
        return parts.join(', ') || 'No definida';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            let date;
            
            // Si es un timestamp en segundos (número)
            if (typeof dateString === 'number') {
                date = new Date(dateString * 1000); // Convertir de segundos a milisegundos
            }
            // Si es un objeto con seconds (Firestore Timestamp) - formato completo
            else if (typeof dateString === 'object' && dateString.seconds) {
                date = new Date(dateString.seconds * 1000);
            }
            // Si es un objeto con type firestore (formato serializado de Firestore)
            else if (typeof dateString === 'object' && dateString.type === 'firestore/timestamp/1.0') {
                date = new Date(dateString.seconds * 1000);
            }
            // Si es una cadena de fecha
            else {
                date = new Date(dateString);
            }
            
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                console.warn('[Membresías] Fecha inválida:', dateString);
                return 'Fecha no válida';
            }
            
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('[Membresías] Error al formatear fecha:', error, dateString);
            return 'Error en fecha';
        }
    }

    showModal(isEdit = false, membershipId = null) {
        this.isEditing = isEdit;
        this.currentEditId = membershipId;

        const modal = document.getElementById('modal-membresia');
        const titulo = document.getElementById('modal-titulo');
        const textoBoton = document.getElementById('texto-boton-guardar');

        if (isEdit) {
            titulo.textContent = 'Editar Membresía';
            textoBoton.textContent = 'Actualizar Membresía';
            this.loadMembershipForEdit(membershipId);
        } else {
            titulo.textContent = 'Nueva Membresía';
            textoBoton.textContent = 'Guardar Membresía';
            this.resetForm();
        }

        modal.classList.remove('hidden');
        
        // Focus en el primer campo
        setTimeout(() => {
            document.getElementById('nombre-membresia')?.focus();
        }, 100);
    }

    async loadMembershipForEdit(id) {
        try {
            const data = await fetchWithAuth(`${API_ENDPOINTS.memberships}/${id}`);
            if (data.success) {
                const membership = data.data?.membresia || data.membresia || data.data;
                this.fillForm(membership);
            } else {
                throw new Error(data.error || 'Error al cargar datos de la membresía');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos de la membresía', 'error');
            this.closeModals();
        }
    }

    fillForm(membership) {
        document.getElementById('nombre-membresia').value = membership.nombre_membresia || '';
        document.getElementById('precio').value = membership.precio || '';
        document.getElementById('tipo-membresia').value = membership.tipo_membresia || '';
        document.getElementById('meses').value = membership.meses || 0;
        document.getElementById('semanas').value = membership.semanas || 0;
        document.getElementById('dias').value = membership.dias || 0;
    }

    resetForm() {
        document.getElementById('form-membresia').reset();
        document.getElementById('meses').value = 0;
        document.getElementById('semanas').value = 0;
        document.getElementById('dias').value = 0;
    }

    async saveMembresia() {
        const form = document.getElementById('form-membresia');
        const formData = new FormData(form);
        
        const membershipData = {
            nombre_membresia: formData.get('nombre_membresia'),
            precio: parseFloat(formData.get('precio')),
            tipo_membresia: formData.get('tipo_membresia'),
            meses: parseInt(formData.get('meses')) || 0,
            semanas: parseInt(formData.get('semanas')) || 0,
            dias: parseInt(formData.get('dias')) || 0,
            status_membresia: 'activo'
        };

        // Validaciones
        if (!membershipData.nombre_membresia || !membershipData.precio || !membershipData.tipo_membresia) {
            Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
            return;
        }

        if (membershipData.precio <= 0) {
            Swal.fire('Error', 'El precio debe ser mayor a 0', 'error');
            return;
        }

        if (membershipData.meses === 0 && membershipData.semanas === 0 && membershipData.dias === 0) {
            Swal.fire('Error', 'Debe especificar al menos una duración (meses, semanas o días)', 'error');
            return;
        }

        try {
            this.setLoadingButton(true);

            const url = this.isEditing ? `${API_ENDPOINTS.memberships}/${this.currentEditId}` : API_ENDPOINTS.memberships;
            const method = this.isEditing ? 'PUT' : 'POST';

            const data = await fetchWithAuth(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(membershipData)
            });

            if (data.success) {
                const action = this.isEditing ? 'actualizada' : 'creada';
                Swal.fire('Éxito', `Membresía ${action} correctamente`, 'success');
                this.closeModals();
                this.loadMembresias();
            } else {
                throw new Error(data.error || 'Error al guardar la membresía');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', error.message || 'Error al guardar la membresía', 'error');
        } finally {
            this.setLoadingButton(false);
        }
    }

    async viewMembership(id) {
        try {
            const data = await fetchWithAuth(`${API_ENDPOINTS.memberships}/${id}`);
            if (data.success) {
                const membership = data.data?.membresia || data.membresia || data.data;
                this.showMembershipDetails(membership);
            } else {
                throw new Error(data.error || 'Error al cargar detalles de la membresía');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudieron cargar los detalles de la membresía', 'error');
        }
    }

    showMembershipDetails(membership) {
        this.currentEditId = membership.id;
        
        const contenido = document.getElementById('contenido-detalle');
        contenido.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-700/30 p-4 rounded-lg">
                        <h4 class="text-sm font-medium text-gray-400 mb-1">Nombre</h4>
                        <p class="text-lg text-gray-100">${membership.nombre_membresia}</p>
                    </div>
                    <div class="bg-gray-700/30 p-4 rounded-lg">
                        <h4 class="text-sm font-medium text-gray-400 mb-1">Precio</h4>
                        <p class="text-lg text-green-400 font-semibold">$${parseFloat(membership.precio).toFixed(2)}</p>
                    </div>
                    <div class="bg-gray-700/30 p-4 rounded-lg">
                        <h4 class="text-sm font-medium text-gray-400 mb-1">Tipo</h4>
                        <p class="text-lg text-gray-100 capitalize">${membership.tipo_membresia}</p>
                    </div>
                    <div class="bg-gray-700/30 p-4 rounded-lg">
                        <h4 class="text-sm font-medium text-gray-400 mb-1">Estado</h4>
                        <span class="px-3 py-1 text-sm font-medium rounded-full ${
                            membership.status_membresia === 'activo'
                                ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                                : 'bg-red-900/30 text-red-400 border border-red-500/30'
                        }">
                            ${membership.status_membresia === 'activo' ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                </div>
                
                <div class="bg-gray-700/30 p-4 rounded-lg">
                    <h4 class="text-sm font-medium text-gray-400 mb-2">Duración</h4>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p class="text-2xl font-bold text-blue-400">${membership.meses || 0}</p>
                            <p class="text-sm text-gray-400">Meses</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-purple-400">${membership.semanas || 0}</p>
                            <p class="text-sm text-gray-400">Semanas</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-green-400">${membership.dias || 0}</p>
                            <p class="text-sm text-gray-400">Días</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-700/30 p-4 rounded-lg">
                    <h4 class="text-sm font-medium text-gray-400 mb-1">Fecha de Creación</h4>
                    <p class="text-gray-100">${this.formatDate(membership.fecha_creacion)}</p>
                </div>
            </div>
        `;

        document.getElementById('modal-detalle-membresia').classList.remove('hidden');
    }

    async editMembership(id) {
        this.showModal(true, id);
    }

    async toggleMembershipStatus(id, currentStatus) {
        const action = currentStatus ? 'deshabilitar' : 'habilitar';
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: `¿Desea ${action} esta membresía?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: currentStatus ? '#dc2626' : '#059669',
        });

        if (result.isConfirmed) {
            try {
                const endpoint = currentStatus ? `${API_ENDPOINTS.memberships}/${id}/disable` : `${API_ENDPOINTS.memberships}/${id}/enable`;
                const data = await fetchWithAuth(endpoint, {
                    method: 'PUT'
                });

                if (data.success) {
                    const actionPast = currentStatus ? 'deshabilitada' : 'habilitada';
                    Swal.fire('Éxito', `Membresía ${actionPast} correctamente`, 'success');
                    this.loadMembresias();
                } else {
                    throw new Error(data.error || `Error al ${action} la membresía`);
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', error.message, 'error');
            }
        }
    }

    async deleteMembership(id) {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer. ¿Desea eliminar esta membresía?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        });

        if (result.isConfirmed) {
            try {
                const data = await fetchWithAuth(`${API_ENDPOINTS.memberships}/${id}`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    Swal.fire('Eliminado', 'Membresía eliminada correctamente', 'success');
                    this.loadMembresias();
                } else {
                    throw new Error(data.error || 'Error al eliminar la membresía');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', error.message, 'error');
            }
        }
    }

    clearFilters() {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.selectedType = '';
        this.currentPage = 1;

        const searchInput = document.getElementById('busqueda-membresia');
        const statusFilter = document.getElementById('filtro-estado');
        const typeFilter = document.getElementById('filtro-tipo');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (typeFilter) typeFilter.value = '';

        this.loadMembresias();
    }

    closeModals() {
        document.getElementById('modal-membresia').classList.add('hidden');
        document.getElementById('modal-detalle-membresia').classList.add('hidden');
        this.resetForm();
        this.isEditing = false;
        this.currentEditId = null;
    }

    setLoadingButton(isLoading) {
        const button = document.getElementById('btn-guardar-membresia');
        const text = document.getElementById('texto-boton-guardar');
        
        if (isLoading) {
            button.disabled = true;
            text.textContent = 'Guardando...';
            button.classList.add('opacity-75');
        } else {
            button.disabled = false;
            text.textContent = this.isEditing ? 'Actualizar Membresía' : 'Guardar Membresía';
            button.classList.remove('opacity-75');
        }
    }

    showLoadingState() {
        this.isLoading = true;
        const tbody = document.getElementById('tabla-membresias');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                            <p class="text-lg">Cargando membresías...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
        this.isLoading = false;
    }

    showErrorState(message) {
        const tbody = document.getElementById('tabla-membresias');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-red-400">
                        <div class="flex flex-col items-center">
                            <i data-lucide="alert-circle" class="w-12 h-12 mb-4 opacity-50"></i>
                            <p class="text-lg mb-2">Error al cargar</p>
                            <p class="text-sm">${message}</p>
                            <button onclick="membresiasManager.loadMembresias()" 
                                    class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Reinicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.membresiasManager = new MembresiasManager();
});

// Exportar para uso global
window.MembresiasManager = MembresiasManager;