(() => {
  'use strict';

  const root = document.documentElement;
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', month: 'numeric', day: 'numeric'
  });
  let activeSeason = null;

  function getSeason() {
    const previewSeason = new URLSearchParams(window.location.search).get('temporada')?.toLowerCase();
    if (previewSeason === 'navidad' || previewSeason === 'christmas') return 'christmas';
    if (previewSeason === 'halloween') return 'halloween';
    const parts = timeFormatter.formatToParts(new Date());
    const month = Number(parts.find(part => part.type === 'month')?.value);
    const day = Number(parts.find(part => part.type === 'day')?.value);
    if ((month === 10 && day >= 20) || (month === 11 && day <= 1)) return 'halloween';
    if ((month === 11 && day >= 4) || month === 12 || (month === 1 && day <= 6)) return 'christmas';
    return '';
  }

  function clearSeason() {
    document.querySelectorAll('.seasonal-atmosphere, .seasonal-hat').forEach(element => element.remove());
    root.classList.remove('season-halloween', 'season-christmas');
    delete root.dataset.season;
  }

  function renderSeason(season) {
    clearSeason();
    if (!season) return;
    root.dataset.season = season;
    root.classList.add('season-' + season);

    const atmosphere = document.createElement('div');
    atmosphere.className = 'seasonal-atmosphere seasonal-' + season;
    atmosphere.setAttribute('aria-hidden', 'true');

    if (season === 'christmas') {
      for (let index = 0; index < 28; index += 1) {
        const flake = document.createElement('i');
        flake.className = 'seasonal-snowflake';
        flake.style.setProperty('--snow-left', (Math.random() * 100).toFixed(2) + 'vw');
        flake.style.setProperty('--snow-size', (3 + Math.random() * 5).toFixed(1) + 'px');
        flake.style.setProperty('--snow-duration', (9 + Math.random() * 12).toFixed(1) + 's');
        flake.style.setProperty('--snow-delay', (-Math.random() * 20).toFixed(1) + 's');
        flake.style.setProperty('--snow-static', (8 + Math.random() * 84).toFixed(1) + 'vh');
        atmosphere.append(flake);
      }
    } else {
      for (let index = 0; index < 5; index += 1) {
        const bat = document.createElement('span');
        bat.className = 'seasonal-bat';
        bat.textContent = '🦇';
        bat.style.setProperty('--bat-top', (12 + index * 15) + 'vh');
        bat.style.setProperty('--bat-delay', (-index * 3.4) + 's');
        bat.style.setProperty('--bat-size', (20 + (index % 3) * 8) + 'px');
        bat.style.setProperty('--bat-static-x', (8 + index * 17) + 'vw');
        bat.style.setProperty('--bat-static-y', (12 + index * 15) + 'vh');
        atmosphere.append(bat);
      }
    }

    document.body.prepend(atmosphere);
  }

  function updateSeason() {
    const season = getSeason();
    if (season === activeSeason) return;
    activeSeason = season;
    renderSeason(season);
  }

  updateSeason();
  window.setInterval(updateSeason, 30 * 60 * 1000);
})();
