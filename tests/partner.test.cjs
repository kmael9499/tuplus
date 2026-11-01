const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { parseHTML } = require("linkedom");
const base = path.resolve(__dirname, "../dist");
const pause = () => new Promise((r) => setTimeout(r, 0));
(async () => {
  const { window } = parseHTML(
    fs.readFileSync(path.join(base, "partner.html"), "utf8"),
  );
  const { document } = window; Object.defineProperty(document.getElementById("pp-territory-country"),"value",{value:"",writable:true}); Object.defineProperty(document.querySelector('#partner-form [name="country"]'),"value",{value:"",writable:true});
  const picker = document.getElementById("site-language"),
    region = document.getElementById("pp-region-filter");
  Object.defineProperty(picker, "value", { value: "es", writable: true });
  Object.defineProperty(region, "value", { value: "all", writable: true });
  const store = new Map(),
    globeCalls = { country: null, ids: [] };
  window.TUPLUS_GLOBE = {
    focusCountry(id) {
      globeCalls.country = id;
    },
    filter(ids) {
      globeCalls.ids = ids;
    },
  };
  const ctx = vm.createContext({
    window,
    document,
    Node: window.Node,
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: window.MutationObserver,
    CustomEvent: window.CustomEvent, Event:window.Event,
    localStorage: {
      getItem: (k) => store.get(k),
      setItem: (k, v) => store.set(k, v),
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    history: {}, URLSearchParams, location: {href:""},
    performance: { getEntriesByType: () => [] },
    addEventListener() {},
    console,
  });
  for (const file of [
    "theme.js",
    "i18n-data.js",
    "partner-translations.js", "partner-application-translations.js", "partner-territory.js",
    "i18n.js",
    "partner-countries.js",
    "partner-public.js",
  ])
    vm.runInContext(fs.readFileSync(path.join(base, "js", file), "utf8"), ctx);
  document.dispatchEvent(new window.Event("DOMContentLoaded"));
  const territoryForm=document.getElementById('pp-territory-form');
  territoryForm.querySelectorAll('input').forEach(el=>el.setCustomValidity=()=>{});
  territoryForm.reportValidity=()=>true;
  document.getElementById('pp-territory-country').value='PE';
  document.getElementById('pp-territory-city').value='Lima';
  document.getElementById('pp-territory-region').value='Lima';
  territoryForm.dispatchEvent(new window.Event('submit',{cancelable:true}));
  const applicationField=name=>document.querySelector('#partner-form [name="'+name+'"]');
  assert.equal(ctx.location.href,'');assert.equal(applicationField('country').value,'PE');assert.equal(applicationField('city').value,'Lima');assert.equal(applicationField('region').value,'Lima');
  assert.equal(document.querySelector('.pp-final'),null);
  assert.deepEqual([...document.querySelectorAll('main section[id]')].map(el=>el.id),['que-es','niveles','territorios','requisitos','preguntas']);assert.ok(document.getElementById('postulacion'));
  const api = window.TUPLUS_I18N,
    dict = window.TUPLUS_TRANSLATIONS,
    data = window.TUPLUS_PARTNER_COUNTRIES;
  let checks = 0;
  assert.deepEqual(Object.keys(data).sort(), [
    "DE",
    "ES",
    "JP",
    "PE",
    "PT",
    "US",
  ]);
  assert.equal(document.querySelectorAll("[data-globe]").length, 2);
  assert.equal(document.querySelector(".pp-section-nav"), null);
  const search = document.getElementById("pp-country-search");
  for (const locale of ["es", "en", "zh", "ru", "pt", "fr", "ja", "de", "es"]) {
    picker.value = locale;
    picker.dispatchEvent(new window.Event("change"));
    await pause();
    assert.equal(store.get("tuplus-language"), locale); assert.ok(!document.getElementById("pp-selected-level").textContent.includes("estimateText"));
    checks++;
    for (const node of document.querySelectorAll("[data-i18n-html]")) {
      const key = node.getAttribute("data-i18n-html");
      assert.ok(dict[locale][key], locale + ": " + key);
      assert.equal(node.innerHTML, dict[locale][key]);
      assert.equal(node.querySelectorAll("em").length, 1, key);
      checks++;
    }
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const key = node.getAttribute("data-i18n");
      assert.ok(dict[locale][key], locale + ": " + key);
      assert.equal(node.textContent, dict[locale][key]);
      checks++;
    }
    for (const theme of ["dark", "light"]) {
      if (document.documentElement.dataset.theme !== theme)
        document.querySelector(".theme-toggle").click();
      assert.equal(document.documentElement.dataset.theme, theme);
      checks++;
      for (const [country,city,state,enabled] of [['PE','  LÍMA  ','open',true],['ES','Madrid','limited',true],['PT','Lisboa','future',false],['US','Boston','closed',false],['DE','Berlin','unavailable',false],['ES','Madrid','limited',true],['PE','','open',false]]) {
        const countryInput=document.getElementById('pp-territory-country'), cityInput=document.getElementById('pp-territory-city');
        countryInput.value=country;countryInput.dispatchEvent(new window.Event('change'));cityInput.value=city;cityInput.dispatchEvent(new window.Event('input'));
        const availability=territoryForm.querySelector('.territory-availability');
        assert.equal(availability.dataset.state,state);
        assert.equal(availability.querySelector('.territory-availability-badge').textContent,dict[locale]['territory.status.'+state]);
        assert.equal(document.getElementById('pp-map-cta').disabled,!enabled);
        applicationField('city').value='unchanged';territoryForm.dispatchEvent(new window.Event('submit',{cancelable:true}));
        assert.equal(applicationField('city').value,enabled?city.trim():'unchanged');
        checks+=4;
      }
      for(const id of Object.keys(data)) {
        const card=document.querySelector('[data-territory="'+id+'"]');card.click();
        assert.equal(card.getAttribute('aria-pressed'),'true');
        assert.equal(document.getElementById('pp-territory-country').value,id);
        assert.equal(globeCalls.country,id);
        assert.equal(document.getElementById('pp-map-cta').hidden,!['PE','ES'].includes(id));
        assert.equal(card.querySelector('.territory-card-status').textContent,dict[locale]['territory.status.'+card.dataset.state]);checks+=5;
      }
      for (const id of Object.keys(data)) {
        document
          .querySelector('.pp-globe-country-list [data-country="' + id + '"]')
          .click();
        await pause();
        assert.equal(
          document.getElementById("pp-country-name").textContent,
          dict[locale]["partner.country" + id],
        );
        assert.equal(
          document.getElementById("pp-country-region").textContent,
          dict[locale]["partner." + data[id].region],
        );
        assert.equal(globeCalls.country, id);
        assert.equal(
          document.querySelectorAll('[data-country][aria-pressed="true"]')
            .length,
          2,
        );
        checks += 4;
      }
    }
    const ranks = [...document.querySelectorAll('input[name="partner-level"]')];
    assert.equal(ranks.length, 3);
    for (const rank of ranks) {
      ranks.forEach((r) => (r.checked = r === rank));
      rank.dispatchEvent(new window.Event("change"));
      await pause();
      assert.equal(
        document.getElementById("pp-selected-level-name").textContent,
        dict[locale][
          "partner." + (rank.value === "master" ? "rankMaster" : rank.value)
        ],
      );
      checks++;
    }
    search.value = "  JAPÓN  ";
    search.dispatchEvent(new window.Event("input"));
    await pause();
    assert.equal(
      document.getElementById("pp-result-count").textContent,
      "1 / 6",
    );
    assert.equal(globeCalls.country, "JP");
    checks += 2;
    region.value = "europe";
    region.dispatchEvent(new window.Event("change"));
    await pause();
    assert.equal(document.getElementById("pp-map-empty").hidden, false);
    assert.ok(document.querySelector(".territory-cards"));
    assert.equal(globeCalls.ids.length, 0);
    checks += 3;
    document.getElementById("pp-clear-search").click();
    await pause();
    assert.equal(
      document.getElementById("pp-result-count").textContent,
      "6 / 6",
    );
    assert.equal(document.querySelector(".pp-country-info").hidden, false);
    checks += 2;
    region.value = "europe";
    region.dispatchEvent(new window.Event("change"));
    await pause();
    assert.equal(
      document.getElementById("pp-result-count").textContent,
      "3 / 6",
    );
    checks++;
    document.dispatchEvent(
      new window.CustomEvent("tuplus:country-select", { detail: { id: "US" } }),
    );
    await pause();
    assert.equal(region.value, "all");
    assert.equal(
      document.getElementById("pp-country-name").textContent,
      dict[locale]["partner.countryUS"],
    );
    checks += 2;
  }
  const pt = document.querySelector('.pp-country-list [data-country="PT"]');
  const key = new window.Event("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(key, "key", { value: "ArrowRight" });
  pt.dispatchEvent(key);
  await pause();
  assert.equal(globeCalls.country, "ES");
  assert.equal(key.defaultPrevented, true);
  checks += 2;
  api.setLocale("en");
  await pause();
  const missing = [];
  const walk = document.createTreeWalker(document.body, 4);
  let node;
  while ((node = walk.nextNode())) {
    if (
      node.parentElement?.closest(
        '[translate="no"],[data-i18n],[data-i18n-html],script,style,svg,noscript,[aria-hidden="true"]',
      )
    )
      continue;
    const text = node.nodeValue?.trim().replace(/\s+/g, " ");
    if (
      text &&
      /[a-záéíóú]/i.test(text) &&
      !Object.values(dict.en).includes(text)
    )
      missing.push(text);
  }
  assert.deepEqual([...new Set(missing)], [], "Untranslated text");
  for (const a of document.querySelectorAll("a[href]")) {
    const url = new URL(a.getAttribute("href"), "http://local/partner.html");
    if (url.host !== "local") continue;
    const file = path.join(base, url.pathname);
    assert.ok(fs.existsSync(file), file);
    if (url.hash)
      assert.ok(
        parseHTML(fs.readFileSync(file, "utf8")).document.getElementById(
          url.hash.slice(1),
        ),
        url.href,
      );
  }
  for (const file of [
    "js/partner-globe.js",
    "js/partner-countries.js",
    "css/partner-globe.css",
    "imagenes/partner/earth-mask.svg",
    "colibri.png",
  ])
    assert.ok(fs.existsSync(path.join(base, file)), file);
  console.log(
    `OK: ${checks} comprobaciones Partner: 8 idiomas, 2 temas, 6 países, búsqueda, filtros, teclado, selección de nivel y enlaces. WebGL se verifica en navegador.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
