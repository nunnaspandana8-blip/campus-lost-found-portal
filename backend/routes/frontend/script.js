
const API_URL = "https://campus-lost-found-portal-gke6.onrender.com/api/items";
const CLAIMS_URL = "https://campus-lost-found-portal-gke6.onrender.com/api/claims";

const itemsContainer = document.getElementById("items-container");
const itemCount = document.getElementById("item-count");
const message = document.getElementById("message");
const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");
const searchButton = document.getElementById("search-button");
const itemForm = document.getElementById("item-form");
const formMessage = document.getElementById("form-message");
const reportSection = document.getElementById("report");

function updateReportAccess() {
  const token = localStorage.getItem("token");
  const loggedIn = Boolean(token);

  if (itemForm) {
    itemForm.hidden = !loggedIn;
  }

  if (!reportSection) return;

  let loginNotice = document.getElementById("login-notice");

  if (!loggedIn) {
    if (!loginNotice) {
      loginNotice = document.createElement("p");
      loginNotice.id = "login-notice";
      loginNotice.className = "message";
      loginNotice.textContent =
        "Please log in to report a lost or found item. ";

      const loginLink = document.createElement("a");
      loginLink.href = "login.html";
      loginLink.textContent = "Login here";

      loginNotice.appendChild(loginLink);
      reportSection.appendChild(loginNotice);
    }
  } else if (loginNotice) {
    loginNotice.remove();
  }
}

async function loadItems() {
  message.textContent = "Loading items...";
  itemsContainer.replaceChildren();

  const params = new URLSearchParams();
  const search = searchInput.value.trim();
  const type = typeFilter.value;
  const category = categoryFilter.value;

  if (search) params.set("search", search);
  if (type) params.set("type", type);
  if (category) params.set("category", category);

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load items.");
    }

    itemCount.textContent =
      `${data.count} item${data.count === 1 ? "" : "s"}`;

    message.textContent = data.count
      ? "Here are the reported items."
      : "No items found. Try another search.";

    displayItems(data.items);
  } catch (error) {
    itemCount.textContent = "Unavailable";
    message.textContent =
      "Could not connect to the server. Make sure your backend is running.";

    console.error("Loading items failed:", error);
  }
}

function displayItems(items) {
  itemsContainer.replaceChildren();

  if (items.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "No matching items found.";
    itemsContainer.appendChild(emptyState);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card";

    const badges = document.createElement("div");
    badges.className = "item-badges";

    const typeBadge = document.createElement("span");
    typeBadge.className = `item-badge ${
      item.type === "Lost" ? "badge-lost" : "badge-found"
    }`;
    typeBadge.textContent = item.type;

    const statusBadge = document.createElement("span");
    statusBadge.className = "item-badge badge-status";
    statusBadge.textContent = item.status;

    badges.append(typeBadge, statusBadge);

    const title = document.createElement("h3");
    title.textContent = item.title;

    const category = document.createElement("p");
    category.textContent = `Category: ${item.category}`;

    const description = document.createElement("p");
    description.textContent = item.description;

    const location = document.createElement("p");
    location.className = "item-location";
    location.textContent = `Location: ${item.location}`;

    const date = document.createElement("p");
    date.textContent =
      `Date: ${new Date(item.date).toLocaleDateString("en-IN")}`;

    card.append(badges, title, category, description, location, date);

    if (item.type === "Found" && item.status === "Open") {
      const claimButton = document.createElement("button");
      claimButton.type = "button";
      claimButton.textContent = "Claim This Item";

      claimButton.addEventListener("click", () => {
        submitClaim(item);
      });

      card.appendChild(claimButton);
    }

    itemsContainer.appendChild(card);
  });
}

async function submitClaim(item) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const claimantName = prompt("Enter your name:");
  if (!claimantName || !claimantName.trim()) return;

  const claimantEmail = prompt("Enter your registered email:");
  if (!claimantEmail || !claimantEmail.trim()) return;

  const claimMessage = prompt(
    "Explain why this item belongs to you:"
  );
  if (!claimMessage || !claimMessage.trim()) return;

  try {
    const response = await fetch(CLAIMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        item: item._id,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        message: claimMessage.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        updateReportAccess();
        window.location.href = "login.html";
        return;
      }

      throw new Error(data.message || "Could not submit claim.");
    }

    alert("Claim submitted successfully!");
  } catch (error) {
    alert(error.message);
    console.error("Claim submission failed:", error);
  }
}

if (searchButton) {
  searchButton.addEventListener("click", loadItems);
}

if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadItems();
    }
  });
}

if (typeFilter) {
  typeFilter.addEventListener("change", loadItems);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", loadItems);
}

if (itemForm) {
  itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      formMessage.textContent =
        "Please log in before submitting a report.";
      updateReportAccess();
      return;
    }

    formMessage.textContent = "Submitting report...";

    const formData = new FormData(itemForm);
    const item = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          updateReportAccess();
        }

        throw new Error(data.message || "Could not submit the report.");
      }

      formMessage.textContent = "Report submitted successfully!";
      itemForm.reset();

      await loadItems();

      document.getElementById("items").scrollIntoView({
        behavior: "smooth"
      });
    } catch (error) {
      formMessage.textContent = error.message;
      console.error("Submitting report failed:", error);
    }
  });
}

updateReportAccess();
loadItems();
