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
        
        // Get purchased items and mark them as purchased in the cart
        const purchasedItems = getPurchasedItems();
        if (purchasedItems.length > 0) {
            storedCart.forEach(cartItem => {
                const purchasedItem = purchasedItems.find(p => p.id === cartItem.id);
                if (purchasedItem) {
                    cartItem.purchased = true;
                }
            });
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

// Get purchased items from localStorage
function getPurchasedItems() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    
    try {
        const purchasedKey = `purchased_${currentUser.id}`;
        const purchasedData = localStorage.getItem(purchasedKey);
        if (!purchasedData || purchasedData === "null" || purchasedData === "undefined") {
            return [];
        }
        const parsedPurchased = JSON.parse(purchasedData);
        return Array.isArray(parsedPurchased) ? parsedPurchased : [];
    } catch (error) {
        console.error("Error parsing purchased data:", error);
        return [];
    }
}

// Save purchased items to localStorage
function savePurchasedItems(purchasedData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const validPurchasedData = Array.isArray(purchasedData) ? purchasedData : [];
        const purchasedKey = `purchased_${currentUser.id}`;
        localStorage.setItem(purchasedKey, JSON.stringify(validPurchasedData));
    } catch (error) {
        console.error("Error saving purchased items:", error);
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
            quantity: quantity,
            purchased: false
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
    
    let cart = getCart();
    const itemToRemove = cart.find(item => item.id === productId);
    
    // If item was purchased, remove it from purchased list and recalculate total
    if (itemToRemove && itemToRemove.purchased) {
        let purchasedItems = getPurchasedItems();
        purchasedItems = purchasedItems.filter(item => item.id !== productId);
        savePurchasedItems(purchasedItems);
    }
    
    cart = cart.filter(item => item.id !== productId);
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
        
        const isPurchased = item.purchased || false;
        const purchasedStatus = isPurchased ? ' (Purchased)' : '';
        
        div.innerHTML = `
            <img src="${item.image}" alt="${item.title}" width="100">
            <div class="titleincart">
                <h5>${item.title}${purchasedStatus}</h5>
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
                    <button class="buy" id="buy-${item.id}" onclick="buyItem(${item.id})">${isPurchased ? 'Purchased' : 'Buy Now'}</button>
                    <button class="delete" onclick="confirmRemoveItem(${item.id}, '${item.title.replace(/'/g, "\'")}')">Delete</button>
                </div>
            </div>
            <p>Subtotal: <span class="subtotal">$${(item.price * item.quantity).toFixed(2)}</span></p>
        `;
        
        cartContainer.appendChild(div);
        
        // Always add to total, regardless of purchase status
        total += item.price * item.quantity;
        
        // Apply disabled state if purchased
        if (isPurchased) {
            setTimeout(() => disableProductButtons(item.id), 0);
        }
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

// Global variable to store the current item being purchased
let currentPurchaseItem = null;

// Buy item functionality - now shows address popup first
function buyItem(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to purchase items", "warning");
        return;
    }
    
    let cart = getCart();
    if (!cart) {
        showNotification("Cart is not available", "error");
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        // Check if already purchased
        if (item.purchased) {
            showNotification("Item already purchased!", "info");
            return;
        }
        
        // Store the item for purchase after address is provided
        currentPurchaseItem = item;
        
        // Show address popup
        showAddressPopup();
    } else {
        showNotification("Item not found in cart", "error");
    }
}

// Show address popup
function showAddressPopup() {
    const popup = document.getElementById('address-popup');
    if (popup) {
        // Load saved address if available
        loadSavedAddress();
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close address popup
function closeAddressPopup() {
    const popup = document.getElementById('address-popup');
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        currentPurchaseItem = null; // Clear the current purchase item
        currentBulkPurchaseItems = null; // Clear bulk purchase items
    }
}

// Complete the purchase after address is provided
function completePurchase(addressData) {
    if (!currentPurchaseItem) {
        showNotification("No item selected for purchase", "error");
        return;
    }
    
    let cart = getCart();
    const item = cart.find(item => item.id === currentPurchaseItem.id);
    
    if (item) {
        // Mark item as purchased in cart
        item.purchased = true;
        saveCart(cart);
        
        // Add to purchased items list with address
        let purchasedItems = getPurchasedItems();
        const existingPurchased = purchasedItems.find(p => p.id === item.id);
        if (!existingPurchased) {
            purchasedItems.push({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                purchaseDate: new Date().toISOString(),
                shippingAddress: addressData
            });
            savePurchasedItems(purchasedItems);
        }
        
        // Save address for future use
        saveUserAddress(addressData);
        
        // Disable only this product's buttons (except delete)
        disableProductButtons(item.id);
        
        // Update the buy button text
        const buyBtn = document.getElementById(`buy-${item.id}`);
        if (buyBtn) {
            buyBtn.textContent = 'Purchased';
        }
        
        // Close popup
        closeAddressPopup();
        
        // Show success message
        swal({
            title: "Purchase Successful!",
            text: `Thank you for purchasing ${item.title}! Your order will be shipped to ${addressData.city}, ${addressData.country}. المنتج جاي في الطريق.`,
            icon: "success",
            timer: 3000,
            buttons: false
        });
        
        // Re-render to update UI
        renderCart();
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

// Global variable to store items for bulk purchase
let currentBulkPurchaseItems = null;

// Buy all items functionality - now shows address popup first
function buyAllItems() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification("Please login to purchase items", "warning");
        return;
    }
    
    let cart = getCart();
    if (!cart || cart.length === 0) {
        showNotification("Your cart is empty", "warning");
        return;
    }
    
    // Filter unpurchased items
    const unpurchasedItems = cart.filter(item => !item.purchased);
    if (unpurchasedItems.length === 0) {
        showNotification("All items are already purchased!", "info");
        return;
    }
    
    const totalAmount = unpurchasedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    swal({
        title: "Buy All Remaining Items?",
        text: `Total amount: $${totalAmount.toFixed(2)} for ${unpurchasedItems.length} items. You'll need to provide shipping address.`,
        icon: "info",
        buttons: ["Cancel", "Continue"]
    }).then(confirmed => {
        if (confirmed) {
            // Store items for bulk purchase
            currentBulkPurchaseItems = unpurchasedItems;
            // Show address popup for bulk purchase
            showAddressPopup();
        }
    });
}

// Complete bulk purchase after address is provided
function completeBulkPurchase(addressData) {
    if (!currentBulkPurchaseItems || currentBulkPurchaseItems.length === 0) {
        showNotification("No items selected for bulk purchase", "error");
        return;
    }
    
    let cart = getCart();
    let purchasedItems = getPurchasedItems();
    const totalAmount = currentBulkPurchaseItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Mark all unpurchased items as purchased
    currentBulkPurchaseItems.forEach(item => {
        // Find item in cart and mark as purchased
        const cartItem = cart.find(c => c.id === item.id);
        if (cartItem) {
            cartItem.purchased = true;
        }
        
        // Add to purchased items list if not already there
        const existingPurchased = purchasedItems.find(p => p.id === item.id);
        if (!existingPurchased) {
            purchasedItems.push({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                purchaseDate: new Date().toISOString(),
                shippingAddress: addressData
            });
        }
        
        // Disable buttons
        disableProductButtons(item.id);
    });
    
    // Save updated data
    saveCart(cart);
    savePurchasedItems(purchasedItems);
    
    // Save address for future use
    saveUserAddress(addressData);
    
    // Close popup
    closeAddressPopup();
    
    // Clear bulk purchase items
    currentBulkPurchaseItems = null;
    
    swal({
        title: "Purchase Successful!",
        text: `Thank you for purchasing all items! Total: $${totalAmount.toFixed(2)}. Your orders will be shipped to ${addressData.city}, ${addressData.country}. جميع المنتجات جاية في الطريق.`,
        icon: "success",
        timer: 4000,
        buttons: false
    });
    
    // Re-render to update UI
    renderCart();
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

// Save user address to localStorage
function saveUserAddress(addressData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const addressKey = `address_${currentUser.id}`;
        localStorage.setItem(addressKey, JSON.stringify(addressData));
    } catch (error) {
        console.error("Error saving address:", error);
    }
}

// Get saved user address from localStorage
function getSavedAddress() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    try {
        const addressKey = `address_${currentUser.id}`;
        const savedAddress = localStorage.getItem(addressKey);
        return savedAddress ? JSON.parse(savedAddress) : null;
    } catch (error) {
        console.error("Error loading saved address:", error);
        return null;
    }
}

// Load saved address into form
function loadSavedAddress() {
    const savedAddress = getSavedAddress();
    if (savedAddress) {
        document.getElementById('fullName').value = savedAddress.fullName || '';
        document.getElementById('phone').value = savedAddress.phone || '';
        document.getElementById('city').value = savedAddress.city || '';
        document.getElementById('state').value = savedAddress.state || '';
        document.getElementById('street').value = savedAddress.street || '';
        document.getElementById('zipCode').value = savedAddress.zipCode || '';
        document.getElementById('country').value = savedAddress.country || 'Egypt';
        document.getElementById('additionalNotes').value = savedAddress.additionalNotes || '';
    }
}

// Handle address form submission
function handleAddressFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const addressData = {
        fullName: formData.get('fullName').trim(),
        phone: formData.get('phone').trim(),
        city: formData.get('city').trim(),
        state: formData.get('state').trim(),
        street: formData.get('street').trim(),
        zipCode: formData.get('zipCode').trim(),
        country: formData.get('country').trim(),
        additionalNotes: formData.get('additionalNotes').trim()
    };
    
    // Validate required fields
    if (!addressData.fullName || !addressData.phone || !addressData.city || !addressData.street || !addressData.country) {
        showNotification("Please fill in all required fields", "warning");
        return;
    }
    
    // Determine if this is a single item or bulk purchase
    if (currentBulkPurchaseItems && currentBulkPurchaseItems.length > 0) {
        // Complete bulk purchase
        completeBulkPurchase(addressData);
    } else if (currentPurchaseItem) {
        // Complete single item purchase
        completePurchase(addressData);
    } else {
        showNotification("No items selected for purchase", "error");
        closeAddressPopup();
    }
}

// Initialize address form when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Add event listener to address form after a delay to ensure it's loaded
    setTimeout(() => {
        const addressForm = document.getElementById('address-form');
        if (addressForm) {
            addressForm.addEventListener('submit', handleAddressFormSubmit);
        }
    }, 100);
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
window.showAddressPopup = showAddressPopup;
window.closeAddressPopup = closeAddressPopup;
