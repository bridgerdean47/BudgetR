// src/lib/buckets.js
import { CATEGORY_OPTIONS } from "./categories";

export const BUCKET_LABELS = {
  needs: "Needs",
  wants: "Wants",
  savings: "Savings",
};

export const BUCKET_COLORS = {
  needs: { text: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500", dot: "bg-blue-500" },
  wants: { text: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500", dot: "bg-yellow-500" },
  savings: { text: "text-green-400", bg: "bg-green-500/15", border: "border-green-500", dot: "bg-green-500" },
  default: { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-700", dot: "bg-gray-500" },
};

export function bucketStyle(bucket) {
  return BUCKET_COLORS[bucket] || BUCKET_COLORS.default;
}

const NEEDS = [
  "Rent",
  "Insurance",
  "Loans",
  "Bills & Utilities",
  "Groceries",
  "Gas",
  "Automotive",
  "Health & Wellness",
];

const WANTS = [
  "Shopping",
  "Entertainment",
  "Food & Drink",
  "Travel",
  "Personal",
  "Pets",
  "Cable/Satellite Services",
];

const SAVINGS = ["To Savings"];

export function defaultCategoryBuckets() {
  const map = {};
  CATEGORY_OPTIONS.forEach((cat) => {
    map[cat] = null;
  });
  NEEDS.forEach((cat) => (map[cat] = "needs"));
  WANTS.forEach((cat) => (map[cat] = "wants"));
  SAVINGS.forEach((cat) => (map[cat] = "savings"));
  return map;
}

export function resolveBucket(tx, categoryBuckets) {
  if (tx?.bucket) return tx.bucket;
  return (categoryBuckets || {})[tx?.category] ?? null;
}
