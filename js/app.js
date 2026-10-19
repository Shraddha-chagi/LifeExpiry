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