const AUTH_URL = "http://localhost:5000/api/auth";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const authMessage = document.getElementById("auth-message");


// USER REGISTRATION
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        authMessage.textContent = "Creating your account...";

        const formData = new FormData(registerForm);
        const user = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${AUTH_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Registration failed.");
            }

            authMessage.textContent =
                "Registration successful! You can now log in.";

            registerForm.reset();

        } catch (error) {
            authMessage.textContent = error.message;
        }
    });
}


// USER LOGIN
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        authMessage.textContent = "Logging in...";

        const formData = new FormData(loginForm);
        const credentials = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${AUTH_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Login failed.");
            }

            if (!data.token || !data.user) {
                throw new Error("Login response is incomplete.");
            }

            // Store authentication details
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            authMessage.textContent = "Login successful!";

            // Redirect based on user role
            if (data.user.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            authMessage.textContent = error.message;
        }
    });
}