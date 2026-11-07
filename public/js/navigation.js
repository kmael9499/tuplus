(() => {
  const menus = [...document.querySelectorAll('.nav-networks')];
  document.addEventListener('click', event => {
    menus.forEach(menu => {
      if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    menus.forEach(menu => {
      if (!menu.open) return;
      const hasFocus = menu.contains(document.activeElement);
      menu.open = false;
      if (hasFocus) menu.querySelector('summary').focus();
    });
  });
})();
