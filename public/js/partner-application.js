(() => {
  "use strict";
  const form = document.querySelector("#partner-form");
  if (!form) return;
  const panels = [...form.querySelectorAll("[data-panel]")];
  const buttons = [...document.querySelectorAll("[data-go]")];
  const field = (name) => form.querySelector(`[name="${name}"]`);
  const t = (n) => window.TUPLUS_I18N?.t("application." + n) || "";
  const back = document.querySelector("#pa-back"),
    next = document.querySelector("#pa-next"),
    finish = document.querySelector("#pa-finish"),
    error = document.querySelector("#pa-error");
  let step = 0,
    furthest = 0;
  function conditional() {
    [
      ["profile", "company", "company", ".pa-company"],
      ["country", "other", "otherCountry", ".pa-other"],
    ].forEach(([name, value, target, selector]) => {
      const show = field(name).value === value;
      form.querySelector(selector).hidden = !show;
      field(target).disabled = !show;
    });
  }
  function valid(index) {
    const controls = [
      ...panels[index].querySelectorAll("input,select,textarea"),
    ].filter((el) => !el.disabled);
    let first;
    controls.forEach((el) => {
      el.setCustomValidity("");
      if (el.required && el.type !== "checkbox" && !el.value.trim())
        el.setCustomValidity(t(56));
    });
    if (
      index === 1 &&
      !controls.some((el) => el.name === "solutions" && el.checked)
    )
      controls.find((el) => el.name === "solutions").setCustomValidity(t(55));
    if (index === 1 && !window.TUPLUS_TERRITORY.canApply(field('country').value, field('city').value)) {
      const state = window.TUPLUS_TERRITORY.resolve(field('country').value, field('city').value);
      field('city').setCustomValidity(window.TUPLUS_I18N.t('territory.status.' + state + 'Copy'));
    }
    controls.forEach((el) => {
      const ok = el.checkValidity();
      el.setAttribute("aria-invalid", String(!ok));
      if (!ok && !first) first = el;
    });
    error.hidden = !first;
    if (first) {
      first.focus();
      first.reportValidity();
      return false;
    }
    return true;
  }
  function review() {
    const root = document.querySelector("#pa-review");
    root.replaceChildren();
    panels.slice(0, 3).forEach((panel, i) => {
      const section = document.createElement("section");
      section.className = "pa-review-section";
      const header = document.createElement("header"),
        h = document.createElement("h3"),
        edit = document.createElement("button"),
        dl = document.createElement("dl");
      window.TUPLUS_I18N.setText(h, 'application.' + (i + 2));
      edit.type = "button";
      window.TUPLUS_I18N.setText(edit, 'application.45');
      edit.addEventListener("click", () => show(i));
      header.append(h, edit);
      section.append(header, dl);
      const seen = new Set();
      panel.querySelectorAll("input,select,textarea").forEach((el) => {
        if (el.disabled || seen.has(el.name)) return;
        seen.add(el.name);
        const div = document.createElement("div"),
          dt = document.createElement("dt"),
          dd = document.createElement("dd");
        const label = el.closest("label");
        window.TUPLUS_I18N.setText(dt, el.name === 'solutions'
          ? 'application.20'
          : label.querySelector('[data-i18n]').getAttribute('data-i18n'));
        dd.setAttribute("translate", "no");
        dd.textContent =
          el.name === "solutions"
            ? [...panel.querySelectorAll('[name="solutions"]:checked')]
                .map((c) => t(Number(c.value)))
                .join(", ")
            : el.tagName === "SELECT"
              ? el.selectedOptions[0]?.textContent
              : el.value;
        if (!dd.textContent) dd.textContent = t(46);
        div.append(dt, dd);
        dl.append(div);
      });
      root.append(section);
    });
  }
  function show(index, focus = true) {
    step = index;
    furthest = Math.max(furthest, index);
    conditional();
    panels.forEach((p, i) => (p.hidden = i !== step));
    buttons.forEach((b, i) => {
      b.disabled = i > furthest;
      if (i === step) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    back.hidden = step === 0;
    next.hidden = step === 3;
    finish.hidden = step !== 3;
    document.querySelector("#pa-progress").value = step + 1;
    document.querySelector("#pa-count").textContent = `0${step + 1} / 04`;
    error.hidden = true;
    if (step === 3) review();
    if (focus) panels[step].querySelector("h2").focus();
  }
  next.addEventListener("click", () => {
    if (valid(step)) show(step + 1);
  });
  back.addEventListener("click", () => show(step - 1));
  buttons.forEach((b, i) =>
    b.addEventListener("click", () => {
      if (i <= step || valid(step)) show(i);
    }),
  );
  form.addEventListener("change", () => {
    conditional();
    document.querySelector("#pa-result").hidden = true;
  });
  form.addEventListener("input", (e) => {
    e.target.setCustomValidity?.("");
    e.target.removeAttribute("aria-invalid");
    document.querySelector("#pa-result").hidden = true;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (step < 3) {
      if (valid(step)) show(step + 1);
      return;
    }
    for (let i = 0; i < 4; i++) {
      show(i, false);
      if (!valid(i)) {
        panels[i].querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
    }
    review();
    document.querySelector("#pa-result").hidden = false;
  });
  function countryLabels() {
    const names = new Intl.DisplayNames([window.TUPLUS_I18N?.locale || "es"], {type: "region"});
    field("country").querySelectorAll('option[translate="no"]').forEach(option => { option.textContent = names.of(option.value); });
  }
  document.addEventListener("tuplus:language-change", () => {
    countryLabels();
    // Rebuild custom validation messages in the selected language on the next check.
    form.querySelectorAll('input,select,textarea').forEach(el => el.setCustomValidity(''));
    if (step === 3) review();
  });
  countryLabels();
  const territory = new URLSearchParams(location.search);
  const incomingCountry = territory.get('country');
  if (['PE','PT','ES','JP','US','DE','other'].includes(incomingCountry)) {
    field('country').value = incomingCountry;
    for (const name of ['city','region','otherCountry']) {
      field(name).value = (territory.get(name) || '').slice(0,100);
    }
  }
  show(0, false);
})();
