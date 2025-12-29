// src/lib/categoryMemory.js
const KEY = "BUDGETR_CATEGORY_MEMORY_V1";

// Normalize a description into a stable merchant key
export function merchantKeyFromDescription(desc = "") {
  let d = String(desc || "").toLowerCase().trim();

  // remove dates, ref numbers, extra punctuation
  d = d.replace(/\b\d{2}\/\d{2}\/\d{2,4}\b/g, "");
  d = d.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
  d = d.replace(/\b(ref|id|trace|auth|confirmation)\b[:\s-]*[a-z0-9-]+/g, "");
  d = d.replace(/[#*]/g, " ");
  d = d.replace(/\s+/g, " ").trim();

  // keep only first ~40 chars to avoid long noisy strings
  if (d.length > 40) d = d.slice(0, 40).trim();

  return d;
}

export function loadCategoryMemory() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCategoryMemory(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map || {}));
  } catch {
    // ignore quota errors
  }
}

export function rememberCategory(desc, category) {
  const cat = String(category || "").trim();
  if (!cat || cat === "Uncategorized") return;

  const key = merchantKeyFromDescription(desc);
  if (!key) return;

  const map = loadCategoryMemory();
  map[key] = cat;
  saveCategoryMemory(map);
}

export function lookupRememberedCategory(desc) {
  const key = merchantKeyFromDescription(desc);
  if (!key) return null;

  const map = loadCategoryMemory();
  return map[key] || null;
}