(() => {
  "use strict";
  const countries = window.TUPLUS_PARTNER_COUNTRIES;
  const writeText = (node, key) => {
    if (window.TUPLUS_I18N) window.TUPLUS_I18N.setText(node, key);
    else {
      node.dataset.i18n = key;
      node.textContent = window.TUPLUS_TRANSLATIONS?.es?.[key] || key;
    }
  };
  const buttons = [...document.querySelectorAll("[data-country]")];
  const search = document.getElementById("pp-country-search"),
    filter = document.getElementById("pp-region-filter");
  const normalize = (value) =>
    value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  let selected = "PE";
  function showCountry(id, focusGlobe = true) {
    if (!countries[id]) return;
    selected = id;
    const territoryCountry = document.getElementById('pp-territory-country');
    if (territoryCountry && territoryCountry.value !== id) {
      territoryCountry.value = id;
      territoryCountry.dispatchEvent(new Event('change', {bubbles:true}));
    }
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.country === id),
      ),
    );
    writeText(
      document.getElementById("pp-country-name"),
      "partner.country" + id,
    );
    writeText(
      document.getElementById("pp-country-region"),
      "partner." + countries[id].region,
    );
    if (focusGlobe) window.TUPLUS_GLOBE?.focusCountry(id);
  }
  function applyFilters(focusGlobe = true) {
    const query = normalize(search.value);
    const ids = Object.keys(countries).filter((id) => {
      const names = [
        id,
        countries[id].name,
        ...Object.values(window.TUPLUS_TRANSLATIONS || {}).map(
          (dict) => dict["partner.country" + id] || "",
        ),
      ];
      return (
        names.some((name) => normalize(name).includes(query)) &&
        (filter.value === "all" || countries[id].region === filter.value)
      );
    });
    document
      .querySelectorAll(".pp-country-list [data-country]")
      .forEach(
        (button) => (button.hidden = !ids.includes(button.dataset.country)),
      );
    document.getElementById("pp-result-count").textContent =
      ids.length + " / 6";
    document.getElementById("pp-clear-search").hidden =
      !query && filter.value === "all";
    document.getElementById("pp-map-empty").hidden = ids.length > 0;
    document.querySelector(".pp-country-info").hidden = ids.length === 0;
    // The territory form owns its action state independently of map search results.
    window.TUPLUS_GLOBE?.filter(ids);
    if (ids.length)
      showCountry(ids.includes(selected) ? selected : ids[0], focusGlobe);
    else
      document
        .querySelectorAll(".pp-country-list [data-country]")
        .forEach((button) => button.setAttribute("aria-pressed", "false"));
  }
  function clearFilters() {
    search.value = "";
    filter.value = "all";
  }
  function selectFromGlobe(id) {
    if (!countries[id]) return;
    clearFilters();
    selected = id;
    applyFilters();
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      if (button.closest(".pp-globe-country-list"))
        selectFromGlobe(button.dataset.country);
      else showCountry(button.dataset.country);
    }),
  );
  document.addEventListener("tuplus:country-select", (event) =>
    selectFromGlobe(event.detail?.id),
  );
  search.addEventListener("input", () => applyFilters());
  filter.addEventListener("change", () => applyFilters());
  document.querySelectorAll("[data-clear-filters]").forEach((button) =>
    button.addEventListener("click", () => {
      clearFilters();
      selected = "PE";
      applyFilters();
      search.focus();
    }),
  );
  document.querySelector(".pp-map-tools").hidden = false;
  document
    .querySelectorAll(".pp-country-list,.pp-globe-country-list")
    .forEach((group) =>
      group.addEventListener("keydown", (event) => {
        const options = [...group.querySelectorAll("[data-country]")].filter(
          (button) => !button.hidden,
        );
        const index = options.indexOf(event.target.closest("[data-country]"));
        if (index < 0) return;
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
          next = (index + 1) % options.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index - 1 + options.length) % options.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = options.length - 1;
        else return;
        event.preventDefault();
        options[next].focus({ preventScroll: true });
        options[next].click();
      }),
    );
  const rankKeys = {
    basic: "basic",
    advanced: "advanced",
    master: "rankMaster",
  };
  document.querySelectorAll('input[name="partner-level"]').forEach((input) =>
    input.addEventListener("change", () => {
      if (input.checked && rankKeys[input.value])
        writeText(
          document.getElementById("pp-selected-level-name"),
          "partner." + rankKeys[input.value],
        );
    }),
  );
  document.getElementById("pp-selected-level").hidden = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;
  const items = document.querySelectorAll(".pp-reveal");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("pp-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.06 },
  );
  items.forEach((item) => {
    const bounds = item.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
    item.classList.add("pp-reveal-ready");
    observer.observe(item);
  });
  motion.addEventListener("change", (event) => {
    if (event.matches) {
      observer.disconnect();
      items.forEach((item) => item.classList.add("pp-visible"));
    }
  });
})();
