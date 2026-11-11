(() => {
  const API = window.TUPLUS_AUTH_API_URL || 'http://localhost:8080';
  const form = document.getElementById('reset-form');
  const message = document.getElementById('reset-message');
  const token = new URLSearchParams(location.search).get('token') || '';
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); message.textContent = '';
    const password = form.password.value;
    if (password !== form.confirm.value) { message.textContent = 'Las contraseñas no coinciden.'; return; }
    try {
      const response = await fetch(`${API}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json(); message.textContent = result.message || 'No se pudo cambiar la contraseña.';
      if (response.ok) { form.reset(); window.setTimeout(() => location.assign('acceso.html'), 1800); }
    } catch { message.textContent = 'No pudimos conectar con el servicio. Inténtalo más tarde.'; }
  });
})();
