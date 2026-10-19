const STORAGE_KEY = "lifeexpiry-products";
const RECIPE_CHECKLIST_KEY = "lifeexpiry-recipe-checklists";
const SOON_DAYS = 3;

const modal = document.getElementById("product-modal");
const form = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const errorMessage = document.getElementById("form-error");

let products = loadProducts();
let editingProductId = null;

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved
      .filter(p =>
        p &&
        typeof p.name === "string" &&
        typeof p.category === "string" &&
        typeof p.quantity === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(p.expiry)
      )
      .map(p => ({
        ...p,
        id: typeof p.id === "string"
          ? p.id
          : crypto.randomUUID()
      }));
  } catch (error) {
    console.error("Could not load products:", error);
    return [];
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch {
    alert("Could not save your inventory. Please check browser storage.");
    return false;
  }
}

function getDaysLeft(expiry) {
  const [year, month, day] = expiry.split("-").map(Number);
  const expiryDate = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(
    now.getFullYear(), now.getMonth(), now.getDate()
  );

  return Math.round((expiryDate - today) / 86400000);
}

function getStatus(product) {
  const days = getDaysLeft(product.expiry);

  if (days < 0) return { label: "Past expiry date", type: "expired" };
  if (days <= SOON_DAYS) return { label: "Expiring soon", type: "soon" };

  return { label: "Within date", type: "safe" };
}

function openModal(productId = null) {
  form.reset();
  errorMessage.textContent = "";
  editingProductId = productId;

  const product = products.find(p => p.id === productId);

  document.getElementById("modal-title").textContent =
    product ? "Edit product" : "Add a product";

  form.querySelector('button[type="submit"]').textContent =
    product ? "Save Changes" : "Save Product";

  if (product) {
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-quantity").value = product.quantity;
    document.getElementById("product-expiry").value = product.expiry;
  } else {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    document.getElementById("product-expiry").value =
      `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}`;
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("product-name").focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

document.getElementById("add-product-btn").addEventListener("click", openModal);
document.getElementById("empty-add-btn").addEventListener("click", openModal);
document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-modal-btn").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const category = String(data.get("category"));
  const quantity = String(data.get("quantity")).trim();
  const expiry = String(data.get("expiry"));

  if (!name || !quantity || !expiry) {
    errorMessage.textContent = "Please complete all fields.";
    return;
  }

  
const dateParts = expiry.split("-").map(Number);

if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) {
  errorMessage.textContent = "Please enter a valid date.";
  return;
}

const [year, month, day] = dateParts;
const parsedDate = new Date(year, month - 1, day);

if (
  parsedDate.getFullYear() !== year ||
  parsedDate.getMonth() !== month - 1 ||
  parsedDate.getDate() !== day
) {
  errorMessage.textContent = "Please enter a valid date.";
  return;
}

const existingIndex = products.findIndex(
  p => p.id === editingProductId
);

const product = {
  id: editingProductId || crypto.randomUUID(),
  name,
  category,
  quantity,
  expiry
};

const previousProducts = [...products];

if (existingIndex >= 0) {
  products[existingIndex] = product;
} else {
  products.push(product);
}

if (!saveProducts()) {
  products = previousProducts;
  return;
}

  renderProducts();
  closeModal();
});


function renderExpiryAlerts() {
  const alertsList = document.getElementById("alerts-list");
  const alertCount = document.getElementById("alert-count");
  if (!alertsList || !alertCount) return;
  const urgentProducts = products
    .map(product => ({
      product,
      days: getDaysLeft(product.expiry)
    }))
    .filter(item => item.days <= SOON_DAYS)
    .sort((a, b) => a.days - b.days);

  alertCount.textContent =
    `${urgentProducts.length} alert${urgentProducts.length === 1 ? "" : "s"}`;

  alertsList.replaceChildren();

  if (urgentProducts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "alert-empty";
    empty.textContent = "You're all caught up! 🌿";
    alertsList.append(empty);
    return;
  }

  urgentProducts.forEach(({ product, days }) => {
    const expired = days < 0;

    const item = document.createElement("article");
    item.className = `alert-item${expired ? " expired" : ""}`;

    const symbol = document.createElement("span");
    symbol.className = "alert-symbol";
    symbol.textContent = expired ? "⚠️" : "⏳";

    const info = document.createElement("div");
    info.className = "alert-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = `${product.category} · ${product.quantity}`;

    const status = document.createElement("span");
    status.className = "alert-status";

    if (days < 0) {
      status.textContent = `${Math.abs(days)} day(s) past date`;
    } else if (days === 0) {
      status.textContent = "Expires today";
    } else {
      status.textContent = `${days} day(s) left`;
    }

    info.append(name, description);
    item.append(symbol, info, status);
    alertsList.append(item);
  });
}


function renderUseFirst() {
  const list = document.getElementById("use-first-list");
  const count = document.getElementById("use-first-count");

  // Include products expiring within 3 days and past-date products.
  // This list uses the complete inventory, not the search filter.
  const priorityProducts = products
    .map(product => ({
      product,
      days: getDaysLeft(product.expiry)
    }))
    .filter(item => item.days <= SOON_DAYS)
    .sort((a, b) =>
      a.days - b.days ||
      a.product.name.localeCompare(b.product.name)
    );

  count.textContent =
    `${priorityProducts.length} item${priorityProducts.length === 1 ? "" : "s"}`;

  list.replaceChildren();

  if (priorityProducts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "use-first-empty";
    empty.textContent = "Nothing needs your attention right now. 🌿";
    list.append(empty);
    return;
  }

  priorityProducts.forEach(({ product, days }) => {
    const status = getStatus(product);

    const item = document.createElement("article");
    item.className = "use-first-item";

    if (days < 0) {
      item.classList.add("expired");
    } else if (days <= SOON_DAYS) {
      item.classList.add("urgent");
    }

    const icon = document.createElement("span");
    icon.className = "use-first-icon";
    icon.textContent =
      days < 0 ? "⚠️" :
      days === 0 ? "📅" :
      product.category === "Food" ? "🥬" : "📦";

    const details = document.createElement("div");
    details.className = "use-first-details";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const info = document.createElement("p");
    info.textContent = `${product.category} · ${product.quantity}`;

    const date = document.createElement("p");
    date.className = "priority-date";

    date.textContent =
      days < 0 ? `${Math.abs(days)} day(s) past expiry` :
      days === 0 ? "Expires today" :
      `${days} day(s) left`;

    const actions = document.createElement("div");
    actions.className = "use-first-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(product.id));

    const used = document.createElement("button");
    used.type = "button";
    used.className = "used-button";
    used.textContent = "Mark as Used";

    used.addEventListener("click", () => {
      if (!confirm(`Mark ${product.name} as used and remove it from inventory?`)) {
        return;
      }

      const previousProducts = products;
      products = products.filter(p => p.id !== product.id);

      if (!saveProducts()) {
        products = previousProducts;
        return;
      }

      renderProducts();
    });

    details.append(name, info, date);
    actions.append(edit, used);
    item.append(icon, details, actions);
    list.append(item);
  });
}

const recipeData = [
  {
    id: "spinach-omelette",
    name: "Spinach Omelette",
    image: "assets/images/spinach-omelette.jpg",
    cuisine: "international",
    time: 15,
    emoji: "🍳",
    ingredients: ["egg", "spinach", "onion"],
    instructions: [
      "Wash and chop the spinach and onion.",
      "Beat the eggs and mix in the vegetables.",
      "Cook in a lightly oiled pan until the eggs are fully set."
    ]
  },
  {
    id: "veg-fried-rice",
    name: "Vegetable Fried Rice",
    image: "assets/images/veg-fried-rice.jpg",
    cuisine: "indian",
    time: 20,
    emoji: "🍚",
    ingredients: ["rice", "carrot", "peas", "onion"],
    instructions: [
      "Use cooked rice that has been stored safely.",
      "Cook the chopped vegetables and onion in a pan.",
      "Add the rice and season to taste. Heat thoroughly."
    ]
  },
  {
    id: "tomato-pasta",
    name: "Tomato Pasta",
    image: "assets/images/tomato-pasta.jpg",
    cuisine: "international",
    time: 20,
    emoji: "🍝",
    ingredients: ["pasta", "tomato", "onion", "cheese"],
    instructions: [
      "Boil the pasta according to its package instructions.",
      "Cook chopped tomatoes and onion into a simple sauce.",
      "Mix with the pasta and top with cheese."
    ]
  },
  {
    id: "paneer-bhurji",
    name: "Paneer Bhurji",
    image: "assets/images/paneer-bhurji.jpg",
    cuisine: "indian",
    time: 15,
    emoji: "🧀",
    ingredients: ["paneer", "tomato", "onion", "capsicum"],
    instructions: [
      "Crumble the paneer and chop the vegetables.",
      "Cook onion, tomato, and capsicum with your preferred spices.",
      "Add paneer and cook until heated through."
    ]
  },
  {
    id: "banana-oats",
    name: "Banana Oat Bowl",
    image: "assets/images/banana-oats.jpg",
    cuisine: "international",
    time: 10,
    emoji: "🥣",
    ingredients: ["banana", "oats", "milk"],
    instructions: [
      "Cook the oats with milk according to the package instructions.",
      "Slice the banana.",
      "Serve the oats topped with banana."
    ]
  },
  {
    id: "aloo-paratha",
    name: "Aloo Paratha",
    image: "assets/images/aloo-paratha.jpg",
    cuisine: "indian",
    time: 30,
    emoji: "🫓",
    ingredients: ["potato", "flour", "onion"],
    instructions: [
      "Boil the potatoes and mash them with chopped onion and spices.",
      "Prepare a dough using flour and water.",
      "Fill, roll, and cook the parathas thoroughly on a hot pan."
    ]
  },
  {
    id: "spinach-sandwich",
    name: "Spinach Cheese Sandwich",
    image: "assets/images/spinach-sandwich.jpg",
    cuisine: "international",
    time: 10,
    emoji: "🥪",
    ingredients: ["bread", "spinach", "cheese", "tomato"],
    instructions: [
      "Wash and prepare the spinach and tomato.",
      "Layer the vegetables and cheese between slices of bread.",
      "Toast until golden and the cheese is melted."
    ]
  },
  {
    id: "poha",
    name: "Vegetable Poha",
    image: "assets/images/poha.jpg",
    cuisine: "indian",
    time: 15,
    emoji: "🍋",
    ingredients: ["poha", "onion", "potato", "peas"],
    instructions: [
      "Rinse the poha briefly and drain.",
      "Cook the onion, potato, and peas until tender.",
      "Add poha and seasoning, then cook until heated through."
    ]
  }
];

function normalizeIngredient(value) {
  let word = value.toLowerCase().trim();

  word = word.replace(/\s+/g, " ");

  const aliases = {
    tomatoes: "tomato",
    potatoes: "potato",
    onions: "onion",
    eggs: "egg",
    bananas: "banana",
    carrots: "carrot",
    peas: "pea",
    spinach: "spinach",
    oats: "oat",
    "rolled oats": "oat",
    "green peas": "pea",
    "bell pepper": "capsicum",
    "bell peppers": "capsicum",
    "green pepper": "capsicum",
    "chickpeas": "chickpea"
  };

  return aliases[word] || word;
}

function getAvailableFood() {
  return products
    .filter(product => product.category === "Food")
    .map(product => ({
      ...product,
      ingredient: normalizeIngredient(product.name),
      days: getDaysLeft(product.expiry)
    }));
}

function renderRecipes() {
  const list = document.getElementById("recipe-list");
  const summary = document.getElementById("recipe-summary");
  const filter = document.getElementById("recipe-filter");

  if (!list || !summary || !filter) return;

  const food = getAvailableFood();
  const availableIngredients = new Set(food.map(item => item.ingredient));

  const recipes = recipeData.map(recipe => {
    const matched = recipe.ingredients.filter(ingredient =>
      availableIngredients.has(normalizeIngredient(ingredient))
    );

    const missing = recipe.ingredients.filter(ingredient =>
      !availableIngredients.has(normalizeIngredient(ingredient))
    );

    const urgentMatches = food.filter(item =>
      item.days <= SOON_DAYS &&
      recipe.ingredients.some(ingredient =>
        normalizeIngredient(ingredient) === item.ingredient
      )
    );

    return {
      ...recipe,
      matched,
      missing,
      urgentMatches,
      score: matched.length / recipe.ingredients.length
    };
  });

  let relevant = recipes.filter(recipe => recipe.matched.length > 0);

  if (filter.value === "indian") {
    relevant = relevant.filter(recipe => recipe.cuisine === "indian");
  } else if (filter.value === "international") {
    relevant = relevant.filter(recipe =>
      recipe.cuisine === "international"
    );
  } else if (filter.value === "quick") {
    relevant = relevant.filter(recipe => recipe.time <= 20);
  }

  // Prioritize recipes using ingredients nearing expiry.
  relevant.sort((a, b) =>
    b.urgentMatches.length - a.urgentMatches.length ||
    b.matched.length - a.matched.length ||
    a.missing.length - b.missing.length ||
    a.time - b.time
  );

  const urgentIngredientCount = new Set(
    food.filter(item => item.days <= SOON_DAYS)
      .map(item => item.ingredient)
  ).size;

  summary.textContent = food.length
    ? `${food.length} food item(s) tracked · ${urgentIngredientCount} ingredient type(s) need attention`
    : "Add food products to discover recipes.";

  list.replaceChildren();

  if (relevant.length === 0) {
    const empty = document.createElement("div");
    empty.className = "recipe-empty";

    const icon = document.createElement("span");
    icon.textContent = "🥗";

    const heading = document.createElement("h3");
    heading.textContent = food.length
      ? "No matching recipes yet"
      : "Your next meal starts here";

    const message = document.createElement("p");
    message.textContent = food.length
      ? "Try another recipe filter, or add ingredients such as tomato, potato, onion, bread, or rice."
      : "Add food products to your inventory to get personalized suggestions.";

    empty.append(icon, heading, message);
    list.append(empty);
    return;
  }

  relevant.forEach(recipe => {
    console.log(recipe.name, recipe.id, recipe.ingredients);
    const card = document.createElement("article");
    card.className = "recipe-card";
    
    const art = document.createElement("div");
    art.className = `recipe-art recipe-art-${recipe.id}`;

    const image = document.createElement("img");
    image.src = recipe.image;
    image.alt = recipe.name;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.remove();
      art.textContent = recipe.emoji;
      art.setAttribute("aria-label", recipe.name);
    });

    art.append(image);


    const body = document.createElement("div");
    body.className = "recipe-card-body";

    const tags = document.createElement("div");
    tags.className = "recipe-tags";

    const cuisine = document.createElement("span");
    cuisine.className = "recipe-tag";
    cuisine.textContent = recipe.cuisine === "indian"
      ? "Indian"
      : "International";
    tags.append(cuisine);

    const time = document.createElement("span");
    time.className = "recipe-tag";
    time.textContent = `${recipe.time} min`;
    tags.append(time);

    if (recipe.urgentMatches.length > 0) {
      const priority = document.createElement("span");
      priority.className = "recipe-tag priority";
      priority.textContent = "Use soon";
      tags.append(priority);
    }

    const heading = document.createElement("h3");
    heading.textContent = recipe.name;

    const match = document.createElement("p");
    match.className = "recipe-match";
    match.textContent =
      `${recipe.matched.length}/${recipe.ingredients.length} ingredients available`;
        const reason = document.createElement("p");

    if (recipe.urgentMatches.length > 0) {
      const urgentNames = [
        ...new Set(recipe.urgentMatches.map(item => item.name))
      ];

      reason.textContent =
        `Prioritized because ${urgentNames.join(", ")} need attention.`;
    } else {
      reason.textContent =
        "Suggested based on ingredients in your inventory.";
    }

    reason.className = "recipe-reason";
    const missing = document.createElement("p");
    missing.textContent = recipe.missing.length
      ? `Still needed: ${recipe.missing.join(", ")}`
      : "You have all listed ingredients!";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "recipe-button";
    button.textContent = "View recipe";

    const details = document.createElement("div");
    details.className = "recipe-details";
    details.hidden = true;

const ingredientsHeading = document.createElement("h4");
ingredientsHeading.textContent = "Ingredients";

const ingredientProgress = document.createElement("p");
ingredientProgress.className = "ingredient-progress";

const ingredientList = document.createElement("ul");
ingredientList.className = "interactive-ingredient-list";

// Load saved checklist progress for this recipe.
let savedChecklists = {};

try {
  savedChecklists = JSON.parse(
    localStorage.getItem(RECIPE_CHECKLIST_KEY) || "{}"
  );
} catch (error) {
  console.error("Could not load recipe checklists:", error);
}

const checkedIngredients = new Set(
  Array.isArray(savedChecklists[recipe.id])
    ? savedChecklists[recipe.id]
    : []
);

let checkedCount = 0;

function updateIngredientProgress() {
  const total = recipe.ingredients.length;
  const allChecked = total > 0 && checkedCount === total;

  ingredientProgress.textContent = allChecked
    ? "✓ All ingredients ready! Great job!"
    : `${checkedCount} of ${total} ingredients checked`;

  ingredientProgress.classList.toggle(
    "all-ingredients-checked",
    allChecked
  );
}

recipe.ingredients.forEach(ingredient => {
  const li = document.createElement("li");

  const isAvailable = recipe.matched.some(item =>
    normalizeIngredient(item) === normalizeIngredient(ingredient)
  );

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id =
    `ingredient-${recipe.id}-${normalizeIngredient(ingredient).replace(/\s+/g, "-")}`;
  checkbox.setAttribute("aria-label", ingredient);

  // Restore this ingredient's saved state.
  checkbox.checked = checkedIngredients.has(ingredient);

  if (checkbox.checked) {
    checkedCount++;
    li.classList.add("ingredient-checked");
  }

  const label = document.createElement("label");
  label.htmlFor = checkbox.id;
  label.textContent = ingredient;

  const availability = document.createElement("span");
  availability.className = "ingredient-availability";
  availability.textContent = isAvailable ? "In inventory" : "Needed";

  checkbox.addEventListener("change", () => {
    li.classList.toggle("ingredient-checked", checkbox.checked);

    if (checkbox.checked) {
      checkedIngredients.add(ingredient);
    } else {
      checkedIngredients.delete(ingredient);
    }

    checkedCount = checkedIngredients.size;
    updateIngredientProgress();

    try {
      // Preserve progress for every recipe.
      const allChecklists = JSON.parse(
        localStorage.getItem(RECIPE_CHECKLIST_KEY) || "{}"
      );

      allChecklists[recipe.id] = [...checkedIngredients];

      localStorage.setItem(
        RECIPE_CHECKLIST_KEY,
        JSON.stringify(allChecklists)
      );
    } catch (error) {
      console.error("Could not save recipe checklist:", error);
    }
  });

  li.append(checkbox, label, availability);
  ingredientList.append(li);
});

updateIngredientProgress();

updateIngredientProgress();

    const instructionsHeading = document.createElement("h4");
    instructionsHeading.textContent = "Instructions";

    const instructionList = document.createElement("ol");

    recipe.instructions.forEach(instruction => {
      const li = document.createElement("li");
      li.textContent = instruction;
      instructionList.append(li);
    });

    details.append(
      ingredientsHeading,
      ingredientList,
      instructionsHeading,
      instructionList
    );

    button.addEventListener("click", () => {
      details.hidden = !details.hidden;
      button.textContent = details.hidden
        ? "View recipe"
        : "Hide recipe";
    });

    body.append(tags, heading, match, reason, missing, button, details);
    card.append(art, body);
    list.append(card);
  });
}

document.getElementById("recipe-filter")
  .addEventListener("change", renderRecipes);

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = products
    .filter(product =>
      product.name.toLowerCase().includes(search) &&
      (category === "all" || product.category === category)
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  // Update dashboard statistics
  document.getElementById("total-count").textContent = products.length;

  document.getElementById("expiring-count").textContent =
    products.filter(p => getStatus(p).type === "soon").length;

  document.getElementById("expired-count").textContent =
    products.filter(p => getStatus(p).type === "expired").length;

  document.getElementById("safe-count").textContent =
    products.filter(p => getStatus(p).type === "safe").length;
  renderUseFirst();

  // Clear the previous inventory display
  productList.replaceChildren();

  // Display a message if there are no matching products
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const heading = document.createElement("h3");
    heading.textContent = products.length
      ? "No matching products"
      : "Your inventory starts here";

    const message = document.createElement("p");
    message.textContent = products.length
      ? "Try another search or category."
      : "Add your first product to start tracking expiry dates.";

    empty.append(heading, message);
    productList.append(empty);
    return;
  }

  // Create a card for each product
  filtered.forEach(product => {
    const status = getStatus(product);
    const days = getDaysLeft(product.expiry);

    const row = document.createElement("article");
    row.className = "product-row";

    const details = document.createElement("div");
    details.className = "product-details";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const info = document.createElement("p");
    info.textContent = `${product.category} · ${product.quantity}`;

    const date = document.createElement("p");
    date.className = "product-date";

    date.textContent = days < 0
      ? `${Math.abs(days)} day(s) past expiry`
      : days === 0
        ? "Expires today"
        : `${days} day(s) left`;

    const badge = document.createElement("span");
    badge.className = `status-badge ${status.type}`;
    badge.textContent = status.label;

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "product-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-button";
    edit.textContent = "Edit";

    edit.addEventListener("click", () => {
      openModal(product.id);
    });

    const used = document.createElement("button");
    used.type = "button";
    used.className = "used-button";
    used.textContent = "Mark as Used";

    used.addEventListener("click", () => {
      if (!confirm(`Mark ${product.name} as used?`)) return;

      const previousProducts = products;
      products = products.filter(p => p.id !== product.id);

      if (!saveProducts()) {
        products = previousProducts;
        return;
      }

      renderProducts();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      if (!confirm(`Remove ${product.name} from inventory?`)) return;

      const previousProducts = products;
      products = products.filter(p => p.id !== product.id);

      if (!saveProducts()) {
        products = previousProducts;
        return;
      }

      renderProducts();
    });

    actions.append(edit, used, remove);
    details.append(name, info, date);
    row.append(details, badge, actions);

    // This line inserts the product into the visible inventory
    productList.append(row);
  });
  renderExpiryAlerts();
  renderUseFirst();
  renderRecipes();
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

document.getElementById("view-all-btn").addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  renderProducts();
});

renderProducts();

/* ==================================
   LifeExpiry: Barcode Scanner
================================== */

const scanItemsBtn = document.getElementById("scan-items-btn");
const scannerModal = document.getElementById("scanner-modal");
const closeScannerBtn = document.getElementById("close-scanner-btn");
const stopScannerBtn = document.getElementById("stop-scanner-btn");
const scannerStatus = document.getElementById("scanner-status");

let barcodeScanner = null;
let scannerRunning = false;
let scanProcessing = false;

// Open the scanner
scanItemsBtn.addEventListener("click", async () => {
  scannerModal.hidden = false;
  scannerStatus.textContent = "Starting camera...";

  if (typeof Html5Qrcode === "undefined") {
    scannerStatus.textContent =
      "Scanner library failed to load. Check your internet connection.";
    return;
  }

  try {
    barcodeScanner = new Html5Qrcode("barcode-reader", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
      verbose: true
    });

    await barcodeScanner.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.5
      },
      async (decodedText) => {
        if (scanProcessing) return;

        scanProcessing = true;
        scannerStatus.textContent =
          "Barcode detected! Looking up product...";

        try {
          await stopCamera();
          await lookupProduct(decodedText);
        } catch (error) {
          console.error("Barcode scan error:", error);
          alert("Something went wrong while processing the barcode.");
        } finally {
          scanProcessing = false;
        }
      },
      () => {
        // The camera checks many frames before finding a barcode.
        // No action is needed for an unsuccessful frame.
      }
    );

    scannerRunning = true;
    scannerStatus.textContent =
      "Camera is on. Point it at the product barcode.";
  } catch (error) {
    console.error("Could not start camera:", error);
    scannerStatus.textContent =
      "Could not access the camera. Allow camera permission and try again.";
  }
});

// Stop the camera safely
async function stopCamera() {
  if (barcodeScanner && scannerRunning) {
    await barcodeScanner.stop();
    scannerRunning = false;
  }

  if (barcodeScanner) {
    await barcodeScanner.clear();
    barcodeScanner = null;
  }
}

// Look up a scanned barcode using Open Food Facts
async function lookupProduct(barcode) {
  let productName = "";
  let foundProduct = false;

  try {
    const url =
      `https://world.openfoodfacts.org/api/v2/product/` +
      `${encodeURIComponent(barcode)}?fields=product_name`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Product lookup request failed.");
    }

    const data = await response.json();

    if (data.status === 1 && data.product?.product_name) {
      productName = data.product.product_name;
      foundProduct = true;
    }
  } catch (error) {
    console.error("Product lookup failed:", error);
  }

  // Close the scanner and open the existing product form.
  scannerModal.hidden = true;
  openModal();

  // Fill the existing form fields.
  document.getElementById("product-name").value = productName;
  document.getElementById("product-category").value = "Food";

  // The barcode database usually doesn't provide expiry dates
  // or the quantity you currently have.
  document.getElementById("product-quantity").value = "";
  document.getElementById("product-expiry").value = "";

  if (foundProduct) {
    document.getElementById("product-quantity").focus();
  } else {
    alert(
      "Product not found in Open Food Facts. " +
      "Enter its name, category, quantity, and expiry date manually."
    );
    document.getElementById("product-name").focus();
  }
}

// Close scanner using the X button or Stop Camera button
async function closeScanner() {
  try {
    await stopCamera();
  } catch (error) {
    console.error("Could not stop camera:", error);
  }

  scannerModal.hidden = true;
  scanProcessing = false;
}

closeScannerBtn.addEventListener("click", closeScanner);
stopScannerBtn.addEventListener("click", closeScanner);

/* Mobile navbar toggle */
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

if (mobileMenuToggle && mobileMenu) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("menu-open");

    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    mobileMenuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  // Close the menu after selecting a navigation destination.
  mobileMenu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
      mobileMenuToggle.setAttribute(
        "aria-label",
        "Open navigation menu"
      );
    });
  });

  // Restore the desktop layout when the screen becomes wide.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      mobileMenu.classList.remove("menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
      mobileMenuToggle.setAttribute(
        "aria-label",
        "Open navigation menu"
      );
    }
  });
}

/* ==========================================
   LifeExpiry: Receipt scanning with OCR
========================================== */

const scanBillBtn = document.getElementById("scan-bill-btn");
const billModal = document.getElementById("bill-modal");
const closeBillBtn = document.getElementById("close-bill-btn");
const billCameraInput = document.getElementById("bill-camera-input");
const billFileInput = document.getElementById("bill-file-input");
const billStatus = document.getElementById("bill-status");
const billReview = document.getElementById("bill-review");
const billItemsList = document.getElementById("bill-items-list");
const billContinueBtn = document.getElementById("bill-continue-btn");

function openBillScanner() {
  billModal.hidden = false;
  billReview.hidden = true;
  billItemsList.replaceChildren();
  billStatus.textContent = "Take a photo or upload a receipt image.";
}

function closeBillScanner() {
  billModal.hidden = true;
  billCameraInput.value = "";
  billFileInput.value = "";
}

scanBillBtn.addEventListener("click", openBillScanner);
closeBillBtn.addEventListener("click", closeBillScanner);

// Read a photo or uploaded receipt using Tesseract.js.
async function processReceipt(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    billStatus.textContent = "Please select an image file.";
    return;
  }

  if (typeof Tesseract === "undefined") {
    billStatus.textContent =
      "OCR library did not load. Check your internet connection and refresh.";
    return;
  }

  billReview.hidden = true;
  billItemsList.replaceChildren();
  billStatus.textContent = "Reading receipt text... Please wait.";

  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: (message) => {
        if (message.status === "recognizing text" &&
            typeof message.progress === "number") {
          billStatus.textContent =
            `Reading receipt... ${Math.round(message.progress * 100)}%`;
        }
      }
    });

    const lines = result.data.text
      .split(/\r?\n/)
      .map(line => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const items = extractReceiptItems(lines);

    if (!items.length) {
      billStatus.textContent =
        "No likely product lines were detected. Try a clearer photo or enter products manually.";
      return;
    }

    renderReceiptReview(items);
    billReview.hidden = false;
    billStatus.textContent =
      `Detected ${items.length} possible item(s). Review every row before continuing.`;
  } catch (error) {
    console.error("Receipt OCR failed:", error);
    billStatus.textContent =
      "Could not read this image. Try a clearer, well-lit receipt photo.";
  }
}

billCameraInput.addEventListener("change", () => {
  processReceipt(billCameraInput.files[0]);
});

billFileInput.addEventListener("change", () => {
  processReceipt(billFileInput.files[0]);
});

// This is a best-effort receipt parser, not a guarantee.
// Users should correct names and quantities before continuing.

function extractReceiptItems(lines) {
  const cleanedLines = lines
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Find the product table header.
  // Do not treat text above this header as products.
  const headerIndex = cleanedLines.findIndex(line =>
    /\bname\b/i.test(line) &&
    /\bqty\b|\bquantity\b/i.test(line) &&
    /\bprice\b|\bamount\b/i.test(line)
  );

  // If we cannot identify the table, avoid guessing.
  if (headerIndex === -1) {
    console.warn("Receipt product table header was not detected.");
    return [];
  }

  const items = [];
  const footerPattern =
    /\b(sub\s*total|grand\s*total|total|tax|vat|gst|cash|change|balance|payment|thank\s+you)\b/i;

  for (let i = headerIndex + 1; i < cleanedLines.length; i++) {
    let line = cleanedLines[i];

    // Stop at the totals/payment section.
    if (footerPattern.test(line)) break;

    // Ignore separators, blank-looking lines and non-item text.
    if (!/[a-z]/i.test(line)) continue;

    /*
      Expected examples:
      Lorem ipsum          1    $9.20
      Lorem ipsum dolor    2    $19.20
      Milk                 1    ₹45.00
    */
    const itemMatch = line.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?|INR|\$|£|€)?\s*[\d,]+(?:\.\d{1,2})?$/
    );

    if (!itemMatch) {
      // Do not add uncertain lines as products.
      console.warn("Skipped unrecognized receipt line:", line);
      continue;
    }

    const name = itemMatch[1]
      .replace(/^[\s:|.-]+|[\s:|.-]+$/g, "")
      .trim();

    const quantityValue = itemMatch[2];

    if (
      name.length < 2 ||
      name.length > 80 ||
      /^\d+$/.test(name)
    ) {
      continue;
    }

    // Avoid duplicate names, but keep distinct receipt rows
    // if they have different quantities.
    items.push({
      name,
      quantity: `${quantityValue} units (confirm)`
    });
  }

  return items;
}

// Build the review UI safely using DOM elements.
function renderReceiptReview(items) {
  billItemsList.replaceChildren();

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "bill-item-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.setAttribute("aria-label", `Select item ${index + 1}`);

    const fields = document.createElement("div");
    fields.className = "bill-item-fields";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Product name";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = item.name;
    nameInput.maxLength = 80;
    nameInput.required = true;
    nameInput.autocomplete = "off";
    nameLabel.appendChild(nameInput);

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity (please confirm)";

    const quantityInput = document.createElement("input");
    quantityInput.type = "text";
    quantityInput.value = item.quantity;
    quantityInput.maxLength = 40;
    quantityInput.required = true;
    quantityLabel.appendChild(quantityInput);

    const categoryLabel = document.createElement("label");
    categoryLabel.textContent = "Category";

    const categorySelect = document.createElement("select");
    categorySelect.innerHTML = `
      <option value="Food">Food</option>
      <option value="Medicine">Medicine</option>
      <option value="Cosmetics">Cosmetics</option>
      <option value="Household">Household</option>
    `;
    categoryLabel.appendChild(categorySelect);

    const expiryLabel = document.createElement("label");
    expiryLabel.textContent = "Expiry date (required)";

    const expiryInput = document.createElement("input");
    expiryInput.type = "date";
    expiryInput.required = true;
    expiryLabel.appendChild(expiryInput);

    fields.append(
      nameLabel,
      quantityLabel,
      categoryLabel,
      expiryLabel
    );

    row.append(checkbox, fields);
    billItemsList.appendChild(row);
  });
}

// Validate date values without changing existing expiry calculations.
function isValidReceiptExpiry(expiry) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return false;

  const [year, month, day] = expiry.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
}

// Save selected products using the existing product structure and saveProducts().
billContinueBtn.addEventListener("click", () => {
  const rows = [...billItemsList.querySelectorAll(".bill-item-row")];

  const selectedItems = rows
    .filter(row => row.querySelector('input[type="checkbox"]').checked)
    .map(row => {
      const fields = row.querySelector(".bill-item-fields");

      return {
        name: fields.querySelector('input[type="text"]:first-of-type').value.trim(),
        quantity: fields.querySelectorAll('input[type="text"]')[1].value.trim(),
        category: fields.querySelector("select").value,
        expiry: fields.querySelector('input[type="date"]').value
      };
    });

  if (!selectedItems.length) {
    billStatus.textContent = "Select at least one product to continue.";
    return;
  }

  const invalidItem = selectedItems.find(item =>
    !item.name ||
    item.name.length > 80 ||
    !item.quantity ||
    item.quantity.length > 40 ||
    !isValidReceiptExpiry(item.expiry)
  );

  if (invalidItem) {
    billStatus.textContent =
      "Complete each selected product's name, quantity, and valid expiry date before saving.";
    return;
  }

  const previousProducts = [...products];

  const newProducts = selectedItems.map(item => ({
    id: crypto.randomUUID(),
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    expiry: item.expiry
  }));

  products.push(...newProducts);

  if (!saveProducts()) {
    products = previousProducts;
    billStatus.textContent =
      "Products could not be saved. Your existing inventory has been restored.";
    return;
  }

  renderProducts();
  closeBillScanner();

  alert(`${newProducts.length} product(s) added to your inventory.`);
});
