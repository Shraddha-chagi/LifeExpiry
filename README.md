# 🌿 LifeExpiry — Never Waste Anything Again

LifeExpiry is a simple, responsive web application that helps users track product expiry dates, manage their inventory, and discover recipes based on ingredients they already have at home.

The goal is to reduce avoidable waste, prevent forgotten purchases, and help users make better use of everyday products.

## 📌 Project Overview

Have you ever forgotten about groceries in your refrigerator or discovered that a product had expired before you could use it?

**LifeExpiry** aims to solve this problem by providing a centralized place to track expiry dates and identify products that need attention.

The website also includes a recipe recommendation feature that suggests meals based on available food ingredients, helping users prioritize what they already have.

This project was developed as a beginner-friendly frontend web development project.

## 🎯 Purpose

- Reduce food and household product waste.
- Help users keep track of expiry dates.
- Highlight products that are expired or expiring soon.
- Encourage users to use available ingredients before buying more.
- Make everyday inventory management simple and accessible.

## 👥 Target Audience

LifeExpiry is designed for:

- Students living in hostels or shared accommodation.
- Individuals and families managing household products.
- People who want to reduce food waste.
- Anyone looking for a simple way to organize products and expiry dates.

## ✨ Features

### 📦 Product Inventory Management
- Add products with their name, category, quantity, and expiry date.
- Edit existing product details.
- Remove products from the inventory.
- Mark products as used.
- Search and filter inventory items.

### ⏰ Expiry Tracking and Alerts
- Identify expired products.
- Highlight products expiring soon.
- Display expiry-related alerts.
- Prioritize products that need attention.

### 🥗 Smart Recipe Suggestions
- Discover recipes based on food items in the inventory.
- See which ingredients are available and which are still needed.
- Filter recipes by cuisine and preparation time.
- Prioritize recipes that use ingredients nearing expiry.

### 👩‍🍳 Interactive Recipe Checklists
- View recipe ingredients and cooking instructions.
- Check off ingredients while preparing a meal.
- Track ingredient checklist progress.
- Preserve checklist progress after refreshing the page.

### 💾 Local Data Persistence
- Save inventory data using browser local storage.
- Retain products and edits after refreshing the page.
- Save recipe checklist progress separately for each recipe.

### 📱 Responsive Design
- Responsive layouts for desktop, tablet, and mobile screens.
- Clean interface with a soft, nature-inspired colour palette.
- Interactive buttons, recipe cards, and product forms.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling, layout, and responsive design |
| JavaScript | Inventory logic, expiry tracking, and recipe recommendations |
| Browser Local Storage | Persisting inventory and recipe checklist data |
| Git | Version control |
| GitHub | Source code hosting |
| GitHub Pages | Website deployment |

## 🖥️ Getting Started

Follow these steps to run LifeExpiry locally.

### Prerequisites

- A modern web browser.
- A code editor such as Visual Studio Code.
- Git (optional, for version control).

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Shraddha-chagi/LifeExpiry.git
```

**2. Open the project folder**

```bash
cd LifeExpiry
```

**3. Run the website**

Open `index.html` in your browser.

For the best development experience, you can use the Live Server extension in Visual Studio Code.

## 📁 Project Structure

```text
LifeExpiry/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── images/
└── README.md
```

## 🔒 Data Storage and Privacy

LifeExpiry currently uses browser `localStorage` to store inventory items and recipe checklist progress.

- No backend server or database is required.
- Data is stored locally in the browser.
- Stored data is generally available in the same browser and origin.
- Clearing browser site data can remove saved inventory and checklist progress.
- Data is not automatically synchronized across devices.

This is a frontend-only implementation; it does not currently provide user accounts or cloud synchronization.

## 🚀 Deployment

LifeExpiry can be deployed using GitHub Pages.

1. Push the project files to the GitHub repository.
2. Open the repository's **Settings**.
3. Select **Pages** from the sidebar.
4. Under the build and deployment settings, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder.
6. Save the settings and wait for deployment.

Once deployment finishes, GitHub Pages will provide a public URL for the website.

## 🔮 Future Enhancements

Potential future improvements include:

- Browser notifications for upcoming expiry dates.
- Barcode scanning or faster product entry.
- User accounts and cloud synchronization.
- Backend and database integration.
- More personalized recipe recommendations.
- Shopping list generation for missing ingredients.
- Family inventory sharing.
- Improved accessibility and multilingual support.

## 🎓 Learning Outcomes

Through this project, I explored:

- Building a website using HTML, CSS, and JavaScript.
- Manipulating the DOM dynamically.
- Handling forms, events, and user input.
- Managing and filtering structured data.
- Working with browser local storage.
- Designing responsive layouts.
- Using Git and GitHub for version control.
- Developing interactive features around a practical everyday problem.

## 👩‍💻 Author

**Shraddha C V**

Computer Science and Engineering — Data Science

GitHub: [Shraddha-chagi](https://github.com/Shraddha-chagi)

Live demo link: (https://shraddha-chagi.github.io/LifeExpiry)

---

*LifeExpiry — Use what you have. Waste less. Live smarter.* 🌱
