// Función para actualizar la hora en el encabezado
const actualizarFechaHora = () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('fecha-hora-header').textContent = `Admin. | ${fecha} | ${hora}`;
};
setInterval(actualizarFechaHora, 60000); // Actualizar cada minuto
actualizarFechaHora(); // Llamar al inicio

// Lógica para mostrar y ocultar el modal (RF12)
const modal = document.getElementById('modal-agregar-socio');
const btnAgregar = document.getElementById('btn-agregar-socio');
const btnCerrar = document.getElementById('btn-cerrar-modal');
const btnCancelar = document.getElementById('btn-cancelar-registro');

btnAgregar.addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
};

btnCerrar.addEventListener('click', closeModal);
btnCancelar.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// Lógica para toggle en móvil
const sidebar = document.querySelector('.sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('menu-toggle').addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
});
backdrop.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
});

// Inicializar iconos de Lucide
lucide.createIcons();
