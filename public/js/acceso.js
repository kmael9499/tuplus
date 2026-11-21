(() => {
  const API = window.TUPLUS_AUTH_API_URL || 'http://localhost:8080';
  const forms = ['login-form', 'mfa-form', 'forgot-form'].map(id => document.getElementById(id));
  const showForm = (target) => forms.forEach(form => { form.hidden = form.id !== target; });
  const message = (id, text) => { document.getElementById(id).textContent = text || ''; };
  const post = async (path, body) => {
    const response = await fetch(`${API}${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };
  document.getElementById('toggle-password').addEventListener('click', (event) => {
    const input = document.getElementById('password');
    const shown = input.type === 'password'; input.type = shown ? 'text' : 'password';
    event.currentTarget.textContent = shown ? 'Ocultar' : 'Mostrar'; event.currentTarget.setAttribute('aria-pressed', String(shown));
  });
  document.getElementById('forgot-open').addEventListener('click', () => { showForm('forgot-form'); document.getElementById('reset-email').value = document.getElementById('email').value; });
  document.getElementById('back-login').addEventListener('click', () => showForm('login-form'));
  document.getElementById('back-login-forgot').addEventListener('click', () => showForm('login-form'));
  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); message('login-message', '');
    const submit = document.getElementById('login-submit'); submit.disabled = true;
    try {
      const { response, data } = await post('/api/auth/login', { email: event.currentTarget.email.value, password: event.currentTarget.password.value });
      if (!response.ok) { message('login-message', data.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.'); return; }
      if (data.requiresCode) { message('mfa-message', ''); showForm('mfa-form'); document.getElementById('code').focus(); return; }
      window.location.assign(data.redirect || 'red-socios.html');
    } catch { message('login-message', 'No pudimos conectar con el servicio de acceso. Inténtalo más tarde.'); }
    finally { submit.disabled = false; }
  });
  document.getElementById('mfa-form').addEventListener('submit', async (event) => {
    event.preventDefault(); message('mfa-message', '');
    try { const { response, data } = await post('/api/auth/verify-email-code', { code: event.currentTarget.code.value }); if (!response.ok) { message('mfa-message', data.message || 'El código no es válido o ya venció.'); return; } window.location.assign(data.redirect || 'red-socios.html'); }
    catch { message('mfa-message', 'No pudimos validar el código. Inténtalo de nuevo.'); }
  });
  document.getElementById('forgot-form').addEventListener('submit', async (event) => {
    event.preventDefault(); message('forgot-message', '');
    try { const { response, data } = await post('/api/auth/forgot-password', { email: event.currentTarget.email.value }); if (!response.ok) { message('forgot-message', data.message || 'No se pudo procesar la solicitud.'); return; } message('forgot-message', data.message); }
    catch { message('forgot-message', 'No pudimos conectar con el servicio. Inténtalo más tarde.'); }
  });
})();
