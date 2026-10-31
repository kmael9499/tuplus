/* Globo esférico con WebGL nativo: sin librerías, APIs remotas ni texturas fotográficas.
   Una textura compartida; máximo 24 fps, DPR 1.25 y render solo en vistas visibles. */
(() => {
  "use strict";
  const countries = window.TUPLUS_PARTNER_COUNTRIES;
  const roots = [...document.querySelectorAll("[data-globe]")];
  if (!countries || !roots.length) return;
  const DEG = Math.PI / 180;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D earth; uniform float yaw; uniform float tilt; uniform float dark;
    void main(){
      vec2 p=(uv*2.-1.)/.85; float rr=dot(p,p);
      if(rr>1.){float halo=pow(max(0.,1.-(sqrt(rr)-1.)/.13),3.)*mix(.19,.13,dark);gl_FragColor=vec4(vec3(.28,.43,.49)*halo,halo);return;}
      vec3 n=vec3(p,sqrt(1.-rr));
      float ct=cos(tilt),st=sin(tilt),cy=cos(yaw),sy=sin(yaw);
      vec3 a=vec3(n.x,ct*n.y+st*n.z,-st*n.y+ct*n.z);
      vec3 w=vec3(cy*a.x+sy*a.z,a.y,-sy*a.x+cy*a.z);
      float lon=atan(w.x,w.z), lat=asin(clamp(w.y,-1.,1.));
      float mask=texture2D(earth,vec2(fract(lon/6.2831853+.5),.5-lat/3.14159265)).r;
      float land=smoothstep(.1,.8,mask);
      vec3 ocean=mix(vec3(.055,.16,.23),vec3(.025,.085,.125),dark);
      vec3 continent=mix(vec3(.72,.64,.43),vec3(.63,.55,.36),dark);
      float diffuse=.28+.83*max(0.,dot(n,normalize(vec3(-.5,.65,1.))));
      vec3 color=mix(ocean,continent,land)*diffuse;
      float border=step(.1,mask)*(1.-smoothstep(.55,.9,mask));color*=1.-border*.32;
      float grid=max(1.-smoothstep(.008,.025,abs(sin(lon*6.))),1.-smoothstep(.008,.025,abs(sin(lat*6.))));
      color+=grid*.018*(1.-land);
      float sheen=pow(max(0.,dot(n,normalize(vec3(-.35,.5,1.)))),22.)*.12*(1.-land);
      color+=vec3(.55,.73,.77)*sheen;
      color+=vec3(.25,.46,.55)*pow(1.-n.z,3.)*.28;
      gl_FragColor=vec4(color,1.);
    }`;
  let imagePromise;
  function textureImage() {
    if (!imagePromise)
      imagePromise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = "imagenes/partner/earth-mask.svg";
      });
    return imagePromise;
  }
  function shader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error("Globe shader unavailable");
    return s;
  }
  function renderer(canvas, image) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "low-power",
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL unavailable");
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Globe program unavailable");
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, "earth"), 0);
    const yaw = gl.getUniformLocation(program, "yaw"),
      tilt = gl.getUniformLocation(program, "tilt"),
      dark = gl.getUniformLocation(program, "dark");
    return (longitude, latitude, isDark, size) => {
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        gl.viewport(0, 0, size, size);
      }
      gl.uniform1f(yaw, longitude);
      gl.uniform1f(tilt, latitude);
      gl.uniform1f(dark, isDark ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  }
  const translate = (node, key) => window.TUPLUS_I18N?.setText(node, key);
  let selected = "PE",
    filterIds = new Set(Object.keys(countries)),
    frame = 0,
    lastTime = 0;
  const states = roots.map((root) => {
    const stage = root.querySelector(".pp-globe-stage");
    const leaders = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    leaders.setAttribute("class", "pp-globe-leaders");
    leaders.setAttribute("aria-hidden", "true");
    stage.append(leaders);
    const pins = [...root.querySelectorAll("[data-globe-country]")].map(
      (button) => {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        leaders.append(line);
        button.addEventListener("click", () =>
          document.dispatchEvent(
            new CustomEvent("tuplus:country-select", {
              detail: { id: button.dataset.globeCountry },
            }),
          ),
        );
        return { button, line, id: button.dataset.globeCountry };
      },
    );
    const state = {
      root,
      stage,
      pins,
      leaders,
      canvas: root.querySelector("canvas"),
      draw: null,
      loading: false,
      failed: false,
      visible: false,
      dirty: true,
      width: 400,
      yaw: -40 * DEG,
      tilt: 15 * DEG,
      target: null,
      paused: motion.matches,
      hold: 0,
      drag: null,
    };
    pins.forEach(({ button }) =>
      button.querySelector("img").addEventListener("load", () => {
        state.dirty = true;
        schedule();
      }),
    );
    const toggle = root.querySelector("[data-globe-toggle]");
    toggle.addEventListener("click", () => {
      state.paused = !state.paused;
      state.hold = 0;
      translate(
        toggle.querySelector("[data-i18n]"),
        state.paused ? "partner.play" : "partner.pause",
      );
      state.dirty = true;
      schedule();
    });
    root.querySelector("[data-globe-reset]").addEventListener("click", () => {
      state.target = { yaw: -40 * DEG, tilt: 15 * DEG };
      state.hold = performance.now() + 6000;
      state.dirty = true;
      schedule();
    });
    stage.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      state.drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
      state.target = null;
      stage.setPointerCapture(event.pointerId);
      state.hold = Infinity;
    });
    stage.addEventListener("pointermove", (event) => {
      if (!state.drag) return;
      state.yaw -= (event.clientX - state.drag.x) * 0.007;
      state.tilt = Math.max(
        -1.15,
        Math.min(1.15, state.tilt + (event.clientY - state.drag.y) * 0.005),
      );
      state.drag.x = event.clientX;
      state.drag.y = event.clientY;
      state.dirty = true;
      schedule();
    });
    const release = () => {
      state.drag = null;
      state.hold = performance.now() + 6000;
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("lostpointercapture", release);
    stage.addEventListener("keydown", (event) => {
      if (event.target !== stage) return;
      if (event.key === "ArrowLeft") state.yaw -= 15 * DEG;
      else if (event.key === "ArrowRight") state.yaw += 15 * DEG;
      else if (event.key === "ArrowUp")
        state.tilt = Math.min(1.15, state.tilt + 10 * DEG);
      else if (event.key === "ArrowDown")
        state.tilt = Math.max(-1.15, state.tilt - 10 * DEG);
      else if (event.key === "Home") {
        state.yaw = -40 * DEG;
        state.tilt = 15 * DEG;
      } else return;
      event.preventDefault();
      state.target = null;
      state.hold = performance.now() + 6000;
      state.dirty = true;
      schedule();
    });
    state.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      fallback(state);
    });
    new ResizeObserver((entries) => {
      state.width = entries[0].contentRect.width;
      state.dirty = true;
      schedule();
    }).observe(stage);
    return state;
  });
  function fallback(state) {
    state.failed = true;
    state.draw = null;
    state.root.dataset.ready = "false";
    state.canvas.hidden = true;
    state.pins.forEach(({ button, line }) => {
      button.hidden = true;
      line.style.display = "none";
    });
    state.root.querySelector(".pp-globe-fallback").hidden = false;
    state.root
      .querySelectorAll("[data-globe-toggle],[data-globe-reset]")
      .forEach((button) => (button.hidden = true));
  }
  async function init(state) {
    if (state.loading || state.failed || state.draw) return;
    state.loading = true;
    try {
      const image = await textureImage();
      state.draw = renderer(state.canvas, image);
      state.root.dataset.ready = "true";
      state.root
        .querySelectorAll("[data-globe-toggle],[data-globe-reset]")
        .forEach((button) => (button.hidden = false));
      translate(
        state.root.querySelector("[data-globe-toggle] [data-i18n]"),
        state.paused ? "partner.play" : "partner.pause",
      );
      state.dirty = true;
      schedule();
    } catch {
      fallback(state);
    }
  }
  function placePins(state) {
    const used = [];
    const w = state.width;
    state.leaders.setAttribute("viewBox", `0 0 ${w} ${w}`);
    const points = state.pins
      .map((pin) => {
        const c = countries[pin.id],
          lat = c.lat * DEG,
          d = c.lon * DEG - state.yaw;
        const x = Math.cos(lat) * Math.sin(d),
          y =
            Math.cos(state.tilt) * Math.sin(lat) -
            Math.sin(state.tilt) * Math.cos(lat) * Math.cos(d),
          z =
            Math.sin(state.tilt) * Math.sin(lat) +
            Math.cos(state.tilt) * Math.cos(lat) * Math.cos(d);
        return {
          ...pin,
          x: w * (0.5 + 0.425 * x),
          y: w * (0.5 - 0.425 * y),
          z,
        };
      })
      .sort((a, b) => (b.id === selected) - (a.id === selected) || b.z - a.z);
    points.forEach(({ button, line, id, x, y, z }) => {
      const visible =
        button.querySelector("img").naturalWidth > 0 &&
        z > 0.12 &&
        (state.root.dataset.globe === "hero" || filterIds.has(id));
      button.hidden = !visible;
      line.style.display = visible ? "" : "none";
      if (!visible) return;
      let px = x,
        py = y;
      for (
        let attempt = 0;
        attempt < 12 && used.some((p) => Math.hypot(p.x - px, p.y - py) < 34);
        attempt++
      ) {
        const angle = (attempt + 1) * 2.4;
        px = x + Math.cos(angle) * (20 + attempt * 3);
        py = y + Math.sin(angle) * (20 + attempt * 3);
      }
      used.push({ x: px, y: py });
      button.style.left = px + "px";
      button.style.top = py + "px";
      button.style.zIndex = String(Math.round(z * 100));
      button.setAttribute("aria-pressed", String(id === selected));
      line.setAttribute("x1", x);
      line.setAttribute("y1", y);
      line.setAttribute("x2", px);
      line.setAttribute("y2", py);
      line.style.opacity = Math.hypot(px - x, py - y) > 5 ? ".65" : "0";
    });
  }
  function schedule() {
    if (!frame && !document.hidden && states.some((s) => s.visible))
      frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    const delta = Math.min(80, lastTime ? now - lastTime : 42);
    if (lastTime && now - lastTime < 1000 / 24) {
      schedule();
      return;
    }
    lastTime = now;
    let continuing = false;
    for (const state of states) {
      if (!state.visible) continue;
      if (!state.draw) {
        init(state);
        continue;
      }
      if (state.target) {
        const diff = Math.atan2(
          Math.sin(state.target.yaw - state.yaw),
          Math.cos(state.target.yaw - state.yaw),
        );
        const factor = motion.matches ? 1 : 0.11;
        state.yaw += diff * factor;
        state.tilt += (state.target.tilt - state.tilt) * factor;
        if (
          Math.abs(diff) < 0.002 &&
          Math.abs(state.target.tilt - state.tilt) < 0.002
        )
          state.target = null;
        state.dirty = true;
      } else if (!state.paused && !state.drag && now > state.hold) {
        state.yaw += delta * 0.000035;
        state.dirty = true;
      }
      if (state.dirty) {
        state.draw(
          state.yaw,
          state.tilt,
          document.documentElement.dataset.theme === "dark",
          Math.max(
            1,
            Math.round(
              Math.min(
                640,
                state.width * Math.min(devicePixelRatio || 1, 1.25),
              ),
            ),
          ),
        );
        placePins(state);
        state.dirty = false;
      }
      if (!state.paused || state.target) continuing = true;
    }
    if (continuing) schedule();
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const state = states.find((s) => s.root === entry.target);
        state.visible = entry.isIntersecting;
        state.root.dataset.visible = String(state.visible);
        if (state.visible) {
          state.dirty = true;
          init(state);
        }
      });
      lastTime = 0;
      schedule();
    },
    { threshold: 0.05 },
  );
  states.forEach((state) => observer.observe(state.root));
  new MutationObserver(() => {
    states.forEach((s) => (s.dirty = true));
    schedule();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      lastTime = 0;
      schedule();
    }
  });
  motion.addEventListener("change", (event) => {
    states.forEach((s) => {
      s.paused = event.matches;
      s.dirty = true;
      translate(
        s.root.querySelector("[data-globe-toggle] [data-i18n]"),
        s.paused ? "partner.play" : "partner.pause",
      );
    });
    schedule();
  });
  window.TUPLUS_GLOBE = {
    focusCountry(id) {
      const c = countries[id];
      if (!c) return;
      selected = id;
      states.forEach((s) => {
        s.target = { yaw: c.lon * DEG, tilt: c.lat * DEG };
        s.hold = performance.now() + 8000;
        s.dirty = true;
      });
      schedule();
    },
    filter(ids) {
      filterIds = new Set(ids);
      states.forEach((s) => (s.dirty = true));
      schedule();
    },
  };
})();
