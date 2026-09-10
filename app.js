import { getItemById, getVisibleItems, mergeStockOverrides, upsertOverride } from "./stockLogic.js";

const STORAGE_KEY = "clinic-stock-overrides-v1";

const catalog = [
  {
    id: "gauze-5x5",
    sku: "GAU-5X5-001",
    name: "Sterile Gauze 5x5",
    category: "Dressings",
    clinicId: "clinic-001",
    clinicName: "Main Clinic",
    stock: 230,
    unit: "packs",
    location: "Store Room A",
  },
  {
    id: "nitrile-gloves-m",
    sku: "GLV-NIT-MED",
    name: "Nitrile Gloves Medium",
    category: "PPE",
    clinicId: "clinic-001",
    clinicName: "Main Clinic",
    stock: 124,
    unit: "boxes",
    location: "Store Room B",
  },
  {
    id: "syringe-5ml",
    sku: "SYR-5ML-STD",
    name: "Syringe 5ml",
    category: "Consumables",
    clinicId: "clinic-001",
    clinicName: "Main Clinic",
    stock: 460,
    unit: "units",
    location: "Store Room A",
  },
  {
    id: "alcohol-swab",
    sku: "SWB-ALC-100",
    name: "Alcohol Swab",
    category: "Consumables",
    clinicId: "clinic-001",
    clinicName: "Main Clinic",
    stock: 980,
    unit: "units",
    location: "Store Room C",
  },
  {
    id: "face-mask-3ply",
    sku: "MSK-3PLY-BOX",
    name: "3-Ply Face Mask",
    category: "PPE",
    clinicId: "clinic-001",
    clinicName: "Main Clinic",
    stock: 312,
    unit: "boxes",
    location: "Store Room B",
  },
];

let overrides = loadOverrides();
const state = {
  searchTerm: "",
  category: "all",
  clinic: "all",
  sortOption: "name-asc",
};

const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const clinicFilter = document.querySelector("#clinic-filter");
const sortSelect = document.querySelector("#sort-select");
const itemList = document.querySelector("#item-list");
const itemDetail = document.querySelector("#item-detail");
const networkStatus = document.querySelector("#network-status");

setupFilters();
bindEvents();
render();
updateNetworkStatus();

function bindEvents() {
  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    render();
  });

  categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  clinicFilter.addEventListener("change", (event) => {
    state.clinic = event.target.value;
    render();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sortOption = event.target.value;
    render();
  });

  window.addEventListener("hashchange", () => {
    renderDetail();
  });
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
}

function setupFilters() {
  const categories = ["all", ...new Set(catalog.map((item) => item.category))];
  categoryFilter.innerHTML = categories
    .map((category) => `<option value="${category}">${category === "all" ? "All categories" : category}</option>`)
    .join("");

  const clinics = ["all", ...new Set(catalog.map((item) => item.clinicId))];
  clinicFilter.innerHTML = clinics
    .map((clinicId) => {
      if (clinicId === "all") return '<option value="all">All clinics</option>';
      const clinic = catalog.find((item) => item.clinicId === clinicId);
      return `<option value="${clinicId}">${clinic.clinicName}</option>`;
    })
    .join("");
}

function render() {
  const items = mergeStockOverrides(catalog, overrides);
  const visible = getVisibleItems(items, state, state.sortOption);
  itemList.innerHTML = visible
    .map(
      (item) => `
      <li>
        <a href="#item/${item.id}">
          <strong>${item.name}</strong><br />
          <span>${item.category} · ${item.stock} ${item.unit} · ${item.location}</span>
        </a>
      </li>
    `
    )
    .join("");

  if (visible.length === 0) {
    itemList.innerHTML = "<li>No matching stock items.</li>";
  }

  renderDetail();
}

function renderDetail() {
  const itemId = window.location.hash.replace("#item/", "");
  const selected = getItemById(mergeStockOverrides(catalog, overrides), itemId);

  if (!selected) {
    itemDetail.textContent = "Select an item to see detail.";
    return;
  }

  itemDetail.innerHTML = `
    <div class="stack">
      <strong>${selected.name}</strong>
      <span>SKU: ${selected.sku}</span>
      <span>Clinic: ${selected.clinicName}</span>
      <span>Category: ${selected.category}</span>
      <span>Location: ${selected.location}</span>
      <span>Current stock: ${selected.stock} ${selected.unit}</span>
      <form id="stock-adjust-form" class="stack">
        <label>
          Correct stock count
          <input id="stock-input" type="number" min="0" step="1" value="${selected.stock}" required />
        </label>
        <button type="submit">Save correction</button>
        <span class="hint">Changes are stored on this device and work offline.</span>
      </form>
      <p id="save-feedback" class="success" role="status"></p>
    </div>
  `;

  const form = document.querySelector("#stock-adjust-form");
  const feedback = document.querySelector("#save-feedback");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextValue = Number(document.querySelector("#stock-input").value);
    if (!Number.isInteger(nextValue) || nextValue < 0) {
      feedback.textContent = "Please enter a valid non-negative whole number.";
      return;
    }

    overrides = upsertOverride(overrides, selected.id, nextValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    feedback.textContent = "Stock correction saved.";
    render();
  });
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function updateNetworkStatus() {
  networkStatus.textContent = navigator.onLine
    ? "Online mode. Data and corrections are available locally."
    : "Offline mode. You can still browse stock and save corrections.";
}
