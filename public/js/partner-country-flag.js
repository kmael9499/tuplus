(() => {
  document.querySelectorAll('#partner-form [name="country"],#pp-territory-form [name="country"]').forEach(select => {
    const flag = select.closest('label')?.querySelector('.pa-country-flag');
    if (!flag) return;
    const update = () => {
      const code = select.value;
      if (!/^[A-Z]{2}$/.test(code)) {
        flag.hidden = true;
        flag.removeAttribute('src');
        return;
      }
      flag.src = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
      flag.hidden = false;
    };
    flag.addEventListener('error', () => { flag.hidden = true; });
    select.addEventListener('change', update);
    update();
  });
})();
