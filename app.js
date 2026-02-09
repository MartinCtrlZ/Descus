/* =========================
   Storage helpers
========================= */
const LS_KEYS = {
  DISCOUNTS: "discounts_app_discounts_v1",
  USER: "discounts_app_user_v1",
  READ: "discounts_app_read_ids_v1"
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDiscounts() {
  return loadJSON(LS_KEYS.DISCOUNTS, []);
}
function setDiscounts(list) {
  saveJSON(LS_KEYS.DISCOUNTS, list);
}

function getReadSet() {
  return new Set(loadJSON(LS_KEYS.READ, []));
}
function setReadSet(setObj) {
  saveJSON(LS_KEYS.READ, Array.from(setObj));
}

/* =========================
   Icons (SVG inline)
========================= */
const ICONS = {
  user: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="22" r="12" fill="#fff"/>
    <path d="M10 56c4-14 40-14 44 0" fill="#fff"/>
  </svg>`,
  bell: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 58c4 0 7-3 7-7H25c0 4 3 7 7 7Z" fill="#000"/>
    <path d="M50 44H14c4-5 6-8 6-18 0-8 5-14 12-16v-2c0-2 2-4 4-4s4 2 4 4v2c7 2 12 8 12 16 0 10 2 13 6 18Z" fill="#000"/>
  </svg>`,
  help: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="#000"/>
    <path d="M32 46a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="#18b7c9"/>
    <path d="M32 12c-8 0-14 5-14 13h8c0-4 2-6 6-6 3 0 5 2 5 4 0 3-2 4-5 6-4 2-7 5-7 11v2h8v-1c0-4 1-5 4-7 4-2 8-5 8-12 0-6-5-10-13-10Z" fill="#18b7c9"/>
  </svg>`,
  store: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="10" y="26" width="44" height="28" rx="4" fill="#fff"/>
    <rect x="14" y="30" width="16" height="12" fill="#ffd36a"/>
    <rect x="34" y="30" width="16" height="20" fill="#ff7a7a"/>
    <path d="M12 26l6-12h28l6 12H12Z" fill="#ff7a7a"/>
    <path d="M18 14h28" stroke="#18b7c9" stroke-width="4" stroke-linecap="round"/>
  </svg>`
};

function mountIcon(el, svg) {
  if (!el) return;
  el.innerHTML = svg;
}

/* =========================
   Common nav
========================= */
function go(url) { window.location.href = url; }

function initTopbar() {
  // Icons in header
  document.querySelectorAll("[data-icon='help']").forEach(el => mountIcon(el, ICONS.help));
  document.querySelectorAll("[data-icon='bell']").forEach(el => mountIcon(el, ICONS.bell));
  document.querySelectorAll("[data-icon='user']").forEach(el => mountIcon(el, ICONS.user));

  const btnEdit = document.getElementById("btnEdit");
  if (btnEdit) btnEdit.addEventListener("click", () => go("config.html"));

  const btnHelp = document.getElementById("btnHelp");
  if (btnHelp) btnHelp.addEventListener("click", () => go("help.html"));

  const btnBell = document.getElementById("btnBell");
  if (btnBell) btnBell.addEventListener("click", () => go("notifications.html"));

  const btnUser = document.getElementById("btnUser");
  if (btnUser) btnUser.addEventListener("click", () => go("login.html"));

  const btnBack = document.querySelector("[data-back]");
  if (btnBack) btnBack.addEventListener("click", () => history.back());
}

/* =========================
   Notifications builder
========================= */
function discountToNotification(d) {
  return {
    id: d.id,
    store: d.storeName || "Tienda",
    desc: d.description || "",
    value: d.discountValue || "",
    entity: d.entity || "",
    days: d.days || [],
    repeat: d.repeat || "none",
    createdAt: d.createdAt || Date.now()
  };
}

function prettyValue(v) {
  // Dejá lo que el usuario escribió, pero si es porcentaje asegurá el %
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d+%$/.test(s)) return s;
  return s;
}

/* =========================
   Index (Home)
========================= */
function initHome() {
  const listEl = document.getElementById("homeList");
  const chipsEl = document.getElementById("homeStores");
  const notifDotEl = document.getElementById("notifDot");

  const discounts = getDiscounts();
  const readSet = getReadSet();

  // Notif "sin leer"
  const unread = discounts.some(d => !readSet.has(d.id));
  if (notifDotEl) notifDotEl.style.display = unread ? "block" : "none";

  // Row of stores (chips)
  if (chipsEl) {
    chipsEl.innerHTML = "";
    const uniqueStores = [...new Map(discounts.map(d => [d.storeName || "Tienda", d])).values()]
      .slice(0, 10);

    if (uniqueStores.length === 0) {
      uniqueStores.push({ storeName: "Tienda" }, { storeName: "Tienda" }, { storeName: "Tienda" });
    }

    uniqueStores.forEach(d => {
      const div = document.createElement("div");
      div.className = "store-chip";
      div.innerHTML = `
        <div class="store-icon">${ICONS.store}</div>
        ${d.storeName || "Tienda"}
      `;
      chipsEl.appendChild(div);
    });
  }

  // List items (today-ish: show all, simplest)
  if (listEl) {
    listEl.innerHTML = "";
    if (discounts.length === 0) {
      // Placeholders
      const placeholders = [
        { storeName:"Tienda x", description:"Frutas y Verduras", discountValue:"30%" },
        { storeName:"Tienda x", description:"Segunda unidad calzado", discountValue:"-500$" },
        { storeName:"Tienda x", description:"Pizza y faina", discountValue:"2x1" },
      ];
      placeholders.forEach(p => listEl.appendChild(renderDiscountCard(p)));
      return;
    }

    // newest first
    discounts
      .slice()
      .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
      .slice(0, 8)
      .forEach(d => listEl.appendChild(renderDiscountCard(d)));
  }

  // Calendar just visual columns like tu mock
  // (por ahora vacío, se puede llenar más adelante)
}

function renderDiscountCard(d) {
  const wrap = document.createElement("div");
  wrap.className = "card-item";
  wrap.innerHTML = `
    <div class="leftIcon">${ICONS.store}</div>
    <div class="mid">
      <p class="title">${escapeHTML(d.storeName || "Tienda x")}</p>
      <p class="desc">${escapeHTML(d.description || "")}</p>
    </div>
    <div class="right">
      <p class="label">Descuento</p>
      <p class="value">${escapeHTML(prettyValue(d.discountValue || ""))}</p>
    </div>
  `;
  return wrap;
}

/* =========================
   Login
========================= */
function initLogin() {
  const form = document.getElementById("loginForm");
  const btnBackHome = document.getElementById("backHome");

  if (btnBackHome) btnBackHome.addEventListener("click", () => go("index.html"));

  if (!form) return;

  const user = loadJSON(LS_KEYS.USER, null);
  if (user?.email) {
    document.getElementById("email").value = user.email;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;

    if (pass.length < 10) {
      alert("La contraseña debe tener mínimo 10 caracteres.");
      return;
    }
    saveJSON(LS_KEYS.USER, { email, loggedIn: true, at: Date.now() });
    alert("Sesión iniciada.");
    go("index.html");
  });

  const create = document.getElementById("btnCreate");
  if (create) create.addEventListener("click", () => {
    alert("Cuenta creada (demo). Ya podés entrar.");
  });
}

/* =========================
   Help
========================= */
function initHelp() {
  const back = document.getElementById("helpBack");
  if (back) back.addEventListener("click", () => history.back());
}

/* =========================
   Notifications page
========================= */
function initNotifications() {
  const listEl = document.getElementById("notifList");
  const back = document.getElementById("notifBack");
  if (back) back.addEventListener("click", () => go("index.html"));

  const discounts = getDiscounts().slice().sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
  const readSet = getReadSet();

  if (!listEl) return;

  listEl.innerHTML = "";
  if (discounts.length === 0) {
    listEl.appendChild(renderDiscountCard({
      storeName:"Tienda x",
      description:"Frutas y Verduras",
      discountValue:"30%"
    }));
    listEl.appendChild(renderDiscountCard({
      storeName:"Tienda x",
      description:"Frutas y Verduras",
      discountValue:"30%"
    }));
    return;
  }

  discounts.forEach((d, idx) => {
    // "fecha" tipo tu mock (intercalada)
    if (idx === 1 || idx === 3) {
      const hr = document.createElement("div");
      hr.className = "hr-date";
      hr.textContent = new Date(d.createdAt || Date.now()).toLocaleDateString();
      listEl.appendChild(hr);
    }

    const card = renderDiscountCard(d);
    card.style.opacity = readSet.has(d.id) ? "0.75" : "1";
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      readSet.add(d.id);
      setReadSet(readSet);
      card.style.opacity = "0.75";
    });
    listEl.appendChild(card);
  });
}

/* =========================
   Config page (create/edit/delete)
========================= */
const ENTITIES = [
  "BROU RECOMPENSA",
  "ITAU CREDITO",
  "ITAU VOLAR",
  "SANTANDER DEBITO",
  "SANTANDER CREDITO",
  "BBVA CREDITO",
  "OCA",
  "OCA BLUE",
  "SCOTIABANK"
];

const DISCOUNT_PRESETS = ["2x1", "3x2", "15%", "30%"];

const PRESET_IMAGES = [
  // data-url SVGs simples (no dependés de imágenes)
  `data:image/svg+xml;utf8,${encodeURIComponent(svgPreset("#18b7c9","#ff7a7a","#fff"))}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(svgPreset("#18b7c9","#ffd36a","#fff"))}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(svgPreset("#18b7c9","#9bffb0","#fff"))}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(svgPreset("#18b7c9","#b9b9ff","#fff"))}`
];

function svgPreset(a,b,c){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
    <rect width="128" height="128" rx="24" fill="${a}"/>
    <rect x="20" y="48" width="88" height="60" rx="12" fill="${c}"/>
    <rect x="20" y="32" width="88" height="20" rx="10" fill="${b}"/>
    <rect x="30" y="60" width="30" height="24" fill="${b}"/>
    <rect x="66" y="60" width="32" height="40" fill="${b}"/>
  </svg>`;
}

let editingId = null;
let currentImage = PRESET_IMAGES[0];

function initConfig() {
  const back = document.getElementById("configBack");
  if (back) back.addEventListener("click", () => go("index.html"));

  // mount presets
  const entitySel = document.getElementById("entity");
  ENTITIES.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e; opt.textContent = e;
    entitySel.appendChild(opt);
  });

  const discountSel = document.getElementById("discountPreset");
  DISCOUNT_PRESETS.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    discountSel.appendChild(opt);
  });

  // image presets row
  const presetRow = document.getElementById("presetRow");
  const thumbImg = document.getElementById("thumbImg");
  if (thumbImg) thumbImg.src = currentImage;

  if (presetRow) {
    presetRow.innerHTML = "";
    PRESET_IMAGES.forEach((src) => {
      const b = document.createElement("button");
      b.className = "preset";
      b.innerHTML = `<img src="${src}" alt="preset" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">`;
      b.addEventListener("click", () => {
        currentImage = src;
        if (thumbImg) thumbImg.src = currentImage;
      });
      presetRow.appendChild(b);
    });
  }

  // upload from gallery
  const file = document.getElementById("imgFile");
  if (file) {
    file.addEventListener("change", async () => {
      const f = file.files?.[0];
      if (!f) return;
      const dataUrl = await fileToDataURL(f);
      currentImage = dataUrl;
      if (thumbImg) thumbImg.src = currentImage;
    });
  }

  // day toggles
  document.querySelectorAll(".day-toggle").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });

  // Save / Update
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (saveBtn) saveBtn.addEventListener("click", onSave);
  if (deleteBtn) deleteBtn.addEventListener("click", onDelete);
  if (clearBtn) clearBtn.addEventListener("click", clearForm);

  // Link preset -> fill discount input
  discountSel.addEventListener("change", () => {
    const custom = document.getElementById("discountValue");
    if (custom) custom.value = discountSel.value;
  });

  renderEditRow();
}

function getSelectedDays() {
  const map = [
    { id:"Lu", key:"Lu" },
    { id:"Ma", key:"Ma" },
    { id:"Mi", key:"Mi" },
    { id:"Ju", key:"Ju" },
    { id:"Vi", key:"Vi" },
    { id:"Sa", key:"Sa" },
    { id:"Do", key:"Do" },
  ];
  return map
    .filter(x => document.getElementById(`day-${x.id}`)?.classList.contains("active"))
    .map(x => x.key);
}

function onSave() {
  const storeName = document.getElementById("storeName").value.trim();
  const description = document.getElementById("description").value.trim();
  const discountValue = document.getElementById("discountValue").value.trim();
  const entity = document.getElementById("entity").value;
  const repeat = document.getElementById("repeat").value;
  const days = getSelectedDays();

  if (!storeName) { alert("Falta el nombre de la tienda."); return; }
  if (!discountValue) { alert("Falta el descuento."); return; }
  if (days.length === 0) { alert("Elegí al menos un día."); return; }

  const discounts = getDiscounts();

  if (editingId) {
    const idx = discounts.findIndex(d => d.id === editingId);
    if (idx === -1) { alert("No se encontró el descuento a editar."); return; }
    discounts[idx] = {
      ...discounts[idx],
      storeName, description, discountValue, entity, repeat, days,
      image: currentImage,
      updatedAt: Date.now()
    };
  } else {
    discounts.push({
      id: uid(),
      storeName, description, discountValue, entity, repeat, days,
      image: currentImage,
      createdAt: Date.now()
    });
  }

  setDiscounts(discounts);
  clearForm();
  renderEditRow();
  alert(editingId ? "Descuento actualizado." : "Descuento creado.");
}

function onDelete() {
  if (!editingId) { alert("Elegí un descuento de abajo para borrar."); return; }
  const discounts = getDiscounts().filter(d => d.id !== editingId);
  setDiscounts(discounts);

  // también lo marcamos como leído para que no quede “pendiente”
  const readSet = getReadSet();
  readSet.add(editingId);
  setReadSet(readSet);

  clearForm();
  renderEditRow();
  alert("Descuento eliminado.");
}

function clearForm() {
  editingId = null;
  document.getElementById("storeName").value = "";
  document.getElementById("description").value = "";
  document.getElementById("discountValue").value = "";
  document.getElementById("entity").value = ENTITIES[0];
  document.getElementById("repeat").value = "weekly";
  document.getElementById("discountPreset").value = "";

  document.querySelectorAll(".day-toggle").forEach(btn => btn.classList.remove("active"));

  // reset image
  currentImage = PRESET_IMAGES[0];
  const thumbImg = document.getElementById("thumbImg");
  if (thumbImg) thumbImg.src = currentImage;

  const title = document.getElementById("saveBtn");
  if (title) title.textContent = "Guardar";
}

function renderEditRow() {
  const row = document.getElementById("editRow");
  if (!row) return;

  const discounts = getDiscounts().slice().sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
  row.innerHTML = "";

  const show = discounts.slice(0, 10);
  if (show.length === 0) {
    ["Tienda x","Tienda y","Tienda c","Tienda a","Tienda w"].forEach(name => {
      row.appendChild(renderEditChip({ storeName:name }));
    });
    return;
  }

  show.forEach(d => row.appendChild(renderEditChip(d)));
}

function renderEditChip(d) {
  const div = document.createElement("div");
  div.className = "store-chip";
  const img = d.image || PRESET_IMAGES[0];

  div.innerHTML = `
    <div class="store-icon" style="overflow:hidden">
      <img src="${img}" alt="store" style="width:100%;height:100%;object-fit:cover">
    </div>
    ${escapeHTML(d.storeName || "Tienda")}
  `;

  // Si tiene id => es clickeable para editar
  if (d.id) {
    div.style.cursor = "pointer";
    div.addEventListener("click", () => loadForEdit(d.id));
  }
  return div;
}

function loadForEdit(id) {
  const discounts = getDiscounts();
  const d = discounts.find(x => x.id === id);
  if (!d) return;

  editingId = id;

  document.getElementById("storeName").value = d.storeName || "";
  document.getElementById("description").value = d.description || "";
  document.getElementById("discountValue").value = d.discountValue || "";
  document.getElementById("entity").value = d.entity || ENTITIES[0];
  document.getElementById("repeat").value = d.repeat || "weekly";

  document.querySelectorAll(".day-toggle").forEach(btn => btn.classList.remove("active"));
  (d.days || []).forEach(day => {
    const el = document.getElementById(`day-${day}`);
    if (el) el.classList.add("active");
  });

  currentImage = d.image || PRESET_IMAGES[0];
  const thumbImg = document.getElementById("thumbImg");
  if (thumbImg) thumbImg.src = currentImage;

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) saveBtn.textContent = "Actualizar";
}

/* =========================
   Utils
========================= */
function escapeHTML(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* =========================
   Bootstrap per page
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initTopbar();

  const page = document.body.getAttribute("data-page");
  if (page === "home") initHome();
  if (page === "login") initLogin();
  if (page === "help") initHelp();
  if (page === "notifications") initNotifications();
  if (page === "config") initConfig();
});
