// Authentication System
// User Management with localStorage and sessionStorage

// Initialize authentication system
document.addEventListener("DOMContentLoaded", () => {
    initializeAuth();
    updateAuthUI();
});

// Initialize authentication system
function initializeAuth() {
    // Initialize users array if it doesn't exist
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify([]));
    }
    
    // Check if user was logged in and restore session
    const persistentUser = localStorage.getItem("currentUser");
    if (persistentUser) {
        const user = JSON.parse(persistentUser);
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        loadUserCart(user);
    }
}

// Get current logged-in user
function getCurrentUser() {
    const sessionUser = sessionStorage.getItem("currentUser");
    return sessionUser ? JSON.parse(sessionUser) : null;
}

// Generate unique user ID
function generateUserId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email);
}

// Check if email is unique
function isEmailUnique(email) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    return !users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

// Register new user
function registerUser(userData) {
    const { name, email, password } = userData;
    
    // Validation
    if (!name || !email || !password) {
        return { success: false, message: "All fields are required" };
    }
    
    if (name.length < 2) {
        return { success: false, message: "Name must be at least 2 characters long" };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: "Please enter a valid email address" };
    }
    
    if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters long" };
    }
    
    if (!isEmailUnique(email)) {
        return { success: false, message: "Email address is already registered" };
    }
    
    // Create new user
    const newUser = {
        id: generateUserId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    
    // Initialize empty cart for new user
    localStorage.setItem(`cart_${newUser.id}`, JSON.stringify([]));
    
    return { success: true, message: "Registration successful!", user: newUser };
}

// Login user
function loginUser(email, password) {
    if (!email || !password) {
        return { success: false, message: "Email and password are required" };
    }
    
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase().trim() && 
        u.password === password
    );
    
    if (!user) {
        return { success: false, message: "Invalid email or password" };
    }
    
    // Store user in both localStorage (persistent) and sessionStorage (current session)
    const userSession = {
        id: user.id,
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem("currentUser", JSON.stringify(userSession));
    sessionStorage.setItem("currentUser", JSON.stringify(userSession));
    
    // Load user's cart
    loadUserCart(userSession);
    
    return { success: true, message: "Login successful!", user: userSession };
}

// Load user's cart from localStorage to sessionStorage
function loadUserCart(user) {
    const userCartKey = `cart_${user.id}`;
    const userCart = JSON.parse(localStorage.getItem(userCartKey)) || [];
    sessionStorage.setItem("cart", JSON.stringify(userCart));
}

// Logout user
function logoutUser() {
    // Only clear sessionStorage, keep localStorage intact
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("cart");
    
    // Also remove persistent login
    localStorage.removeItem("currentUser");
    
    return { success: true, message: "Logged out successfully!" };
}

// Update authentication UI
function updateAuthUI() {
    const currentUser = getCurrentUser();
    const authButton = document.getElementById("auth-button");
    
    if (!authButton) return; // Exit if auth button doesn't exist
    
    if (currentUser) {
        // User is logged in - show user name and make it a logout button
        authButton.innerHTML = `${currentUser.name} <i class="fa-solid fa-arrow-right-from-bracket"></i>`;
        authButton.href = "#";
        authButton.onclick = function(e) {
            e.preventDefault();
            logoutUser();
            updateAuthUI();
            window.location.reload();
        };
    } else {
        // User is not logged in - show login button
        authButton.innerHTML = `Login <i class="fa-solid fa-arrow-right-to-bracket"></i>`;
        authButton.href = "login.html";
        authButton.onclick = null;
    }
}

// Handle logout
function handleLogout() {
    const result = logoutUser();
    if (result.success) {
        showNotification(result.message, "success");
        updateAuthUI();
        // Redirect to home page after logout
        if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    }
}

// Update cart count in UI
function updateCartCount() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
    const cartCount = document.getElementById("cartCount");
    const cartLink = document.getElementById("cartLink");
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    if (cartLink) {
        cartLink.setAttribute("data-count", totalItems);
        if (totalItems === 0) {
            cartLink.removeAttribute("data-count");
        }
    }
}

// Show notification (using SweetAlert if available, fallback to alert)
function showNotification(message, type = "info") {
    if (typeof swal !== "undefined") {
        const swalType = type === "error" ? "error" : type === "success" ? "success" : "info";
        swal(type.charAt(0).toUpperCase() + type.slice(1), message, swalType);
    } else {
        alert(message);
    }
}

// Form handlers for login page
function handleLoginForm(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    const result = loginUser(email, password);
    
    if (result.success) {
        showNotification(result.message, "success");
        updateAuthUI();
        // Redirect to home page after successful login
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        showNotification(result.message, "error");
    }
}

// Form handlers for register page
function handleRegisterForm(event) {
    event.preventDefault();
    
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
    }
    
    const result = registerUser({ name, email, password });
    
    if (result.success) {
        showNotification(result.message, "success");
        // Redirect to login page after successful registration
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } else {
        showNotification(result.message, "error");
    }
}

// Check if user is logged in (for protected pages)
function requireAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to access this page", "warning");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Auto-update auth UI when storage changes (for multiple tabs)
window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") {
        updateAuthUI();
    }
});

// Listen for cart updates to update cart count
window.addEventListener("cartUpdated", () => {
    updateCartCount();
});

// Export functions for global use
window.getCurrentUser = getCurrentUser;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.updateAuthUI = updateAuthUI;
window.updateCartCount = updateCartCount;
window.showNotification = showNotification;
window.handleLoginForm = handleLoginForm;
window.handleRegisterForm = handleRegisterForm;
window.handleLogout = handleLogout;
window.requireAuth = requireAuth;
