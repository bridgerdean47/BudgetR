// src/lib/csv.js

// basic CSV line splitter that handles quotes
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function normalizeDate(str) {
  if (!str) return "";

  // Already ISO format with dashes (YYYY-MM-DD) — return as-is
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // YYYY/MM/DD or YYYY/M/D — convert slashes to dashes
  const isoSlash = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (isoSlash) {
    const [, yy, mm, dd] = isoSlash;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // MM/DD/YYYY or M/D/YY
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    dd = dd.padStart(2, "0");
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`;
  }

  return str;
}

function parseAmount(str) {
  if (!str) return NaN;
  const cleaned = str.replace(/[$,]/g, "").trim();
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
}

// ⭐ CENTRALIZED CATEGORY GUESSING - this is the ONLY place categories are assigned
function guessCategory(desc = "") {
  if (!desc) return "Uncategorized";

  // Strip common bank description prefixes so merchant matching works on any bank format
  // e.g. "POS PURCHASE WALMART #1234" → "walmart #1234"
  const d = desc
    .toLowerCase()
    .replace(
      /^(pos purchase|pos debit|debit card purchase|check card purchase|ach debit|ach credit|ach payment|online transfer|electronic payment|preauthorized debit|preauthorized credit|recurring payment|bill payment|web payment|phone payment|teller|atm withdrawal|atm deposit|mobile deposit|mobile check deposit|wire transfer|direct debit|direct deposit|point of sale purchase|debit|credit)\s*/i,
      ""
    )
    .trim();

  // 🏠 RENT - HIGHEST PRIORITY (check first!)
  if (
    d.includes("apts anderson") ||
    d.includes("apts ander") ||
    d.includes("ach apts") ||
    d.includes("withdrawal ach apts") ||
    d.includes("apartment") ||
    d.includes(" apts ") ||
    d.startsWith("apts ") ||
    d.includes(" rent") ||
    d.startsWith("rent") ||
    d.includes("lease") ||
    d.includes("property mgmt") ||
    d.includes("property management") ||
    d.includes("realty") ||
    d.includes("landlord")
  ) {
    return "Rent";
  }

  // 💳 CREDIT CARD PAYMENTS - BEFORE other checks
  if (
    d.includes("chase credit crd") ||
    d.includes("chase credit card") ||
    d.includes("credit card payment") ||
    d.includes("cc payment") ||
    d.includes("payment thank you") ||
    d.includes("autopay payment") ||
    d.includes("citi card") ||
    d.includes("capital one") ||
    d.includes("discover card") ||
    d.includes("amex payment") ||
    d.includes("american express payment") ||
    d.includes("synchrony bank") ||
    d.includes("barclays")
  ) {
    return "Credit Card Payments";
  }

  // 💰 LOANS
  if (
    d.includes("dept education") ||
    d.includes("dept of ed") ||
    d.includes("dept. of ed") ||
    d.includes("student loan") ||
    d.includes("loan payment") ||
    d.includes("nelnet") ||
    d.includes("navient") ||
    d.includes("mohela") ||
    d.includes("sallie mae") ||
    d.includes("great lakes") ||
    d.includes("auto loan") ||
    d.includes("car loan") ||
    d.includes("mortgage payment") ||
    /\bmortgage\b/.test(d)
  ) {
    return "Loans";
  }

  // 🔌 BILLS & UTILITIES
  if (
    d.includes("quantum fiber") ||
    d.includes("xfinity") ||
    d.includes("comcast") ||
    d.includes("cox comm") ||
    d.includes("spectrum") ||
    d.includes("at&t") ||
    d.includes("att.com") ||
    d.includes("verizon") ||
    d.includes("t-mobile") ||
    d.includes("tmobile") ||
    d.includes("sprint") ||
    d.includes("boost mobile") ||
    d.includes("cricket wireless") ||
    d.includes("metro pcs") ||
    d.includes("metropcs") ||
    d.includes("internet") ||
    d.includes("power company") ||
    d.includes("electric") ||
    d.includes("water bill") ||
    d.includes("water dept") ||
    d.includes("gas & electric") ||
    d.includes("pge") ||
    d.includes("pg&e") ||
    d.includes("rocky mountain power") ||
    d.includes("pacific power") ||
    d.includes("idaho power") ||
    d.includes("utility") ||
    d.includes("utilities") ||
    d.includes("waste management") ||
    d.includes("republic services") ||
    d.includes("sewage") ||
    d.includes("garbage") ||
    d.includes("trash pickup") ||
    /\bxcel energy\b/.test(d) ||
    /\bduke energy\b/.test(d) ||
    /\bsouthern company\b/.test(d)
  ) {
    return "Bills & Utilities";
  }

  // 🛒 GROCERIES
  if (
    d.includes("walmart") ||
    d.includes("wal-mart") ||
    d.includes("wal mart") ||
    d.includes("winco") ||
    d.includes("grocery") ||
    d.includes("groceries") ||
    d.includes("safeway") ||
    d.includes("kroger") ||
    d.includes("albertsons") ||
    d.includes("fred meyer") ||
    d.includes("smiths food") ||
    d.includes("smith's") ||
    d.includes("smiths #") ||
    d.includes("harmons") ||
    d.includes("trader joe") ||
    d.includes("whole foods") ||
    d.includes("sprouts") ||
    d.includes("aldi") ||
    d.includes("publix") ||
    d.includes("h-e-b") ||
    d.includes("heb ") ||
    d.includes("meijer") ||
    d.includes("wegmans") ||
    d.includes("food lion") ||
    d.includes("giant food") ||
    d.includes("stop & shop") ||
    d.includes("stop and shop") ||
    d.includes("hy-vee") ||
    d.includes("hyvee") ||
    d.includes("food 4 less") ||
    d.includes("grocery outlet") ||
    d.includes("market basket") ||
    d.includes("fresh market") ||
    d.includes("natural grocers") ||
    d.includes("costco") ||
    d.includes("sam's club") ||
    d.includes("bj's wholesale") ||
    d.includes("supermarket")
  ) {
    return "Groceries";
  }

  // 🍔 FOOD & DRINK
  if (
    d.includes("mcdonald") ||
    d.includes("taco bell") ||
    d.includes("burger king") ||
    d.includes("wendy") ||
    d.includes("subway") ||
    d.includes("restaurant") ||
    d.includes("cafe") ||
    d.includes("coffee") ||
    d.includes("pizza") ||
    d.includes("starbucks") ||
    d.includes("dunkin") ||
    d.includes("chipotle") ||
    d.includes("panera") ||
    d.includes("chick-fil-a") ||
    d.includes("chick fil a") ||
    d.includes("chickfila") ||
    d.includes("popeye") ||
    d.includes("kfc") ||
    d.includes("domino") ||
    d.includes("papa john") ||
    d.includes("little caesars") ||
    d.includes("pizza hut") ||
    d.includes("five guys") ||
    d.includes("in-n-out") ||
    d.includes("in n out") ||
    d.includes("whataburger") ||
    d.includes("sonic drive") ||
    d.includes("sonic #") ||
    d.includes("dairy queen") ||
    d.includes("arby") ||
    d.includes("panda express") ||
    d.includes("olive garden") ||
    d.includes("applebee") ||
    d.includes("chili") ||
    d.includes("denny") ||
    d.includes("ihop") ||
    d.includes("waffle house") ||
    d.includes("cracker barrel") ||
    d.includes("cheesecake factory") ||
    d.includes("red lobster") ||
    d.includes("outback") ||
    d.includes("sushi") ||
    d.includes("donut") ||
    d.includes("doughnut") ||
    d.includes("smoothie") ||
    d.includes("jamba juice") ||
    d.includes("dutch bros") ||
    d.includes("portillo") ||
    d.includes("shake shack") ||
    d.includes("wingstop") ||
    d.includes("raising cane") ||
    d.includes("jersey mike") ||
    d.includes("jimmy john") ||
    d.includes("firehouse sub") ||
    d.includes("noodle") ||
    d.includes("deli") ||
    d.includes("bakery") ||
    d.includes("bar & grill") ||
    d.includes("grille") ||
    d.includes("bistro") ||
    d.includes("tavern") ||
    d.includes("brewing") ||
    d.includes("brewery") ||
    d.includes("winery") ||
    d.includes("doordash") ||
    d.includes("grubhub") ||
    d.includes("ubereats") ||
    d.includes("uber eats") ||
    d.includes("instacart")
  ) {
    return "Food & Drink";
  }

  // ⛽ GAS
  if (
    d.includes("shell") ||
    d.includes("chevron") ||
    d.includes("gas station") ||
    d.includes("exxon") ||
    d.includes("mobil") ||
    d.includes("bp gas") ||
    d.includes("bp #") ||
    d.includes("sinclair") ||
    d.includes("conoco") ||
    d.includes("texaco") ||
    d.includes("valero") ||
    d.includes("marathon") ||
    d.includes("sunoco") ||
    d.includes("circle k") ||
    d.includes("kwik trip") ||
    d.includes("kwik star") ||
    d.includes("casey") ||
    d.includes("murphy usa") ||
    d.includes("murphy express") ||
    d.includes("76 gas") ||
    d.includes("arco") ||
    d.includes("love's travel") ||
    d.includes("pilot flying") ||
    d.includes("flying j") ||
    d.includes("speedway") ||
    d.includes("raceway fuel") ||
    d.includes("holiday station") ||
    d.includes("fuel station") ||
    /\bgas\s*#\s*\d/.test(d)
  ) {
    return "Gas";
  }

  // 🎬 ENTERTAINMENT
  if (
    d.includes("spotify") ||
    d.includes("netflix") ||
    d.includes("hulu") ||
    d.includes("youtube") ||
    d.includes("youtube premium") ||
    d.includes("disney+") ||
    d.includes("disney plus") ||
    d.includes("disneyplus") ||
    d.includes("hbo") ||
    d.includes("paramount") ||
    d.includes("peacock") ||
    d.includes("fubo") ||
    d.includes("espn+") ||
    d.includes("espn plus") ||
    d.includes("apple tv") ||
    d.includes("apple music") ||
    d.includes("apple one") ||
    d.includes("amazon prime") ||
    d.includes("amazon music") ||
    d.includes("pandora") ||
    d.includes("tidal") ||
    d.includes("siriusxm") ||
    d.includes("sirius xm") ||
    d.includes("xbox game pass") ||
    d.includes("playstation") ||
    d.includes("nintendo") ||
    d.includes("steam ") ||
    d.includes("steam.com") ||
    d.includes("twitch") ||
    d.includes("regal cinema") ||
    d.includes("amc theatr") ||
    d.includes("movie theater") ||
    d.includes("cinemark") ||
    d.includes("fandango") ||
    d.includes("ticketmaster") ||
    d.includes("livenation") ||
    d.includes("live nation") ||
    d.includes("bowling") ||
    d.includes("golf") ||
    d.includes("mini golf") ||
    d.includes("laser tag") ||
    d.includes("escape room")
  ) {
    return "Entertainment";
  }

  // 🚗 AUTOMOTIVE
  if (
    d.includes("autozone") ||
    d.includes("o'reilly auto") ||
    d.includes("oreilly auto") ||
    d.includes("advance auto") ||
    d.includes("napa auto") ||
    d.includes("jiffy lube") ||
    d.includes("valvoline") ||
    d.includes("firestone") ||
    d.includes("pep boys") ||
    d.includes("goodyear") ||
    d.includes("discount tire") ||
    d.includes("les schwab") ||
    d.includes("midas") ||
    d.includes("meineke") ||
    d.includes("safelite") ||
    d.includes("car wash") ||
    d.includes("carwash") ||
    d.includes("auto repair") ||
    d.includes("auto service") ||
    d.includes("oil change") ||
    d.includes("tire center") ||
    d.includes("vehicle registration") ||
    d.includes("dmv ") ||
    /\bdmv\b/.test(d)
  ) {
    return "Automotive";
  }

  // ✈️ TRAVEL
  if (
    d.includes("flight") ||
    d.includes("hotel") ||
    d.includes("airbnb") ||
    d.includes("airline") ||
    d.includes("southwest air") ||
    d.includes("delta air") ||
    d.includes("united air") ||
    d.includes("american air") ||
    d.includes("alaska air") ||
    d.includes("frontier air") ||
    d.includes("spirit air") ||
    d.includes("jetblue") ||
    d.includes("allegiant") ||
    d.includes("marriott") ||
    d.includes("hilton") ||
    d.includes("hyatt") ||
    d.includes("holiday inn") ||
    d.includes("best western") ||
    d.includes("hampton inn") ||
    d.includes("motel 6") ||
    d.includes("super 8") ||
    d.includes("vrbo") ||
    d.includes("expedia") ||
    d.includes("booking.com") ||
    d.includes("priceline") ||
    d.includes("kayak") ||
    d.includes("hertz") ||
    d.includes("enterprise rent") ||
    d.includes("avis rent") ||
    d.includes("budget rent") ||
    d.includes("national car") ||
    d.includes("alamo rent") ||
    d.includes("uber") ||
    d.includes("lyft") ||
    d.includes("taxi") ||
    d.includes("train ticket") ||
    d.includes("amtrak") ||
    d.includes("greyhound") ||
    d.includes("parking meter") ||
    d.includes("toll road") ||
    /\btoll\b/.test(d)
  ) {
    return "Travel";
  }

  // 🐾 PETS
  if (
    d.includes("petco") ||
    d.includes("petsmart") ||
    d.includes("pet supplies") ||
    d.includes("pet store") ||
    d.includes("veterinary") ||
    d.includes("animal hospital") ||
    d.includes("animal clinic") ||
    d.includes("pet ") ||
    d.includes(" vet")
  ) {
    return "Pets";
  }

  // 🏥 HEALTH & WELLNESS
  if (
    d.includes("cvs") ||
    d.includes("walgreens") ||
    d.includes("rite aid") ||
    d.includes("pharmacy") ||
    d.includes("prescription") ||
    d.includes("rx ") ||
    d.includes("doctor") ||
    d.includes("dentist") ||
    d.includes("dental") ||
    d.includes("orthodon") ||
    d.includes("vision") ||
    d.includes("optometry") ||
    d.includes("optometrist") ||
    d.includes("hospital") ||
    d.includes("medical center") ||
    d.includes("urgent care") ||
    d.includes("clinic") ||
    d.includes("health plan") ||
    d.includes("planet fitness") ||
    d.includes("la fitness") ||
    d.includes("anytime fitness") ||
    d.includes("24 hour fitness") ||
    d.includes("24hr fitness") ||
    d.includes("gold's gym") ||
    d.includes("golds gym") ||
    d.includes("ymca") ||
    d.includes("gym ") ||
    d.includes("yoga") ||
    d.includes("massage") ||
    d.includes("therapy") ||
    d.includes("counseling") ||
    d.includes("physical therapy")
  ) {
    return "Health & Wellness";
  }

  // 🛍️ SHOPPING
  if (
    d.includes("amazon") ||
    d.includes("amzn") ||
    d.includes("target") ||
    d.includes("dollartree") ||
    d.includes("dollar tree") ||
    d.includes("dollar general") ||
    d.includes("family dollar") ||
    d.includes("best buy") ||
    d.includes("home depot") ||
    d.includes("lowe's") ||
    d.includes("lowes") ||
    d.includes("ikea") ||
    d.includes("tj maxx") ||
    d.includes("tjmaxx") ||
    d.includes("marshalls") ||
    d.includes("ross dress") ||
    d.includes("ross store") ||
    d.includes("burlington") ||
    d.includes("old navy") ||
    d.includes("gap ") ||
    d.includes("gap.com") ||
    d.includes("h&m") ||
    d.includes("zara") ||
    d.includes("forever 21") ||
    d.includes("fashion nova") ||
    d.includes("shein") ||
    d.includes("macy") ||
    d.includes("kohl") ||
    d.includes("nordstrom") ||
    d.includes("jcpenney") ||
    d.includes("sears") ||
    d.includes("ace hardware") ||
    d.includes("menards") ||
    d.includes("harbor freight") ||
    d.includes("five below") ||
    d.includes("bath & body") ||
    d.includes("victoria secret") ||
    d.includes("victoria's secret") ||
    d.includes("sephora") ||
    d.includes("ulta") ||
    d.includes("ebay") ||
    d.includes("etsy") ||
    d.includes("wayfair") ||
    d.includes("overstock") ||
    d.includes("chewy") ||
    d.includes("zappos") ||
    d.includes("nike.com") ||
    d.includes("adidas") ||
    d.includes("dick's sporting") ||
    d.includes("academy sport") ||
    d.includes("rei ") ||
    d.includes("rei.com") ||
    d.includes("sporting goods")
  ) {
    return "Shopping";
  }

  // 🏥 INSURANCE (check near last to avoid false positives)
  if (d.includes("insurance") && !d.includes("apts")) {
    return "Insurance";
  }

  // 📡 CABLE/SATELLITE
  if (
    d.includes("directv") ||
    d.includes("dish network") ||
    d.includes("cable tv") ||
    d.includes("satellite tv")
  ) {
    return "Cable/Satellite Services";
  }

  // 💸 TRANSFERS TO CHECKING/SAVINGS
  if (d.includes("transfer to checking") || d.includes("xfer to checking")) {
    return "To Checking";
  }
  if (
    d.includes("transfer to savings") ||
    d.includes("xfer to savings") ||
    d.includes("to savings")
  ) {
    return "To Savings";
  }

  return "Uncategorized";
}

// Helper: determine EPAY transfer-like descriptions
function isEpayTransfer(descLower = "") {
  return (
    descLower.includes("type: epay") ||
    descLower.includes(" epay") ||
    descLower.includes("withdrawal ach chase credit crd")
  );
}

// Map Chase CSV categories into the app's CATEGORY_OPTIONS (keep unknowns as-is)
function normalizeChaseCategory(cat = "") {
  const c = String(cat || "").trim();
  if (!c) return "";

  const k = c.toLowerCase();

  const map = {
    restaurants: "Food & Drink",
    dining: "Food & Drink",
    "food & drink": "Food & Drink",
    groceries: "Groceries",
    gas: "Gas",
    travel: "Travel",
    shopping: "Shopping",
    entertainment: "Entertainment",
    "health & wellness": "Health & Wellness",
    pets: "Pets",
    insurance: "Insurance",
    "bills & utilities": "Bills & Utilities",
    utilities: "Bills & Utilities",
    "credit card payments": "Credit Card Payments",
    payment: "Credit Card Payments",
  };

  return map[k] || c; // keep unknown categories as-is
}

export function parseCsv(text, startId = 0) {
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());

  // Detect formats
  const isChase =
    headerCells.includes("transaction date") &&
    headerCells.includes("description") &&
    headerCells.includes("category") &&
    headerCells.includes("amount");

  const isFcu =
    headerCells.includes("account id") &&
    headerCells.includes("transaction id") &&
    headerCells.includes("date") &&
    headerCells.includes("description") &&
    headerCells.includes("amount");

  const isIccu =
    headerCells.includes("posting date") &&
    headerCells.includes("description") &&
    headerCells.includes("transaction category") &&
    headerCells.includes("amount");

  const isTypeDescAmountDate =
    headerCells[0] === "type" &&
    headerCells[1] === "description" &&
    headerCells[2] === "amount";

  const isDateDescAmount =
    headerCells[0] === "date" &&
    headerCells[1] === "description" &&
    headerCells[2] === "amount";

  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = splitCsvLine(line);

    const get = (name) => {
      const idx = headerCells.indexOf(name);
      if (idx === -1) return "";
      return (cells[idx] ?? "").trim();
    };

    /* ---------- Chase credit card ---------- */
    if (isChase) {
      const rawDate = get("transaction date") || get("post date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = (desc || "").toLowerCase();

      // Use the category pre-selected by Chase when available
      const csvCategory = (get("category") || "").trim();
      const normalizedCsvCategory = normalizeChaseCategory(csvCategory);

      // New rule:
      // - Chase *charges* => type "credit_card" (shows as Credit Card and totals on dashboard)
      // - Chase *payments/credits* => type "transfer" (ex: Payment Thank You / positive amount)
      const isPaymentLike =
  /payment\s*thank\s*you/.test(lowerDesc) ||
  normalizedCsvCategory.toLowerCase() === "credit card payments" ||
  rawAmount > 0;

      const type = isPaymentLike ? "transfer" : "credit_card";

      const category =
        normalizedCsvCategory && normalizedCsvCategory.toLowerCase() !== "uncategorized"
          ? normalizedCsvCategory
          : guessCategory(desc);

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category,
        source: "chase",
      });
      continue;
    }

    /* ---------- FCU (Money Market / Checking) ---------- */
    if (isFcu) {
      const rawDate = get("date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = (desc || "").toLowerCase();
      const lowerCat = (get("category") || "").toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) {
        type = "transfer";
      } else if (
        lowerDesc.includes("payment thank you") ||
        lowerDesc.includes("credit card payment") ||
        lowerDesc.includes("cc payment") ||
        lowerDesc.includes("chase credit crd") ||
        lowerDesc.includes("credit card")
      ) {
        type = "transfer";
      } else if (rawAmount > 0) {
        type = lowerCat.includes("transfer") || lowerDesc.includes("transfer") ? "transfer" : "income";
      } else {
        type = lowerCat.includes("transfer") || lowerDesc.includes("transfer") ? "transfer" : "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "fcu",
      });
      continue;
    }

    /* ---------- ICCU ---------- */
    if (isIccu) {
      const rawDate = get("posting date") || get("effective date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const transType = (get("transaction type") || "").toLowerCase();
      const typeField = (get("type") || "").toLowerCase();
      const lowerDesc = (desc || "").toLowerCase();
      const lowerCat = (get("transaction category") || "").toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) {
        type = "transfer";
      } else if (transType.includes("deposit") || typeField.includes("deposit") || rawAmount > 0) {
        type = "income";
      } else if (lowerCat.includes("transfer") || transType.includes("transfer") || lowerDesc.includes("transfer")) {
        type = "transfer";
      } else {
        type = "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "iccu",
      });
      continue;
    }

    /* ---------- Generic: Type, Description, Amount, Date ---------- */
    if (isTypeDescAmountDate) {
      const typeRaw = (cells[0]?.trim() || "").toLowerCase();
      const desc = cells[1]?.trim() || "";
      const rawAmount = parseAmount(cells[2] || "");
      const dateStr = cells[3]?.trim() || "";
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = desc.toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) type = "transfer";
      else if (typeRaw === "income") type = "income";
      else if (typeRaw === "payment") type = "transfer";
      else if (typeRaw === "transfer") type = "transfer";
      else if (rawAmount > 0) type = "income";

      if (lowerDesc.includes("payment thank you")) {
        type = "transfer";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "generic",
      });
      continue;
    }

    /* ---------- Generic: Date, Description, Amount ---------- */
    if (isDateDescAmount) {
      const dateStr = cells[0]?.trim() || "";
      const desc = cells[1]?.trim() || "";
      const amountStr = (cells[2] || "").replace(/,/g, "");
      const rawAmount = parseFloat(amountStr);
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const d = desc.toLowerCase();

      let type;
      if (isEpayTransfer(d)) {
        type = "transfer";
      } else if (
        d.includes("payment thank you") ||
        d.includes("credit card payment") ||
        d.includes("cc payment") ||
        d.includes("chase credit crd")
      ) {
        type = "transfer";
      } else {
        type = rawAmount > 0 ? "income" : "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "generic",
      });
      continue;
    }

    /* ---------- Flexible fallback: find columns by name ---------- */
    // Handles any CSV that has date/description/amount columns in any position
    {
      const dateIdx = headerCells.findIndex((h) =>
        /^(date|transaction\s*date|posting\s*date|trans\s*date|effective\s*date)$/.test(h)
      );
      const descIdx = headerCells.findIndex((h) =>
        /^(description|desc|memo|name|payee|merchant|narrative|details|transaction\s*description)$/.test(h)
      );
      const amountIdx = headerCells.findIndex((h) =>
        /^(amount|transaction\s*amount|debit\/credit|value)$/.test(h)
      );

      // Also try separate debit/credit columns as a fallback for amount
      const debitIdx = headerCells.findIndex((h) => /^(debit|withdrawal|withdrawals)$/.test(h));
      const creditIdx = headerCells.findIndex((h) => /^(credit|deposit|deposits)$/.test(h));

      const hasAmount = amountIdx !== -1 || (debitIdx !== -1 || creditIdx !== -1);

      if (dateIdx !== -1 && descIdx !== -1 && hasAmount) {
        const dateStr = (cells[dateIdx] ?? "").trim();
        const desc = (cells[descIdx] ?? "").trim();

        let rawAmount;
        if (amountIdx !== -1) {
          rawAmount = parseAmount(cells[amountIdx] || "");
        } else {
          // Separate debit/credit columns — debits are outflows (negative), credits are inflows (positive)
          const debitVal = debitIdx !== -1 ? parseAmount(cells[debitIdx] || "") : NaN;
          const creditVal = creditIdx !== -1 ? parseAmount(cells[creditIdx] || "") : NaN;
          if (isFinite(creditVal) && creditVal !== 0) {
            rawAmount = creditVal;
          } else if (isFinite(debitVal) && debitVal !== 0) {
            rawAmount = -Math.abs(debitVal);
          } else {
            rawAmount = NaN;
          }
        }

        if (!isFinite(rawAmount) || rawAmount === 0) continue;

        const d = desc.toLowerCase();
        let type;
        if (isEpayTransfer(d)) {
          type = "transfer";
        } else if (
          d.includes("payment thank you") ||
          d.includes("credit card payment") ||
          d.includes("cc payment") ||
          d.includes("chase credit crd")
        ) {
          type = "transfer";
        } else {
          type = rawAmount > 0 ? "income" : "expense";
        }

        out.push({
          id: startId + out.length,
          date: normalizeDate(dateStr),
          description: desc,
          amount: Math.abs(rawAmount),
          type,
          category: guessCategory(desc),
          source: "generic",
        });
        continue;
      }
    }
  }

  return out;
}