const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

export function mergeStockOverrides(items, overrides) {
  return items.map((item) => {
    const override = overrides[item.id];
    if (Number.isFinite(override)) {
      return { ...item, stock: override };
    }
    return item;
  });
}

export function getVisibleItems(items, filters, sortOption) {
  const { searchTerm = "", category = "all", clinic = "all" } = filters;
  const normalizedSearch = normalize(searchTerm);

  const filtered = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesClinic = clinic === "all" || item.clinicId === clinic;
    const haystack = normalize(`${item.name} ${item.sku} ${item.location}`);
    const matchesSearch = normalizedSearch.length === 0 || haystack.includes(normalizedSearch);
    return matchesCategory && matchesClinic && matchesSearch;
  });

  return filtered.sort((a, b) => {
    switch (sortOption) {
      case "name-desc":
        return collator.compare(b.name, a.name);
      case "stock-asc":
        return a.stock - b.stock;
      case "stock-desc":
        return b.stock - a.stock;
      case "category-asc":
        return collator.compare(a.category, b.category);
      case "name-asc":
      default:
        return collator.compare(a.name, b.name);
    }
  });
}

export function getItemById(items, id) {
  return items.find((item) => item.id === id);
}

export function upsertOverride(overrides, id, stock) {
  return { ...overrides, [id]: stock };
}
