(() => {
  const API = window.TUPLUS_AUTH_API_URL || 'http://localhost:8080';
  const state = document.getElementById('portal-state');
  const content = document.getElementById('portal-content');
  const logout = document.getElementById('logout');
  fetch(`${API}/api/auth/session`, { credentials: 'include' }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { location.replace('acceso.html'); return; }
    document.getElementById('member-name').textContent = data.account.name;
    document.getElementById('member-email').textContent = data.account.email;
    state.textContent = data.account.role === 'direccion' ? 'Tu acceso de Dirección está verificado.' : 'Tu acceso a la Red de Socios está activo.';
    content.hidden = false;
  }).catch(() => { state.textContent = 'No pudimos verificar tu sesión. Revisa la conexión e inténtalo nuevamente.'; });
  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try { await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } finally { location.assign('acceso.html'); }
  });
})();
