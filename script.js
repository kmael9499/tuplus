// Interacciones del header TUPLUS
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  const navbarToggle = document.getElementById('navbarToggle');
  const navbarMenu = document.getElementById('navbarMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!navbar || !navbarToggle || !navbarMenu) return;

  const closeMenu = () => {
    navbarToggle.classList.remove('active');
    navbarMenu.classList.remove('active');
    navbarToggle.setAttribute('aria-expanded', 'false');
    navbarToggle.setAttribute('aria-label', 'Abrir menú');
  };

  navbarToggle.addEventListener('click', () => {
    const isOpen = navbarMenu.classList.toggle('active');
    navbarToggle.classList.toggle('active', isOpen);
    navbarToggle.setAttribute('aria-expanded', String(isOpen));
    navbarToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', function () {
      navLinks.forEach((item) => item.classList.remove('active'));
      this.classList.add('active');
      closeMenu();
    });
  });

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar-scrolled', window.scrollY > 20);
  }, { passive: true });
});
