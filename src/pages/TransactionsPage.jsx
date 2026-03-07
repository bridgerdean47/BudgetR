// src/pages/TransactionsPage.jsx
import { useState, useMemo, useRef } from "react";
import { parseCsv } from "../lib/csv";

/* -------------------------------------------------
   CATEGORY MEMORY (learn from manual edits)
-------------------------------------------------- */
const CATEGORY_MEMORY_KEY = "BUDGETR_CATEGORY_MEMORY_V1";

function normalizeMerchantKey(desc = "") {
  let d = String(desc || "").toLowerCase().trim();

  // remove common noise
  d = d.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
  d = d.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "");
  d = d.replace(/\b(ref|id|trace|auth|confirmation)\b[:\s-]*[a-z0-9-]+/g, "");
  d = d.replace(/[#*]/g, " ");
  d = d.replace(/\s+/g, " ").trim();

  // keep it short to avoid unstable keys
  if (d.length > 48) d = d.slice(0, 48).trim();

  return d;
}

function loadCategoryMemory() {
  try {
    const raw = localStorage.getItem(CATEGORY_MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCategoryMemory(map) {
  try {
    localStorage.setItem(CATEGORY_MEMORY_KEY, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
}

function rememberCategory(description, category) {
  const cat = String(category || "").trim();
  if (!cat || cat === "Uncategorized") return;

  const key = normalizeMerchantKey(description);
  if (!key) return;

  const map = loadCategoryMemory();
  map[key] = cat;
  saveCategoryMemory(map);
}

function lookupRememberedCategory(description) {
  const key = normalizeMerchantKey(description);
  if (!key) return null;
  const map = loadCategoryMemory();
  return map[key] || null;
}

/* -------------------------------------------------
   CATEGORY OPTIONS
-------------------------------------------------- */
const CATEGORY_OPTIONS = [
  "Uncategorized",
  "Credit Card",
  "Rent",
  "Credit Card Payments",
  "Loans",
  "Insurance",
  "Groceries",
  "Food & Drink",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Gas",
  "Automotive",
  "Health & Wellness",
  "Pets",
  "Travel",
  "Personal",
  "Cable/Satellite Services",
  "To Checking",
  "To Savings",
];

/* -------------------------------------------------
   MERCHANT CATEGORY OVERRIDES
-------------------------------------------------- */
const MERCHANT_CATEGORY_RULES = [
  { match: "apts anderson", category: "Rent" },
  { match: "apts ander", category: "Rent" },
  { match: "ach apts", category: "Rent" },
  { match: "withdrawal ach apts", category: "Rent" },
  { match: "quantum fiber", category: "Bills & Utilities" },
  { match: "dept education", category: "Loans" },
  { match: "chase credit crd", category: "Credit Card Payments" },
];

/* -------------------------------------------------
   CATEGORY GUESSER  — mirrors csv.js guessCategory
-------------------------------------------------- */
function guessCategory(desc = "") {
  if (!desc) return null;

  const d = desc
    .toLowerCase()
    .replace(
      /^(pos purchase|pos debit|debit card purchase|check card purchase|ach debit|ach credit|ach payment|online transfer|electronic payment|preauthorized debit|preauthorized credit|recurring payment|bill payment|web payment|phone payment|teller|atm withdrawal|atm deposit|mobile deposit|mobile check deposit|wire transfer|direct debit|direct deposit|point of sale purchase|debit|credit)\s*/i,
      ""
    )
    .trim();

  // Merchant rules (manual overrides from MERCHANT_CATEGORY_RULES)
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (d.includes(rule.match)) return rule.category;
  }

  if (
    d.includes("apts anderson") || d.includes("apts ander") ||
    d.includes("ach apts") || d.includes("withdrawal ach apts") ||
    d.includes("apartment") || d.includes(" apts ") ||
    d.startsWith("apts ") || d.includes(" rent") ||
    d.startsWith("rent") || d.includes("lease") ||
    d.includes("property mgmt") || d.includes("property management") ||
    d.includes("realty") || d.includes("landlord")
  ) return "Rent";

  if (
    d.includes("chase credit crd") || d.includes("chase credit card") ||
    d.includes("credit card payment") || d.includes("cc payment") ||
    d.includes("payment thank you") || d.includes("autopay payment") ||
    d.includes("citi card") || d.includes("capital one") ||
    d.includes("discover card") || d.includes("amex payment") ||
    d.includes("american express payment") || d.includes("synchrony bank") ||
    d.includes("barclays")
  ) return "Credit Card Payments";

  if (
    d.includes("dept education") || d.includes("dept of ed") ||
    d.includes("dept. of ed") || d.includes("student loan") ||
    d.includes("loan payment") || d.includes("nelnet") ||
    d.includes("navient") || d.includes("mohela") ||
    d.includes("sallie mae") || d.includes("great lakes") ||
    d.includes("auto loan") || d.includes("car loan") ||
    d.includes("mortgage payment") || /\bmortgage\b/.test(d)
  ) return "Loans";

  if (
    d.includes("quantum fiber") || d.includes("xfinity") ||
    d.includes("comcast") || d.includes("cox comm") ||
    d.includes("spectrum") || d.includes("at&t") || d.includes("att.com") ||
    d.includes("verizon") || d.includes("t-mobile") || d.includes("tmobile") ||
    d.includes("sprint") || d.includes("boost mobile") ||
    d.includes("cricket wireless") || d.includes("metro pcs") ||
    d.includes("metropcs") || d.includes("internet") ||
    d.includes("power company") || d.includes("electric") ||
    d.includes("water bill") || d.includes("water dept") ||
    d.includes("gas & electric") || d.includes("pge") || d.includes("pg&e") ||
    d.includes("rocky mountain power") || d.includes("pacific power") ||
    d.includes("idaho power") || d.includes("utility") ||
    d.includes("utilities") || d.includes("waste management") ||
    d.includes("republic services") || d.includes("sewage") ||
    d.includes("garbage") || d.includes("trash pickup") ||
    /\bxcel energy\b/.test(d) || /\bduke energy\b/.test(d)
  ) return "Bills & Utilities";

  if (
    d.includes("walmart") || d.includes("wal-mart") || d.includes("wal mart") ||
    d.includes("winco") || d.includes("grocery") || d.includes("groceries") ||
    d.includes("safeway") || d.includes("kroger") || d.includes("albertsons") ||
    d.includes("fred meyer") || d.includes("smiths food") ||
    d.includes("smith's") || d.includes("smiths #") ||
    d.includes("harmons") || d.includes("trader joe") ||
    d.includes("whole foods") || d.includes("sprouts") ||
    d.includes("aldi") || d.includes("publix") ||
    d.includes("h-e-b") || d.includes("heb ") ||
    d.includes("meijer") || d.includes("wegmans") ||
    d.includes("food lion") || d.includes("giant food") ||
    d.includes("stop & shop") || d.includes("stop and shop") ||
    d.includes("hy-vee") || d.includes("hyvee") ||
    d.includes("food 4 less") || d.includes("grocery outlet") ||
    d.includes("market basket") || d.includes("fresh market") ||
    d.includes("natural grocers") || d.includes("costco") ||
    d.includes("sam's club") || d.includes("bj's wholesale") ||
    d.includes("supermarket")
  ) return "Groceries";

  if (
    d.includes("mcdonald") || d.includes("taco bell") ||
    d.includes("burger king") || d.includes("wendy") ||
    d.includes("subway") || d.includes("restaurant") ||
    d.includes("cafe") || d.includes("coffee") || d.includes("pizza") ||
    d.includes("starbucks") || d.includes("dunkin") ||
    d.includes("chipotle") || d.includes("panera") ||
    d.includes("chick-fil-a") || d.includes("chick fil a") ||
    d.includes("chickfila") || d.includes("popeye") ||
    d.includes("kfc") || d.includes("domino") ||
    d.includes("papa john") || d.includes("little caesars") ||
    d.includes("pizza hut") || d.includes("five guys") ||
    d.includes("in-n-out") || d.includes("in n out") ||
    d.includes("whataburger") || d.includes("sonic drive") ||
    d.includes("sonic #") || d.includes("dairy queen") ||
    d.includes("arby") || d.includes("panda express") ||
    d.includes("olive garden") || d.includes("applebee") ||
    d.includes("chili") || d.includes("denny") ||
    d.includes("ihop") || d.includes("waffle house") ||
    d.includes("cracker barrel") || d.includes("cheesecake factory") ||
    d.includes("red lobster") || d.includes("outback") ||
    d.includes("sushi") || d.includes("donut") || d.includes("doughnut") ||
    d.includes("smoothie") || d.includes("jamba juice") ||
    d.includes("dutch bros") || d.includes("portillo") ||
    d.includes("shake shack") || d.includes("wingstop") ||
    d.includes("raising cane") || d.includes("jersey mike") ||
    d.includes("jimmy john") || d.includes("firehouse sub") ||
    d.includes("noodle") || d.includes("deli") || d.includes("bakery") ||
    d.includes("bar & grill") || d.includes("grille") ||
    d.includes("bistro") || d.includes("tavern") ||
    d.includes("brewing") || d.includes("brewery") || d.includes("winery") ||
    d.includes("doordash") || d.includes("grubhub") ||
    d.includes("ubereats") || d.includes("uber eats") ||
    d.includes("instacart")
  ) return "Food & Drink";

  if (
    d.includes("shell") || d.includes("chevron") ||
    d.includes("gas station") || d.includes("exxon") ||
    d.includes("mobil") || d.includes("bp gas") || d.includes("bp #") ||
    d.includes("sinclair") || d.includes("conoco") ||
    d.includes("texaco") || d.includes("valero") ||
    d.includes("marathon") || d.includes("sunoco") ||
    d.includes("circle k") || d.includes("kwik trip") ||
    d.includes("kwik star") || d.includes("casey") ||
    d.includes("murphy usa") || d.includes("murphy express") ||
    d.includes("76 gas") || d.includes("arco") ||
    d.includes("love's travel") || d.includes("pilot flying") ||
    d.includes("flying j") || d.includes("speedway") ||
    d.includes("holiday station") || d.includes("fuel station") ||
    /\bgas\s*#\s*\d/.test(d)
  ) return "Gas";

  if (
    d.includes("autozone") || d.includes("o'reilly auto") ||
    d.includes("oreilly auto") || d.includes("advance auto") ||
    d.includes("napa auto") || d.includes("jiffy lube") ||
    d.includes("valvoline") || d.includes("firestone") ||
    d.includes("pep boys") || d.includes("goodyear") ||
    d.includes("discount tire") || d.includes("les schwab") ||
    d.includes("midas") || d.includes("meineke") ||
    d.includes("safelite") || d.includes("car wash") ||
    d.includes("carwash") || d.includes("auto repair") ||
    d.includes("auto service") || d.includes("oil change") ||
    d.includes("tire center") || d.includes("vehicle registration") ||
    d.includes("dmv ") || /\bdmv\b/.test(d)
  ) return "Automotive";

  if (
    d.includes("spotify") || d.includes("netflix") || d.includes("hulu") ||
    d.includes("youtube") || d.includes("disney+") ||
    d.includes("disney plus") || d.includes("disneyplus") ||
    d.includes("hbo") || d.includes("paramount") ||
    d.includes("peacock") || d.includes("fubo") ||
    d.includes("espn+") || d.includes("espn plus") ||
    d.includes("apple tv") || d.includes("apple music") ||
    d.includes("apple one") || d.includes("amazon prime") ||
    d.includes("amazon music") || d.includes("pandora") ||
    d.includes("tidal") || d.includes("siriusxm") ||
    d.includes("sirius xm") || d.includes("xbox game pass") ||
    d.includes("playstation") || d.includes("nintendo") ||
    d.includes("steam ") || d.includes("steam.com") ||
    d.includes("twitch") || d.includes("regal cinema") ||
    d.includes("amc theatr") || d.includes("movie theater") ||
    d.includes("cinemark") || d.includes("fandango") ||
    d.includes("ticketmaster") || d.includes("livenation") ||
    d.includes("live nation") || d.includes("bowling") ||
    d.includes("golf") || d.includes("escape room")
  ) return "Entertainment";

  if (
    d.includes("flight") || d.includes("hotel") || d.includes("airbnb") ||
    d.includes("airline") || d.includes("southwest air") ||
    d.includes("delta air") || d.includes("united air") ||
    d.includes("american air") || d.includes("alaska air") ||
    d.includes("frontier air") || d.includes("spirit air") ||
    d.includes("jetblue") || d.includes("allegiant") ||
    d.includes("marriott") || d.includes("hilton") || d.includes("hyatt") ||
    d.includes("holiday inn") || d.includes("best western") ||
    d.includes("hampton inn") || d.includes("motel 6") ||
    d.includes("super 8") || d.includes("vrbo") ||
    d.includes("expedia") || d.includes("booking.com") ||
    d.includes("priceline") || d.includes("hertz") ||
    d.includes("enterprise rent") || d.includes("avis rent") ||
    d.includes("budget rent") || d.includes("national car") ||
    d.includes("alamo rent") || d.includes("uber") ||
    d.includes("lyft") || d.includes("taxi") ||
    d.includes("amtrak") || d.includes("greyhound") ||
    d.includes("parking meter") || /\btoll\b/.test(d)
  ) return "Travel";

  if (
    d.includes("petco") || d.includes("petsmart") ||
    d.includes("pet supplies") || d.includes("pet store") ||
    d.includes("veterinary") || d.includes("animal hospital") ||
    d.includes("animal clinic") || d.includes("pet ") ||
    d.includes(" vet")
  ) return "Pets";

  if (
    d.includes("cvs") || d.includes("walgreens") || d.includes("rite aid") ||
    d.includes("pharmacy") || d.includes("prescription") ||
    d.includes("rx ") || d.includes("doctor") || d.includes("dentist") ||
    d.includes("dental") || d.includes("orthodon") ||
    d.includes("vision") || d.includes("optometry") ||
    d.includes("hospital") || d.includes("medical center") ||
    d.includes("urgent care") || d.includes("clinic") ||
    d.includes("health plan") || d.includes("planet fitness") ||
    d.includes("la fitness") || d.includes("anytime fitness") ||
    d.includes("24 hour fitness") || d.includes("24hr fitness") ||
    d.includes("gold's gym") || d.includes("golds gym") ||
    d.includes("ymca") || d.includes("gym ") ||
    d.includes("yoga") || d.includes("massage") ||
    d.includes("therapy") || d.includes("counseling") ||
    d.includes("physical therapy")
  ) return "Health & Wellness";

  if (
    d.includes("amazon") || d.includes("amzn") || d.includes("target") ||
    d.includes("dollartree") || d.includes("dollar tree") ||
    d.includes("dollar general") || d.includes("family dollar") ||
    d.includes("best buy") || d.includes("home depot") ||
    d.includes("lowe's") || d.includes("lowes") || d.includes("ikea") ||
    d.includes("tj maxx") || d.includes("tjmaxx") ||
    d.includes("marshalls") || d.includes("ross dress") ||
    d.includes("ross store") || d.includes("burlington") ||
    d.includes("old navy") || d.includes("gap ") || d.includes("gap.com") ||
    d.includes("h&m") || d.includes("zara") ||
    d.includes("forever 21") || d.includes("shein") ||
    d.includes("macy") || d.includes("kohl") ||
    d.includes("nordstrom") || d.includes("jcpenney") ||
    d.includes("ace hardware") || d.includes("menards") ||
    d.includes("harbor freight") || d.includes("five below") ||
    d.includes("bath & body") || d.includes("victoria secret") ||
    d.includes("victoria's secret") || d.includes("sephora") ||
    d.includes("ulta") || d.includes("ebay") || d.includes("etsy") ||
    d.includes("wayfair") || d.includes("chewy") ||
    d.includes("zappos") || d.includes("nike.com") ||
    d.includes("adidas") || d.includes("dick's sporting") ||
    d.includes("academy sport") || d.includes("rei ") ||
    d.includes("rei.com") || d.includes("sporting goods")
  ) return "Shopping";

  if (d.includes("insurance") && !d.includes("apts")) return "Insurance";

  if (
    d.includes("directv") || d.includes("dish network") ||
    d.includes("cable tv") || d.includes("satellite tv")
  ) return "Cable/Satellite Services";

  if (d.includes("transfer to checking") || d.includes("xfer to checking"))
    return "To Checking";
  if (
    d.includes("transfer to savings") || d.includes("xfer to savings") ||
    d.includes("to savings")
  ) return "To Savings";

  return null;
}

/* -------------------------------------------------
   DATE HELPERS
-------------------------------------------------- */
function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);

  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [_, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm}`;
  }

  return null;
}

function formatMonthLabel(key) {
  if (key === "all") return "All months";
  const [year, month] = key.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = parseInt(month, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${names[idx]} ${year}`;
}

/* -------------------------------------------------
   COMPONENT
-------------------------------------------------- */
export default function TransactionsPage({
  theme,
  cardClass,
  transactions,
  imports,
  onDeleteImportBatch,
  onAddTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onClearTransactions,
}) {
  const [editing, setEditing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const fileInputRef = useRef(null);
  const getFileSig = (f) => `${f.name}::${f.size}::${f.lastModified}`;

  const importedSigSet = useMemo(() => {
    const set = new Set();
    (imports || []).forEach((b) => {
      (b.files || []).forEach((f) => {
        if (!f) return;
        set.add(`${f.name}::${f.size}::${f.lastModified}`);
      });
    });
    return set;
  }, [imports]);

  /* -----------------------------------------------
     CSV IMPORT (MULTI-FILE) + BATCH META
  -------------------------------------------------- */
  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const bad = files.find((f) => !f.name.toLowerCase().endsWith(".csv"));
    if (bad) {
      setImportMessage("Please choose only .csv files.");
      return;
    }

    const newFiles = files.filter((f) => !importedSigSet.has(getFileSig(f)));
    const dupFiles = files.filter((f) => importedSigSet.has(getFileSig(f)));

    if (!newFiles.length) {
      setImportMessage(
        `Skipped import: all selected CSV(s) were already imported (${dupFiles
          .map((f) => f.name)
          .join(", ")}).`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImportMessage(
      `Reading ${newFiles.length} new file(s)...` +
        (dupFiles.length ? ` (Skipped ${dupFiles.length} duplicate)` : "")
    );

    const allParsed = [];

    for (const file of newFiles) {
      const text = await readFileText(file);
      const parsedRaw = parseCsv(text, transactions.length + allParsed.length);

      const parsed = parsedRaw.map((tx) => {
        const desc = (tx.description || "").toLowerCase();

        // ----- TYPE FIX -----
        // App types are now: income | expense | transfer | credit_card
        // Normalize legacy values to keep old data/imports from breaking,
        // but keep the explicit "credit_card" type (user-selectable)
        let type = tx.type || "expense";
        // Fail-safe: any Payment Thank You should always be a transfer
if (/payment\s*thank\s*you/.test(desc)) {
  type = "transfer";
}

// If Chase/CSV category is Credit Card Payments, treat as transfer (paying card)
if (String(tx.category || "").toLowerCase() === "credit card payments") {
  type = "transfer";
}

        // Normalize legacy values, but keep the explicit "credit_card" type (user-selectable)
        if (type === "payment" || type === "credit") {
          type = "transfer";
        }

        // EPAY and CC-payment-like descriptions should be transfer
        if (
          desc.includes(" epay") ||
          desc.includes("type: epay") ||
          desc.includes("withdrawal ach chase credit crd") ||
          desc.includes("payment thank you")
        ) {
          type = "transfer";
        }

        // ----- CATEGORY LOGIC -----
        // IMPORTANT: if `parseCsv` already provided a category (ex: Chase CSV), keep it.
        let category = tx.category || "";
        const guessed = guessCategory(tx.description);

        // If the CSV didn't provide a real category, try learned memory
        const remembered = lookupRememberedCategory(tx.description);

        if (guessed === "Rent") {
          category = "Rent";
        } else if (!category || category.toLowerCase() === "uncategorized") {
          category = remembered || guessed || "Uncategorized";
        }

        return {
          ...tx,
          type,
          category,
        };
      });

      allParsed.push(...parsed);
    }

    if (!allParsed.length) {
      setImportMessage("No valid rows found in selected CSV files.");
    } else {
      const batchId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const batchMeta = {
        id: batchId,
        importedAt: Date.now(),
        count: allParsed.length,
        files: newFiles.map((f) => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        })),
      };

      onAddTransactions(allParsed, batchMeta);
      setImportMessage(
        `Imported ${allParsed.length} transactions from ${files.length} file(s).`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* -----------------------------------------------
     DRAG/DROP
  -------------------------------------------------- */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  /* -----------------------------------------------
     SORTING + FILTERS
  -------------------------------------------------- */
  const handleSortClick = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || [])
        .map((t) => getMonthKeyFromDate(t.date))
        .filter(Boolean)
    );
    const keys = Array.from(set).sort();
    return ["all", ...keys];
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    let data = [...(transactions || [])];

    // SORT
    if (sortConfig.key === "date") {
      data.sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        return sortConfig.direction === "asc" ? da - db : db - da;
      });
    } else if (sortConfig.key === "type") {
      const order = { income: 0, expense: 1, transfer: 2, credit_card: 2 };
      data.sort((a, b) => {
        const aRank = order[a.type] ?? 99;
        const bRank = order[b.type] ?? 99;
        return sortConfig.direction === "asc" ? aRank - bRank : bRank - aRank;
      });
    }

    // FILTER (month)
    if (selectedMonth !== "all") {
      data = data.filter((t) => getMonthKeyFromDate(t.date) === selectedMonth);
    }

    // FILTER (category)
    if (categoryFilter !== "all") {
      data = data.filter(
        (t) => (t.category || "Uncategorized") === categoryFilter
      );
    }

    return data;
  }, [transactions, sortConfig, categoryFilter, selectedMonth]);

  const renderSortIcon = (key) =>
    sortConfig.key !== key ? (
      <span className="text-[0.6rem] text-gray-500">⇅</span>
    ) : (
      <span className="text-[0.6rem] text-gray-300">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );

  // Display helpers — driven ONLY by stored type
  const typeLabel = (t) => {
    if (t.type === "credit_card") return "Credit Card";
    if (t.type === "income") return "Income";
    if (t.type === "transfer") return "Transfer";
    return "Expense";
  };

  const typeClass = (t) => {
    if (t.type === "credit_card") return "text-yellow-400";
    if (t.type === "income") return "text-green-400";
    if (t.type === "transfer") return "text-blue-400";
    return "text-red-500";
  };

  /* -----------------------------------------------
     RENDER
  -------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">Transactions</h2>
          <p className="text-gray-400 text-sm">
            Upload a bank CSV or click a row to edit it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearTransactions}
          className="text-xs px-4 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      {/* Imported CSV history */}
      {Array.isArray(imports) && imports.length > 0 && (
        <section className={cardClass}>
          <h3 className="mb-3 text-xs font-semibold tracking-[0.28em] text-red-400">
            IMPORT HISTORY
          </h3>

          <div className="space-y-2 text-sm">
            {imports.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-gray-200 truncate">
                    {(b.files || []).map((f) => f.name).join(", ")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(b.importedAt).toLocaleString()} • {b.count}{" "}
                    transactions
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteImportBatch(b.id)}
                  className="shrink-0 text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
                >
                  Delete import
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IMPORT CARD */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 cursor-pointer transition " +
            (isDragging
              ? "border-red-400 bg-red-500/10"
              : "border-red-700 bg-black/40 hover:border-red-500 hover:bg-red-500/5")
          }
        >
          <p className="text-gray-200 font-medium mb-1">
            Drag & drop CSV file(s) here
          </p>
          <p className="text-gray-400">
            or <span className="text-red-300 underline">click to browse</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>

        {importMessage && (
          <p className="text-[0.7rem] text-gray-400 mt-2">{importMessage}</p>
        )}
      </section>

      {/* TABLE CARD */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* Month filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1 text-gray-200"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1 text-gray-200"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {(categoryFilter !== "all" || selectedMonth !== "all") && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSelectedMonth("all");
              }}
              className="text-xs text-gray-400 hover:text-gray-200 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-red-900/60">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortClick("date")}
                    className="flex items-center gap-1 select-none"
                  >
                    <span>Date</span>
                    {renderSortIcon("date")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortClick("type")}
                    className="flex items-center gap-1 select-none"
                  >
                    <span>Type</span>
                    {renderSortIcon("type")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-center font-semibold">Del</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t, i) => (
                <tr
                  key={`${t.id}-${i}`}
                  onClick={() => setEditing(t)}
                  className="cursor-pointer border-b border-gray-800 transition-colors transform hover:bg-[#111111] hover:translate-x-1"
                >
                  <td className="px-4 py-2 text-gray-200">{t.date}</td>
                  <td className="px-4 py-2 text-gray-100">{t.description}</td>

                  <td className={`px-4 py-2 ${typeClass(t)}`}>
                    {typeLabel(t)}
                  </td>

                  {/* Category dropdown */}
                  <td className="px-4 py-2 text-gray-100">
                    <select
                      className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1"
                      value={t.category || "Uncategorized"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        rememberCategory(t.description, nextCat);
                        onUpdateTransaction({
                          ...t,
                          category: nextCat,
                        });
                      }}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-2 text-gray-100">
                    ${(Number(t.amount) || 0).toFixed(2)}
                  </td>

                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(t.id);
                      }}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {sortedTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No transactions yet. Import a CSV to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL EDITOR */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#101010] rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 border border-red-700">
            <h3 className="text-xl font-semibold mb-2 text-gray-100">
              Edit Transaction
            </h3>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Description</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Date</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Type</label>
              <select
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={
                  editing.type === "payment" || editing.type === "credit"
                    ? "transfer"
                    : editing.type
                }
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value })
                }
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Category</label>
              <select
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.category || "Uncategorized"}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Amount</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.amount}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded bg-gray-800 text-gray-100 hover:bg-gray-700"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
                onClick={() => {
                  const normalizedType =
                    editing.type === "payment" || editing.type === "credit"
                      ? "transfer"
                      : editing.type;

                  const toSave = {
                    ...editing,
                    type: normalizedType,
                    category:
                      editing.category ||
                      guessCategory(editing.description) ||
                      "Uncategorized",
                  };
                  rememberCategory(toSave.description, toSave.category);
                  onUpdateTransaction(toSave);
                  setEditing(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}