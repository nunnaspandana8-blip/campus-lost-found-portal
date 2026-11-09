const API_URL = "https://campus-lost-found-portal-gke6.onrender.com/api/claims";

const claimsContainer = document.getElementById("claimsContainer");
const logoutBtn = document.getElementById("logoutBtn");


// LOGOUT
if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });
}


// GET TOKEN
function getToken() {
    return localStorage.getItem("token");
}


// LOAD ALL CLAIMS
async function loadClaims() {
    try {
        const token = getToken();

        if (!token) {
            claimsContainer.textContent = "Please login as admin.";
            return;
        }

        const response = await fetch(`${API_URL}/all`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            claimsContainer.textContent = data.message;
            return;
        }

        displayClaims(data.claims);

    } catch (error) {
        claimsContainer.textContent = "Unable to connect to server.";
    }
}


// DISPLAY CLAIMS
function displayClaims(claims) {
    claimsContainer.innerHTML = "";

    if (!claims || claims.length === 0) {
        claimsContainer.textContent = "No claims found.";
        return;
    }

    claims.forEach(claim => {
        const card = document.createElement("div");

        card.className = "claim-card";

        const itemTitle = claim.item
            ? claim.item.title
            : "Item not available";

        const itemLocation = claim.item
            ? claim.item.location
            : "Not available";

        card.innerHTML = `
            <h3>${itemTitle}</h3>

            <p><strong>Claimant:</strong> ${claim.claimantName}</p>
            <p><strong>Email:</strong> ${claim.claimantEmail}</p>
            <p><strong>Location:</strong> ${itemLocation}</p>
            <p><strong>Message:</strong> ${claim.message}</p>
            <p><strong>Status:</strong> ${claim.status}</p>

            <button
                class="approve-btn"
                ${claim.status !== "Pending" ? "disabled" : ""}
                onclick="updateClaim('${claim._id}', 'Approved')">
                Approve
            </button>

            <button
                class="reject-btn"
                ${claim.status !== "Pending" ? "disabled" : ""}
                onclick="updateClaim('${claim._id}', 'Rejected')">
                Reject
            </button>
        `;

        claimsContainer.appendChild(card);
    });
}


// UPDATE CLAIM STATUS
async function updateClaim(claimId, status) {
    try {
        const token = getToken();

        if (!token) {
            alert("Please login again.");
            return;
        }

        const response = await fetch(
            `${API_URL}/${claimId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update claim.");
            return;
        }

        alert(data.message);
        loadClaims();

    } catch (error) {
        alert("Unable to connect to server.");
    }
}


// LOAD CLAIMS WHEN PAGE OPENS
loadClaims();