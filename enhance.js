/* ============================================================
   enhance.js — שכבת UI/UX נוספת למדריך הטיול (מבודד, frx- prefix)
   נטען אחרי הסקריפט הראשי ומשתמש בנתונים/פונקציות הקיימים:
   REG, COORDS, PROVENCE, NICE, GALLERY, CAT, pic, map, haversine,
   driveEst, slugOf, openDetail, showGal, initMap, applyFilter,
   markersByGroup, MAPOBJ, GAL, GIDX, detail.
   כל מה שכאן ניתן להסרה ע"י מחיקת שורת ה-<script> היחידה ב-index.html.
   ============================================================ */
(function () {
  "use strict";
  if (typeof REG === "undefined" || typeof PROVENCE === "undefined") return; // אם הסקריפט הראשי לא נטען
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stopOf = (c) => REG[c && c.dataset && c.dataset.id];

  /* ---------- CSS מוזרק ---------- */
  const CSS = `
  .frx-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0 6px}
  .frx-search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:var(--surface);
     border:1px solid var(--line);border-radius:13px;padding:0 12px;transition:.18s var(--ease)}
  .frx-search:focus-within{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent)}
  .frx-search span{font-size:15px;opacity:.7}
  .frx-search input{flex:1;border:0;outline:0;background:none;font-family:inherit;font-size:15px;
     color:var(--ink);padding:12px 0;min-width:0}
  .frx-clear{border:0;background:var(--line-soft);color:var(--muted);width:26px;height:26px;border-radius:50%;
     cursor:pointer;font-size:13px;line-height:1;flex:0 0 auto}
  .frx-favtog{border:1px solid var(--line);background:var(--surface);border-radius:999px;cursor:pointer;
     font-family:inherit;font-size:13.5px;font-weight:700;color:var(--muted);padding:11px 16px;transition:.18s var(--ease);white-space:nowrap}
  .frx-favtog:hover{border-color:#F0B6BC}
  .frx-favtog[aria-pressed="true"]{background:#FCEBEC;border-color:#F0B6BC;color:#D6354A}
  .frx-favn{font-weight:800}
  .frx-empty{display:none;color:var(--muted);font-size:14.5px;padding:30px 6px;text-align:center}
  .frx-empty.show{display:block}

  .frx-drive{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-top:9px;
     font-size:12.5px;font-weight:700;color:var(--accent);
     background:color-mix(in srgb,var(--accent) 9%,var(--surface));
     border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));border-radius:8px;padding:5px 10px}

  .frx-chip{color:#fff!important;font-weight:700}
  .frx-swim{background:#1E9AA8!important}
  .frx-view{background:#3F6CB4!important}

  /* hero לכל אזור */
  .frx-hero{position:relative;overflow:hidden;border-radius:var(--r);padding:30px 26px;min-height:188px;
     display:flex;flex-direction:column;justify-content:flex-end;margin-bottom:18px;isolation:isolate}
  .frx-hero::before{content:"";position:absolute;inset:0;z-index:-2;background-image:var(--frx-img);
     background-size:cover;background-position:center;transform:scale(1.02)}
  .frx-hero::after{content:"";position:absolute;inset:0;z-index:-1;
     background:linear-gradient(180deg,rgba(15,18,22,.15) 0%,rgba(15,18,22,.78) 100%)}
  .frx-hero h2{color:#fff;font-size:clamp(26px,4.4vw,36px);text-shadow:0 2px 14px rgba(0,0,0,.45)}
  .frx-hero p{color:rgba(255,255,255,.92);max-width:64ch;text-shadow:0 1px 10px rgba(0,0,0,.5)}

  /* day filter במפה */
  #frx-daybar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:4px 0 16px}
  .frx-daylabel{font-size:12.5px;font-weight:700;color:var(--muted);margin-left:4px}
  .frx-day{border:1px solid var(--line);background:var(--surface);border-radius:999px;cursor:pointer;
     font-family:inherit;font-size:13px;font-weight:700;color:var(--muted);padding:7px 13px;transition:.15s var(--ease)}
  .frx-day:hover{border-color:color-mix(in srgb,#2E7D52 45%,var(--line))}
  .frx-day-on{background:#2E7D52;border-color:#2E7D52;color:#fff}
  .frx-num{width:30px;height:30px;border-radius:50%;background:#2E7D52;color:#fff;border:2px solid #fff;
     box-shadow:0 3px 10px -2px rgba(0,0,0,.5);display:grid;place-items:center;font-size:14px;font-weight:800}

  /* gallery counter בפרטים */
  #frx-count{position:absolute;top:14px;right:14px;z-index:2;background:rgba(0,0,0,.55);color:#fff;
     font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:999px;direction:ltr;backdrop-filter:blur(3px)}
  .frx-fly{cursor:pointer}

  /* כניסת כרטיסים */
  html.frx-motion .card{opacity:0;transform:translateY(16px);
     transition:opacity .55s var(--ease),transform .55s var(--ease);transition-delay:var(--frx-d,0ms)}
  html.frx-motion .card.frx-in{opacity:1;transform:none}
  html.frx-motion .card:hover{transition-delay:0ms}
  html.frx-motion .card.frx-in:hover{transform:translateY(-3px)}
  @media (prefers-reduced-motion:reduce){html.frx-motion .card{opacity:1!important;transform:none!important}}
  `;
  document.head.insertAdjacentHTML("beforeend", `<style id="frx-style">${CSS}</style>`);

  /* ============================================================
     F2 · תג "זמן מהבסיס" + F4 · צ'יפים שחייה/תצפית
     ============================================================ */
  function txtOf(card) {
    const s = stopOf(card) || {};
    return [s.name, s.fr, s.desc, (s.tags || []).join(" "), CAT[s.cat] || "", s.near || ""]
      .join(" ").toLowerCase();
  }
  function addDriveAndChips() {
    const drive = (sel, base) => $$(sel).forEach((c) => {
      const s = stopOf(c); if (!s) return;
      const body = c.querySelector(".body"); if (!body) return;
      // F4 chips
      const tags = body.querySelector(".tags");
      if (tags && !tags.querySelector(".frx-chip")) {
        const t = (s.tags || []).join(" "); const chips = [];
        if (s.cat === "beach" || s.cat === "sea" || /שחי|רחצה/.test(t)) chips.push('<span class="tg frx-chip frx-swim">🏊 שחייה</span>');
        if (s.cat === "view" || /תצפ/.test(t)) chips.push('<span class="tg frx-chip frx-view">👁️ תצפית</span>');
        if (chips.length) tags.insertAdjacentHTML("afterbegin", chips.join(""));
      }
      // F2 drive time
      if (base && s.cat !== "logistics" && !body.querySelector(".frx-drive")) {
        const ll = COORDS[slugOf(s)];
        if (ll) {
          const km = haversine(base, ll);
          if (km >= 1.2) {
            const d = document.createElement("div");
            d.className = "frx-drive";
            d.innerHTML = `🚗 ~${driveEst(km)} מהבסיס`;
            const name = body.querySelector(".name");
            body.insertBefore(d, name ? name.nextSibling : body.firstChild);
          }
        }
      }
    });
    drive("#prov-days .card", COORDS.villa);
    drive("#nice-grid .card", COORDS.nice);
    drive("#drone-grid .card", null); // צ'יפים בלבד, בלי זמן נסיעה
    drive("#road-grid .card", null);  // עצירות הדרך — צ'יפים בלבד
  }

  /* ============================================================
     F1 · חיפוש + F3 · מסנן מועדפים  (נִיס ופרובאנס)
     ============================================================ */
  let applyNice = () => {}, applyProv = () => {};
  function updFavCounts() {
    const n = $(".frx-favn[data-v='nice']"), p = $(".frx-favn[data-v='prov']");
    if (n) n.textContent = $$("#nice-grid .fav[aria-pressed='true']").length;
    if (p) p.textContent = $$("#prov-days .fav[aria-pressed='true']").length;
  }
  function buildBar(viewId, vkey, placeholder, onApply) {
    const view = document.getElementById(viewId); if (!view) return null;
    const intro = view.querySelector(".intro"); if (!intro) return null;
    const bar = document.createElement("div");
    bar.className = "frx-bar";
    bar.innerHTML =
      `<label class="frx-search"><span>🔎</span>` +
      `<input type="search" placeholder="${placeholder}" aria-label="חיפוש"><button type="button" class="frx-clear" aria-label="ניקוי" hidden>✕</button></label>` +
      `<button type="button" class="frx-favtog" aria-pressed="false">♥ המועדפים <span class="frx-favn" data-v="${vkey}">0</span></button>`;
    intro.insertAdjacentElement("afterend", bar);
    const empty = document.createElement("div");
    empty.className = "frx-empty";
    empty.textContent = "לא נמצאו תוצאות — נסו מילה אחרת או נקו את החיפוש.";
    bar.insertAdjacentElement("afterend", empty);
    const input = bar.querySelector("input"),
      clear = bar.querySelector(".frx-clear"),
      fav = bar.querySelector(".frx-favtog");
    input.addEventListener("input", () => { clear.hidden = !input.value; onApply(); });
    clear.addEventListener("click", () => { input.value = ""; clear.hidden = true; onApply(); input.focus(); });
    fav.addEventListener("click", () => { fav.setAttribute("aria-pressed", fav.getAttribute("aria-pressed") !== "true"); onApply(); });
    return { input, fav, empty };
  }
  function setupFilters() {
    // ניס
    const n = buildBar("view-nice", "nice", "חיפוש מקום, חוף, מסעדה…", () => applyNice());
    if (n) {
      applyNice = function () {
        const term = n.input.value.trim().toLowerCase();
        const favOnly = n.fav.getAttribute("aria-pressed") === "true";
        const pressed = $("#nice-filters button[aria-pressed='true']");
        const cat = pressed ? pressed.dataset.f : "all";
        let vis = 0;
        $$("#nice-grid .card").forEach((c) => {
          const ok = (cat === "all" || c.dataset.cat === cat)
            && (!term || txtOf(c).includes(term))
            && (!favOnly || c.querySelector(".fav[aria-pressed='true']"));
          c.style.display = ok ? "" : "none"; if (ok) vis++;
        });
        n.empty.classList.toggle("show", vis === 0);
      };
      // לאפשר לכפתורי הקטגוריה הקיימים לעבוד יחד עם החיפוש
      $$("#nice-filters button").forEach((b) => b.addEventListener("click", () => applyNice()));
    }
    // פרובאנס
    const p = buildBar("view-provence", "prov", "חיפוש תחנה בלו\"ז…", () => applyProv());
    if (p) {
      applyProv = function () {
        const term = p.input.value.trim().toLowerCase();
        const favOnly = p.fav.getAttribute("aria-pressed") === "true";
        let total = 0;
        $$("#prov-days .day").forEach((day) => {
          let vis = 0;
          day.querySelectorAll(".card").forEach((c) => {
            const ok = (!term || txtOf(c).includes(term))
              && (!favOnly || c.querySelector(".fav[aria-pressed='true']"));
            c.style.display = ok ? "" : "none"; if (ok) { vis++; total++; }
          });
          day.style.display = vis ? "" : "none";
        });
        p.empty.classList.toggle("show", total === 0);
      };
    }
    // ריענון ספירת מועדפים + סינון מחדש כשמסמנים לב
    document.addEventListener("click", (e) => {
      if (e.target.closest(".fav")) setTimeout(() => { updFavCounts(); applyNice(); applyProv(); }, 0);
    });
    updFavCounts();
  }

  /* ============================================================
     F7 · כותרת hero לכל אזור
     ============================================================ */
  function setupHeroes() {
    const m = { "view-provence": "provence/gordes", "view-nice": "riviera/villefranche" };
    Object.entries(m).forEach(([id, img]) => {
      const v = document.getElementById(id); if (!v) return;
      const intro = v.querySelector(".intro"); if (!intro || intro.classList.contains("frx-hero")) return;
      intro.classList.add("frx-hero");
      intro.style.setProperty("--frx-img", `url(${pic(img)})`);
    });
  }

  /* ============================================================
     F8 · כניסת כרטיסים מדורגת + גלריה (swipe/מקלדת/מונה)
     ============================================================ */
  function setupMotion() {
    if (REDUCED) return;
    document.documentElement.classList.add("frx-motion");
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("frx-in"); io.unobserve(en.target); }
    }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    $$(".grid").forEach((g) => [...g.querySelectorAll(".card")].forEach((c, i) => {
      c.style.setProperty("--frx-d", Math.min(i, 8) * 45 + "ms"); io.observe(c);
    }));
  }
  function setupGallery() {
    const dgal = $(".dgal"); if (!dgal) return;
    // מונה תמונות
    if (typeof showGal === "function") {
      const _showGal = showGal;
      showGal = function () {
        _showGal();
        let c = document.getElementById("frx-count");
        if (!c) { c = document.createElement("div"); c.id = "frx-count"; dgal.appendChild(c); }
        const multi = typeof GAL !== "undefined" && GAL && GAL.length > 1;
        c.style.display = multi ? "block" : "none";
        if (multi) c.textContent = (GIDX + 1) + "/" + GAL.length;
      };
    }
    // swipe בנייד
    let tx = 0;
    dgal.addEventListener("touchstart", (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
    dgal.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) < 40 || !GAL || GAL.length < 2) return;
      GIDX = dx < 0 ? (GIDX + 1) % GAL.length : (GIDX - 1 + GAL.length) % GAL.length;
      showGal();
    }, { passive: true });
    // מקלדת
    addEventListener("keydown", (e) => {
      if (!detail.classList.contains("open") || !GAL || GAL.length < 2) return;
      if (e.key === "ArrowLeft") { GIDX = (GIDX + 1) % GAL.length; showGal(); }
      if (e.key === "ArrowRight") { GIDX = (GIDX - 1 + GAL.length) % GAL.length; showGal(); }
    });
  }

  /* ============================================================
     F6 · כפתור "הצג במפה שלנו" בתצוגת הפרטים
     ============================================================ */
  function setupFlyTo() {
    if (typeof openDetail !== "function") return;
    const _openDetail = openDetail;
    openDetail = function (s) {
      _openDetail(s);
      const foot = $("#dbody .foot");
      const ll = s && COORDS[slugOf(s)];
      if (!foot || !ll || foot.querySelector(".frx-fly")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "infolink frx-fly"; b.innerHTML = "🗺️ הצג במפה שלנו";
      b.onclick = () => {
        detail.classList.remove("open");
        const mapTab = $('.tab[data-tab="map"]'); if (mapTab) mapTab.click();
        setTimeout(() => { if (typeof MAPOBJ !== "undefined" && MAPOBJ) { MAPOBJ.flyTo({ center: [ll[1], ll[0]], zoom: 13, duration: 1200 }); } }, 450);
      };
      foot.appendChild(b);
    };
  }

  /* ============================================================
     F5 · סינון יום + קו מסלול על המפה
     ============================================================ */
  const DAY_LINE = "frx-day-line";
  let dayMarkers = [];
  function clearDay() {
    dayMarkers.forEach((m) => m.remove()); dayMarkers = [];
    if (typeof MAPOBJ !== "undefined" && MAPOBJ && MAPOBJ.getLayer && MAPOBJ.getLayer(DAY_LINE)) {
      MAPOBJ.removeLayer(DAY_LINE); MAPOBJ.removeSource(DAY_LINE);
    }
  }
  function drawDayLine(coords) {
    if (!MAPOBJ.isStyleLoaded()) { MAPOBJ.once("load", () => drawDayLine(coords)); return; }
    if (MAPOBJ.getLayer(DAY_LINE)) { MAPOBJ.removeLayer(DAY_LINE); MAPOBJ.removeSource(DAY_LINE); }
    MAPOBJ.addSource(DAY_LINE, { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } } });
    MAPOBJ.addLayer({ id: DAY_LINE, type: "line", source: DAY_LINE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#2E7D52", "line-width": 3, "line-opacity": .85, "line-dasharray": [1.5, 1.8] } });
  }
  function selectDay(i) {
    clearDay();
    if (i === null) { if (typeof applyFilter === "function") applyFilter(); return; }
    Object.values(markersByGroup).forEach((arr) => arr.forEach((m) => { m.getElement().style.display = "none"; }));
    const pts = PROVENCE[i].stops.map((s) => ({ s, ll: COORDS[slugOf(s)] })).filter((o) => o.ll);
    const line = [], bounds = new maplibregl.LngLatBounds();
    pts.forEach((o, n) => {
      const el = document.createElement("div");
      el.className = "frx-num"; el.textContent = n + 1; el.title = `${n + 1}. ${o.s.name}`;
      const lnglat = [o.ll[1], o.ll[0]];
      const m = new maplibregl.Marker({ element: el }).setLngLat(lnglat).addTo(MAPOBJ);
      el.addEventListener("click", (ev) => { ev.stopPropagation(); openDetail(o.s); });
      dayMarkers.push(m); line.push(lnglat); bounds.extend(lnglat);
    });
    if (line.length > 1) drawDayLine(line);
    if (line.length) MAPOBJ.fitBounds(bounds, { padding: 70, maxZoom: 13 });
  }
  function setupDayBar() {
    if (document.getElementById("frx-daybar")) return;
    const legend = document.getElementById("map-legend"); if (!legend) return;
    const bar = document.createElement("div"); bar.id = "frx-daybar";
    bar.innerHTML = `<span class="frx-daylabel">מסלול לפי יום (פרובאנס):</span>` +
      `<button class="frx-day frx-day-on" data-d="all">הכול</button>` +
      PROVENCE.map((d, i) => `<button class="frx-day" data-d="${i}">${d.day}</button>`).join("");
    legend.insertAdjacentElement("afterend", bar);
    bar.querySelectorAll(".frx-day").forEach((b) => b.addEventListener("click", () => {
      bar.querySelectorAll(".frx-day").forEach((x) => x.classList.remove("frx-day-on"));
      b.classList.add("frx-day-on");
      selectDay(b.dataset.d === "all" ? null : +b.dataset.d);
    }));
  }
  function setupMap() {
    if (typeof initMap !== "function") return;
    const _initMap = initMap;
    initMap = function () { _initMap(); try { setupDayBar(); } catch (e) {} };
  }

  /* ============================================================
     מיזוג גלריות מסעדות — שילוב התמונות שלי + של חלונית העיצוב,
     כשהתמונה הראשית היא זו שתואמת הכי טוב את הטקסט (הלימה טקסט↔תמונה)
     ============================================================ */
  const GAL_HERO = {            // התמונה שלי הופכת לראשית (תואמת את הטקסט)
    "provence/g-oysterbar": "provence/g-oysterbar-x",   // "צדפות טריות" → מגש צדפות
    "provence/g-trinquette": "provence/g-trinquette-x", // "אווירה חמה ונוף" → טרסה בגורד
  };
  const GAL_APPEND = {          // התמונה שלי מתווספת בסוף (הראשית שלהם תואמת)
    "provence/g-camille": "provence/g-camille-x",        // hero = מנה; מוסיף פנים המקום
    "provence/g-cantine": "provence/g-cantine-x",        // hero = בורגר (תואם); מוסיף חזית
  };
  function setupGalleryMerge() {
    Object.entries(GAL_HERO).forEach(([k, hero]) => {
      const cur = (GALLERY[k] || [k]).filter((x) => x !== hero);
      GALLERY[k] = [hero, ...cur];
    });
    Object.entries(GAL_APPEND).forEach(([k, extra]) => {
      const cur = (GALLERY[k] || [k]).filter((x) => x !== extra);
      GALLERY[k] = [...cur, extra];
    });
    // עדכון מונה התמונות על הכרטיס ("📷 N תמונות")
    $$(".card").forEach((c) => {
      const s = stopOf(c); if (!s) return;
      const g = GALLERY[s.img], more = c.querySelector(".more");
      if (g && g.length > 1 && more) more.textContent = `📷 ${g.length} תמונות`;
    });
  }

  /* ============================================================
     עיצוב שורת הטאבים — אייקונים עקביים + שם קצר + מצב-פעיל צבעוני
     (בלי אימוג'י, בלי תווית-משנה; המידע עבר לתיאורי הטאבים)
     ============================================================ */
  const SVG = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const TABS = {
    provence: { l: "פרובאנס", i: SVG('<circle cx="12" cy="9" r="3"/><path d="M12 3.5V2M5.6 9H4M20 9h-1.6M7 4l-.9-.9M17 4l.9-.9"/><path d="M3 20c2-3 4.5-3 6.5 0M10 20c2-3.5 4.5-3.5 7 0"/>') },
    nice: { l: "ניס", i: SVG('<path d="M3 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 17.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>') },
    drone: { l: "רחפנים", i: SVG('<rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M6.6 7.4 9.5 10M17.4 7.4 14.5 10M6.6 16.6 9.5 14M17.4 16.6 14.5 14"/>') },
    map: { l: "מפה", i: SVG('<path d="M12 21c4.5-4.2 7-7.5 7-11a7 7 0 1 0-14 0c0 3.5 2.5 6.8 7 11z"/><circle cx="12" cy="10" r="2.3"/>') },
    road: { l: "בדרך", i: SVG('<path d="M3 13l1.6-4.3A2.5 2.5 0 0 1 7 7h10a2.5 2.5 0 0 1 2.4 1.7L21 13v4a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-1H6.2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="16.4" r="1.3"/><circle cx="16.5" cy="16.4" r="1.3"/><path d="M5 13h14"/>') },
  };
  function setupTabs() {
    const wrap = $(".tabs .wrap"); if (!wrap) return;
    if (!document.getElementById("frx-tabstyle")) {
      document.head.insertAdjacentHTML("beforeend", `<style id="frx-tabstyle">
        .tabs .wrap{gap:6px;align-items:center;padding-top:7px;padding-bottom:1px}
        .tabs .tab{display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:12px;
          color:var(--muted);font-weight:700;font-size:15.5px;transition:.18s var(--ease)}
        .tabs .tab .cnt{display:none}
        .tabs .tab svg{width:19px;height:19px;flex:0 0 auto;opacity:.92}
        .tabs .tab:hover{background:var(--line-soft);color:var(--ink)}
        .tabs .tab[aria-selected="true"]{color:var(--accent);
          background:color-mix(in srgb,var(--accent) 13%,transparent)}
        .tabs .tab[aria-selected="true"]::after{display:none}
        .frx-tabdiv{width:1px;height:20px;background:var(--line);margin:0 5px;flex:0 0 auto}
        @media(max-width:560px){
          .tabs .wrap{gap:2px}
          .tabs .tab{flex:1;flex-direction:column;gap:3px;padding:7px 3px;justify-content:center;text-align:center}
          .tabs .tab span{display:block;font-size:10.5px;font-weight:700;line-height:1.05;white-space:nowrap}
          .tabs .tab svg{width:20px;height:20px}
          .frx-tabdiv{display:none}}
      </style>`);
    }
    $$(".tabs .tab").forEach((t) => {
      const d = TABS[t.dataset.tab]; if (!d) return;
      t.innerHTML = d.i + `<span>${d.l}</span>`;
    });
    const drone = $('.tabs .tab[data-tab="drone"]');
    if (drone && !$(".frx-tabdiv")) {
      const div = document.createElement("span"); div.className = "frx-tabdiv";
      drone.parentNode.insertBefore(div, drone);
    }
  }

  /* ============================================================
     קואורדינטות חסרות — מסעדות + ברים שלא הופיעו על המפה
     (ה-slugs שלהן לא היו ב-COORDS אז נפלו מהמפה)
     ============================================================ */
  const ADD_COORDS = {
    "g-oysterbar": [43.2152, 5.5367],   // Le petit Oyster Bar · Cassis
    "g-camille": [43.7441, 4.7946],     // Camille Ô Baux · Les Baux
    "g-cantine": [43.8465, 6.2217],     // La Cantine · Moustiers
    "g-trinquette": [43.9109, 5.1994],  // La Trinquette · Gordes
    "g-clay": [43.6986, 7.2716],        // Clay · Nice
    "bars-nice": [43.6968, 7.2758],     // ברים · העיר העתיקה בניס
    // ערב מבוגרים בניס — רופטופים + מסעדות (נוספו)
    "g-seen": [43.6966, 7.2677], "g-moonbar": [43.6981, 7.2721],
    "g-meridien": [43.6953, 7.2658], "g-farago": [43.6939, 7.2532],
    "g-plongeoir": [43.6919, 7.2909], "g-peixes": [43.696, 7.271],
    "g-boudoir": [43.699, 7.2713], "g-cotemarais": [43.6974, 7.275],
    // בדרך מפרובאנס לניס — מקצה האסטרל / Corniche d'Or
    "r-dramont": [43.4162, 6.8555], "r-agay": [43.4336, 6.8667],
    "r-antheor": [43.4374, 6.8925], "r-caproux": [43.455, 6.9061],
    "r-aiguille": [43.5063, 6.9535], "r-cannes": [43.5514, 7.0173],
  };
  function setupMapCoords() {
    if (typeof COORDS === "undefined") return;
    Object.entries(ADD_COORDS).forEach(([k, v]) => { if (!COORDS[k]) COORDS[k] = v; });
  }

  /* ============================================================
     ערב מבוגרים בניס — רופטופ-ברים + מסעדות ערב (כרטיסים חדשים)
     נדחפים ל-NICE (למפה) ונטענים ל-#nice-grid (עם החיווט המלא)
     ============================================================ */
  const NEW_NICE = [
    { name: "SEEN by Olivier · רופטופ", fr: "Anantara Plaza · Nice", cat: "evening", rate: "★ 3.7", price: "€€€",
      tags: ["רופטופ", "נוף 360°", "קוקטיילים", "ערב מבוגרים"], q: "SEEN by Olivier Anantara Plaza Nice", img: "riviera/g-seen",
      desc: "בר-מסעדת גג בקומה 6 של מלון Anantara Plaza, עם נוף 360° אל הים, העיר העתיקה והגבעות. קוקטיילים מוקפדים, אווירה אלגנטית ו-DJ עם רדת הערב — מהיוקרתיים בניס.",
      near: "מעל כיכר מסנה — דקות מהעיר העתיקה ומהפרומנד.", note: "מבוקש לערב — כדאי להזמין, במיוחד לשקיעה." },
    { name: "Moon Bar · רופטופ", fr: "Aston La Scala · Nice", cat: "evening", rate: "★ 3.7", price: "€€",
      tags: ["רופטופ", "בריכה", "נוף 360°", "משתלם"], q: "Moon Bar Aston La Scala Nice", img: "riviera/g-moonbar",
      desc: "רופטופ עם בריכה ונוף 360° על העיר העתיקה, כיכר מסנה והים. אחד הנופים היפים בניס במחיר נוח יותר מהיוקרתיים — קוקטייל מול השקיעה והאורות.",
      near: "מעל הפרומנד דו פאיון, צמוד לעיר העתיקה.", note: "לשבת לקראת שקיעה לנוף הכי יפה." },
    { name: "La Terrasse du Méridien · רופטופ", fr: "Le Méridien · Nice", cat: "evening", rate: "★ 4.0", price: "€€€",
      tags: ["רופטופ", "שקיעה", "מול הים"], q: "Rooftop Le Meridien Nice", img: "riviera/g-meridien",
      desc: "הרופטופ המפורסם של מלון Le Méridien, פונה מערבה ישר אל הים מעל מפרץ המלאכים — מהשקיעות היפות בניס. טרסה אלגנטית לאפרטיף או ארוחת ערב מול האופק.",
      near: "על הפרומנד דז-אנגלה, מול הים.", note: "שמרו על שעת השקיעה — זה השיא." },
    { name: "Farago on the Roof · רופטופ", fr: "AC Marriott · Nice", cat: "evening", rate: "★ 4.2", price: "€€",
      tags: ["רופטופ", "קוקטיילים", "אווירה רגועה"], q: "Farago on the Roof Nice", img: "riviera/g-farago",
      desc: "רופטופ על גג ה-AC Marriott עם אווירה רגועה אך תוססת, תפריט קוקטיילים חזק ונוף שמשתרע מהפרומנד עד העיר העתיקה. נחמד לערב נינוח עם נוף.",
      near: "בקצה המערבי של הפרומנד, ליד שדרת ז'אן מדסן." },
    { name: "Le Plongeoir", fr: "Nice · על הסלע", cat: "evening", rate: "★ 4.3", price: "€€€",
      tags: ["על הים", "נוף", "רומנטי", "ערב מיוחד"], q: "Le Plongeoir Nice", img: "riviera/g-plongeoir",
      desc: "מהמסעדות המרשימות בניס — בנויה על צוק בולט אל הים, עם גלים מתנפצים מתחת ונוף פנורמי. ארוחת ערב לאור נרות ושקיעה, מטבח ים-תיכוני מוקפד. חוויה, לא רק ארוחה.",
      near: "מתחת לשמורת מון בורון, ממזרח לנמל ניס.", note: "דורש הזמנה מראש — מבוקש מאוד לערב." },
    { name: "Peixes", fr: "Nice · דגים", cat: "evening", rate: "★ 4.5", price: "€€",
      tags: ["דגים", "סביצ'ה", "טרנדי", "ערב"], q: "Peixes Nice", img: "riviera/g-peixes",
      desc: "מסעדת דגים ופירות ים טרנדית עם טוויסט דרום-אמריקאי — סביצ'ה, טארטרים ומנות טריות לשיתוף. אווירה תוססת ואופנתית ליד כיכר מסנה והים. מושלם לארבעה מבוגרים.",
      near: "בקצה המערבי של העיר העתיקה, צעדים מכיכר מסנה." },
    { name: "Le Boudoir", fr: "Nice · צרפתי", cat: "evening", rate: "★ 4.5", price: "€€€",
      tags: ["צרפתי", "טראפל", "אינטימי", "ערב יוקרתי"], q: "Le Boudoir restaurant Nice", img: "riviera/g-boudoir",
      desc: "מסעדה צרפתית מודרנית ומעודנת באווירה אינטימית לאור נרות — כמהין (טראפל), פואה גרא ומנות עונתיות מוקפדות. ערב שקט ויוקרתי יותר, לזוגות ולמבוגרים.",
      near: "בלב ניס, ליד שדרת ז'אן מדסן." },
    { name: "Côté Marais", fr: "Vieux Nice · ביסטרו", cat: "evening", rate: "★ 4.5", price: "€€",
      tags: ["ביסטרו", "צרפתי", "ים-תיכוני", "עיר עתיקה"], q: "Cote Marais Nice", img: "riviera/g-cotemarais",
      desc: "ביסטרו צרפתי-ים-תיכוני חמים בלב העיר העתיקה, מדורג גבוה — מנות טריות, יין טוב ושירות אדיב. בחירה בטוחה ואותנטית לארוחת ערב נינוחה ב-Vieux Nice.",
      near: "בסמטאות העיר העתיקה, ליד Cours Saleya." },
  ];
  function addNiceCards() {
    const grid = document.getElementById("nice-grid");
    if (!grid || typeof card !== "function" || grid.dataset.frxAdded) return;
    grid.dataset.frxAdded = "1";
    const store = JSON.parse(localStorage.getItem("fr2") || "{}");
    NEW_NICE.forEach((s) => { if (typeof NICE !== "undefined") NICE.push(s); grid.insertAdjacentHTML("beforeend", card(s)); });
    const added = $$("#nice-grid .card").slice(-NEW_NICE.length);
    const allFavs = $$(".fav");
    added.forEach((c) => {
      c.addEventListener("click", (e) => { if (e.target.closest(".fav,.maplink,.infolink")) return; openDetail(REG[c.dataset.id]); });
      const b = c.querySelector(".fav"); if (!b) return;
      const i = allFavs.indexOf(b);
      if (store[i]) { b.setAttribute("aria-pressed", "true"); b.textContent = "♥"; }
      b.onclick = () => {
        const v = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", v); b.textContent = v ? "♥" : "♡";
        const s2 = JSON.parse(localStorage.getItem("fr2") || "{}"); s2[i] = v; localStorage.setItem("fr2", JSON.stringify(s2));
      };
    });
  }

  /* ============================================================
     טאב "בדרך" — עצירות החוף בין פרובאנס לניס (Corniche d'Or / האסטרל)
     ============================================================ */
  const ROAD = [
    { name: "קאפ דרמון · Île d'Or", fr: "Le Dramont · Saint-Raphaël", cat: "view", rate: "★ 4.7", gem: true,
      tags: ["תצפית", "אי אדום", "אסטרל"], q: "Cap du Dramont Sentier littoral", img: "riviera/r-dramont",
      desc: "תצפית הפתיחה של קטע האסטרל — מצוק אדום מעל הים עם נוף ל-Île d'Or, אי סלע אדום זעיר עם מגדל, ולמפרץ אגאי. עצירה קצרה ויפהפייה בתחילת ה-Corniche d'Or.",
      near: "בכניסה ל-Corniche d'Or, מול מפרץ אגאי." },
    { name: "אגאי", fr: "Agay · Saint-Raphaël", cat: "beach", rate: "★ 4.5",
      tags: ["חוף", "מפרץ מוגן", "משפחתי", "צהריים"], q: "Plage d'Agay", img: "riviera/r-agay",
      desc: "מפרץ מעוגל ומוגן עם חוף חול נעים ומים רגועים — מהחופים הטובים באסטרל, אהוב על משפחות. עצירת הצהריים והשחייה האידיאלית באמצע הדרך, מתחת למצוקים האדומים.",
      near: "בלב מפרץ אגאי, על ה-Corniche d'Or.", note: "מקום מצוין לעצור לאכול ולהתרחץ." },
    { name: "קלנק אנתאור", fr: "Anthéor · Corniche d'Or", cat: "beach", rate: "★ 4.6", gem: true,
      tags: ["קלנק", "מצוקים אדומים", "שנורקלינג"], q: "Calanque d'Anthéor", img: "riviera/r-antheor",
      desc: "כפרון חוף זעיר בין מצוקי פורפיר אדומים לים טורקיז, עם מפרצונים נסתרים לשחייה ושנורקלינג והוויאדוקט המפורסם של אנתאור ברקע. אחת הפינות היפות של האסטרל.",
      near: "בין אגאי ל-Le Trayas, על ה-Corniche d'Or." },
    { name: "תצפית Cap Roux", fr: "Pic du Cap Roux · Esterel", cat: "view", rate: "★ 4.8", gem: true,
      tags: ["תצפית", "פנורמה 360°", "מצוקים אדומים"], q: "Pic du Cap Roux", img: "riviera/r-caproux",
      desc: "כיפת סלע אדום (452 מ׳) עם אחת התצפיות הפנורמיות המרהיבות בריביירה — נוף 360° על כל קו החוף, מסיב האסטרל והים עד האופק. אפשר להגיע לתצפית גם בלי כל הטיפוס.",
      near: "מעל ה-Corniche d'Or, בין אנתאור ל-Le Trayas." },
    { name: "Pointe de l'Aiguille", fr: "Théoule-sur-Mer", cat: "beach", rate: "★ 4.7", gem: true,
      tags: ["שמורה ימית", "שנורקלינג", "מפרצונים"], q: "Pointe de l'Aiguille Théoule", img: "riviera/r-aiguille",
      desc: "שמורת טבע ימית עם מפרצוני סלע אדום, מים צלולים ושביל שנורקלינג מסומן בים (בקיץ) — דגי סרגוס ומארגון. עצירת שחייה אחרונה ומענגת לפני קאן וניס.",
      near: "בקצה המזרחי של ה-Corniche d'Or, ליד Théoule." },
    { name: "קאן · La Croisette", fr: "Cannes", cat: "city", rate: "★ 4.7",
      tags: ["טיילת", "יוקרה", "עצירה"], q: "La Croisette Cannes", img: "riviera/r-cannes",
      desc: "טיילת הזוהר המפורסמת — שדרת דקלים מול מלונות בל-אפוק (Carlton), חופים ובוטיקים. עצירה קצרה לשאוב את אווירת הפסטיבל לפני שממשיכים מזרחה לאנטיב וניס.",
      near: "לפני אנטיב — כ-30 דק' מניס." },
  ];
  function wireCard(c, store, allFavs) {
    c.addEventListener("click", (e) => { if (e.target.closest(".fav,.maplink,.infolink")) return; openDetail(REG[c.dataset.id]); });
    const b = c.querySelector(".fav"); if (!b) return;
    const i = allFavs.indexOf(b);
    if (store[i]) { b.setAttribute("aria-pressed", "true"); b.textContent = "♥"; }
    b.onclick = () => {
      const v = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", v); b.textContent = v ? "♥" : "♡";
      const s2 = JSON.parse(localStorage.getItem("fr2") || "{}"); s2[i] = v; localStorage.setItem("fr2", JSON.stringify(s2));
    };
  }
  function setupRoadTab() {
    const main = document.querySelector("main.wrap"), tabsWrap = $(".tabs .wrap");
    if (!main || !tabsWrap || document.getElementById("view-road") || typeof card !== "function") return;
    if (!document.getElementById("frx-roadstyle"))
      document.head.insertAdjacentHTML("beforeend", '<style id="frx-roadstyle">body[data-tab="road"]{--accent:#C0512E}</style>');
    const view = document.createElement("section"); view.className = "view"; view.id = "view-road";
    view.innerHTML = '<div class="intro"><h2>בדרך מפרובאנס לניס</h2>' +
      '<p>במקום A8 הפנימי והמשעמם — לרדת לחוף לקטע הכי יפה בריביירה: ה-Corniche d\'Or של מסיב האסטרל. מצוקי פורפיר אדומים, מפרצונים טורקיז ועצירות שחייה. הנסיעה הופכת מ"להעביר" לחלק מהטיול.</p></div>' +
      '<div class="grid" id="road-grid"></div>';
    main.appendChild(view);
    const afterTab = $('.tabs .tab[data-tab="nice"]') || $('.tabs .tab[data-tab="provence"]');
    const btn = document.createElement("button");
    btn.className = "tab"; btn.setAttribute("role", "tab"); btn.setAttribute("aria-selected", "false");
    btn.dataset.tab = "road"; btn.textContent = "בדרך";
    if (afterTab) afterTab.insertAdjacentElement("afterend", btn); else tabsWrap.appendChild(btn);
    const grid = view.querySelector("#road-grid");
    ROAD.forEach((s) => { if (typeof NICE !== "undefined") NICE.push(s); grid.insertAdjacentHTML("beforeend", card(s)); });
    const store = JSON.parse(localStorage.getItem("fr2") || "{}"), allFavs = $$(".fav");
    $$("#road-grid .card").forEach((c) => wireCard(c, store, allFavs));
    btn.addEventListener("click", () => {
      document.body.dataset.tab = "road";
      $$(".tab").forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === "road" ? "true" : "false"));
      $$(".view").forEach((v) => v.classList.toggle("show", v.id === "view-road"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- הפעלה ---------- */
  function run() {
    try { setupMapCoords(); } catch (e) { console.warn("frx mapcoords", e); }
    try { addNiceCards(); } catch (e) { console.warn("frx newnice", e); }
    try { setupRoadTab(); } catch (e) { console.warn("frx roadtab", e); }
    try { setupTabs(); } catch (e) { console.warn("frx tabs", e); }
    try { setupGalleryMerge(); } catch (e) { console.warn("frx galmerge", e); }
    try { addDriveAndChips(); } catch (e) { console.warn("frx drive/chips", e); }
    try { setupFilters(); } catch (e) { console.warn("frx filters", e); }
    try { setupHeroes(); } catch (e) { console.warn("frx heroes", e); }
    try { setupFlyTo(); } catch (e) { console.warn("frx flyto", e); }
    try { setupGallery(); } catch (e) { console.warn("frx gallery", e); }
    try { setupMap(); } catch (e) { console.warn("frx map", e); }
    try { setupMotion(); } catch (e) { console.warn("frx motion", e); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
