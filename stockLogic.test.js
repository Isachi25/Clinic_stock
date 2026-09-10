import assert from "node:assert/strict";
import test from "node:test";
import { getItemById, getVisibleItems, mergeStockOverrides, upsertOverride } from "./stockLogic.js";

const items = [
  { id: "a", name: "Face Mask", sku: "SKU-A", location: "Shelf 1", category: "PPE", clinicId: "clinic-001", stock: 10 },
  { id: "b", name: "Syringe", sku: "SKU-B", location: "Shelf 2", category: "Consumables", clinicId: "clinic-001", stock: 4 },
  { id: "c", name: "Gauze", sku: "SKU-C", location: "Shelf 3", category: "Dressings", clinicId: "clinic-002", stock: 20 },
];

test("filters by search, clinic and category", () => {
  const visible = getVisibleItems(
    items,
    { searchTerm: "syr", category: "Consumables", clinic: "clinic-001" },
    "name-asc"
  );
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "b");
});

test("sorts by stock descending", () => {
  const visible = getVisibleItems(items, { searchTerm: "", category: "all", clinic: "all" }, "stock-desc");
  assert.deepEqual(
    visible.map((item) => item.id),
    ["c", "a", "b"]
  );
});

test("merges stock overrides and retrieves item by id", () => {
  const merged = mergeStockOverrides(items, { a: 99 });
  assert.equal(getItemById(merged, "a")?.stock, 99);
});

test("upsertOverride stores replacement value", () => {
  const next = upsertOverride({ a: 10 }, "a", 18);
  assert.equal(next.a, 18);
});
