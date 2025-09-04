// Cart System with User Authentication
// Per-user cart management with localStorage and sessionStorage

// Initialize cart system when page loads
document.addEventListener("DOMContentLoaded", () => {
    // Wait for auth.js to initialize, then load cart
    setTimeout(() => {
        // Initialize empty cart first
        if (!sessionStorage.getItem("cart")) {
            sessionStorage.setItem("cart", JSON.stringify([]));
        }
        loadUserCart();
        renderCart();
        updateCartCount();
    }, 100);
});

// Load user's cart from localStorage to sessionStorage
function loadUserCart() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        // Clear cart if no user is logged in
        sessionStorage.removeItem("cart");
        return;
    }
    
    try {
        const userCartKey = `cart_${currentUser.id}`;
        const storedCartData = localStorage.getItem(userCartKey);
        let storedCart = [];
        
        if (storedCartData && storedCartData !== "null" && storedCartData !== "undefined") {
            storedCart = JSON.parse(storedCartData);
            if (!Array.isArray(storedCart)) {
                storedCart = [];
            }
        }
        
        sessionStorage.setItem("cart", JSON.stringify(storedCart));
    } catch (error) {
        console.error("Error loading user cart:", error);
        sessionStorage.setItem("cart", JSON.stringify([]));
    }
}

// Get current cart from sessionStorage
function getCart() {
    try {
        const cartData = sessionStorage.getItem("cart");
        if (!cartData || cartData === "null" || cartData === "undefined") {
            return [];
        }
        const parsedCart = JSON.parse(cartData);
        return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
        console.error("Error parsing cart data:", error);
        sessionStorage.removeItem("cart");
        return [];
    }
}

// Save cart to both localStorage and sessionStorage
function saveCart(cartData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        // Ensure cartData is an array
        const validCartData = Array.isArray(cartData) ? cartData : [];
        
        // Update both session and persistent storage simultaneously
        sessionStorage.setItem("cart", JSON.stringify(validCartData));
        localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(validCartData));
    } catch (error) {
        console.error("Error saving cart:", error);
    }
}

// Add item to cart
function addToCart(product, quantity) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to add items to cart!", "warning");
        return;
    }

    if (quantity === 0) {
        showNotification("Select at least 1 item!", "warning");
        return;
    }

    let cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        if (existing.quantity + quantity > product.stock) {
            showNotification("Cannot exceed stock", "warning");
            return;
        }
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    saveCart(cart);
    updateCartCount();
    renderCart();
    
    // Dispatch cart updated event
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: product.id } }));
}

// Remove item from cart
function removeFromCart(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    let cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
    updateCartCount();
    renderCart();
    
    // Dispatch cart updated event
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: productId } }));
}

// Update item quantity in cart
function updateCartItemQuantity(productId, newQuantity) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        // Check stock limit
        const products = JSON.parse(localStorage.getItem("products")) || [];
        const product = products.find(p => p.id === productId);
        
        if (product && newQuantity > product.stock) {
            showNotification("Cannot exceed stock", "warning");
            return;
        }
        
        item.quantity = newQuantity;
        saveCart(cart);
        updateCartCount();
        renderCart();
        
        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: productId } }));
    }
}

// Update cart count in UI
function updateCartCount() {
    const cart = getCart();
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

// Render cart items
function renderCart() {
    const cartContainer = document.getElementById("cart-container");
    const totalElement = document.getElementById("total");
    const cartTitle = document.getElementById("cart-title");
    
    if (!cartContainer) return; // Exit if not on cart page
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        cartContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>Please login to view your cart</h3>
                <a href="login.html" class="btn btn-primary">Login</a>
            </div>
        `;
        if (totalElement) totalElement.textContent = "";
        if (cartTitle) cartTitle.innerHTML = `Your Cart <i class="fa-solid fa-cart-arrow-down"></i>`;
        return;
    }
    
    // Update cart title with username
    if (cartTitle) {
        const username = currentUser.username || currentUser.name || currentUser.email.split('@')[0];
        cartTitle.innerHTML = `${username} Cart <i class="fa-solid fa-cart-arrow-down"></i>`;
    }

    const cart = getCart();
    cartContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>Your cart is empty</h3>
                <p>Start shopping to add items to your cart!</p>
                <a href="index.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        if (totalElement) totalElement.textContent = "";
        return;
    }

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        
        div.innerHTML = `
            <img src="${item.image}" alt="${item.title}" width="100">
            <div class="titleincart">
                <h5>${item.title}</h5>
            </div>
            <p>Price: <span class="price">$${item.price}</span></p>
            <div class="actions" id="actions-${item.id}">
                <div>
                    <button class="btn down" id="down-${item.id}" onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <span class="qty" id="qty-${item.id}">${item.quantity}</span>
                    <button class="btn up" id="up-${item.id}" onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <div class="flex">
                    <button class="buy" id="buy-${item.id}" onclick="buyItem(${item.id})">Buy Now</button>
                    <button class="delete" onclick="confirmRemoveItem(${item.id}, '${item.title.replace(/'/g, "\\'")}')">Delete</button>
                </div>
            </div>
            <p>Subtotal: <span class="subtotal">$${(item.price * item.quantity).toFixed(2)}</span></p>
        `;
        
        cartContainer.appendChild(div);
        total += item.price * item.quantity;
    });

    if (totalElement) {
        totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }
}

// Confirm remove item with SweetAlert
function confirmRemoveItem(productId, productTitle) {
    if (typeof swal !== "undefined") {
        swal({
            title: `Remove "${productTitle}" from cart?`,
            icon: "warning",
            buttons: ["No", "Yes, remove it!"],
            dangerMode: true
        }).then(confirmed => {
            if (confirmed) {
                removeFromCart(productId);
                showNotification("Item removed from cart", "success");
            }
        });
    } else {
        if (confirm(`Remove "${productTitle}" from cart?`)) {
            removeFromCart(productId);
        }
    }
}

// Buy item functionality
function buyItem(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to purchase items", "warning");
        return;
    }
    
    const cart = getCart();
    if (!cart) {
        showNotification("Cart is not available", "error");
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        // Disable only this product's buttons (except delete)
        disableProductButtons(productId);
        
        // Simulate purchase
        swal({
            title: "Purchase Successful!",
            text: `Thank you for purchasing ${item.title}! المنتج جاي في الطريق.`,
            icon: "success",
            timer: 2000,
            buttons: false
        });
        // Do not remove item from cart after purchase
    } else {
        showNotification("Item not found in cart", "error");
    }
}

// Disable only specific product's buttons (except delete)
function disableProductButtons(productId) {
    const downBtn = document.getElementById(`down-${productId}`);
    const upBtn = document.getElementById(`up-${productId}`);
    const buyBtn = document.getElementById(`buy-${productId}`);
    
    [downBtn, upBtn, buyBtn].forEach(button => {
        if (button) {
            button.disabled = true;
            button.style.opacity = "0.5";
            button.style.cursor = "not-allowed";
        }
    });
}

// Buy all items functionality
function buyAllItems() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to purchase items", "warning");
        return;
    }
    
    const cart = getCart();
    if (!cart || cart.length === 0) {
        showNotification("Your cart is empty", "warning");
        return;
    }
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    swal({
        title: "Buy All Items?",
        text: `Total amount: $${totalAmount.toFixed(2)}`,
        icon: "info",
        buttons: ["Cancel", "Buy All"]
    }).then(confirmed => {
        if (confirmed) {
            // Disable all product buttons except delete
            cart.forEach(item => disableProductButtons(item.id));
            
            swal({
                title: "Purchase Successful!",
                text: `Thank you for purchasing all items! Total: $${totalAmount.toFixed(2)}. جميع المنتجات جاية في الطريق.`,
                icon: "success",
                timer: 3000,
                buttons: false
            });
        }
    });
}

// Delete all items functionality
function confirmDeleteAll() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to manage your cart", "warning");
        return;
    }
    
    const cart = getCart();
    if (!cart || cart.length === 0) {
        showNotification("Your cart is already empty", "info");
        return;
    }
    
    swal({
        title: "Delete All Items?",
        text: "This will remove all items from your cart. This action cannot be undone.",
        icon: "warning",
        buttons: ["Cancel", "Delete All"],
        dangerMode: true
    }).then(confirmed => {
        if (confirmed) {
            deleteAllItems();
            showNotification("All items removed from cart", "success");
        }
    });
}

// Delete all items from cart
function deleteAllItems() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    saveCart([]);
    updateCartCount();
    renderCart();
    
    // Dispatch cart updated event
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: null } }));
}

// Get cart quantity for a specific product (used by dynamic.js)
function getCartQuantity(productId) {
    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    return existing ? existing.quantity : 0;
}

// Listen for authentication changes
window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") {
        loadUserCart();
        renderCart();
        updateCartCount();
    }
});

// Listen for cart updates from other parts of the app
window.addEventListener("cartUpdated", (e) => {
    updateCartCount();
    if (e.detail?.productId) {
        // Update product quantity UI if available
        if (typeof updateProductQuantityUI === "function") {
            updateProductQuantityUI(e.detail.productId);
        }
    }
});

// Export functions for global use
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.getCartQuantity = getCartQuantity;
window.renderCart = renderCart;
window.updateCartCount = updateCartCount;
window.confirmRemoveItem = confirmRemoveItem;
window.buyItem = buyItem;
