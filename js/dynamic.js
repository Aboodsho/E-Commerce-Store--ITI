const container = document.getElementById("products-container");
const MAX_STOCK = 8;
let allProducts = [];

// Fetch products
document.addEventListener("DOMContentLoaded", () => {
    fetch('https://fakestoreapi.com/products')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({ ...p, stock: MAX_STOCK }));
            localStorage.setItem("products", JSON.stringify(allProducts));
            renderProducts(allProducts);
            window.dispatchEvent(new Event("cartUpdated")); // initial update
        })
        .catch(err => console.error(err));
});

// Get quantity in cart for a specific product
function getCartQuantity(productId) {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
    const existing = cart.find(item => item.id === productId);
    return existing ? existing.quantity : 0;
}

// Update quantity text in all product cards
function updateProductQuantityUI(productId) {
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        const title = card.querySelector(".card-title");
        const QUANTITY = card.querySelector(".QUANTITY");
        const product = allProducts.find(p => p.title === title.innerText);
        if (product && product.id === productId) {
            const inCart = getCartQuantity(productId);
            QUANTITY.innerText = `QUANTITY: ${product.stock - inCart} Items left`;
        }
    });

    // Update modal if open
    const modalQty = document.querySelector("#product-details .QUANTITY");
    if (modalQty && modalQty.dataset.id == productId) {
        const product = allProducts.find(p => p.id == productId);
        modalQty.innerText = `QUANTITY: ${product.stock - getCartQuantity(productId)} Items left`;
    }
}

// Render all products
function renderProducts(products) {
    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("card");

        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("card-img");
        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.title;
        imgWrapper.appendChild(img);

        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body");

        const title = document.createElement("h5");
        title.classList.add("card-title");
        title.innerText = product.title;

        const price = document.createElement("span");
        price.classList.add("h5");
        price.innerText = `$${product.price}`;

        const QUANTITY = document.createElement("span");
        QUANTITY.classList.add("QUANTITY");
        QUANTITY.dataset.id = product.id;
        QUANTITY.innerHTML = `QUANTITY: <span class="Q">${product.stock - getCartQuantity(product.id)}</span> Items left`;

        cardBody.append(title, price, QUANTITY);

        const cardFooter = document.createElement("div");
        cardFooter.classList.add("card-footer", "d-flex", "justify-content-between", "align-items-center", "bg-light");

        const addBtn = document.createElement("button");
        addBtn.classList.add("btn-primary");
        addBtn.innerHTML = '<i class="fas fa-cart-plus"></i>';

        const counterDiv = document.createElement("div");
        counterDiv.classList.add("quantity__chooseBlock");

        const downBtn = document.createElement("button");
        downBtn.classList.add("down");
        downBtn.innerHTML = '<i class="fa-solid fa-minus"></i>';

        const qtySpan = document.createElement("span");
        qtySpan.classList.add("quantity__number");
        let quantity = 0;
        qtySpan.innerText = quantity;

        const upBtn = document.createElement("button");
        upBtn.classList.add("up");
        upBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';

        counterDiv.append(downBtn, qtySpan, upBtn);
        cardFooter.append(addBtn, counterDiv);
        card.append(imgWrapper, cardBody, cardFooter);
        container.appendChild(card);

        function updateQuantityText() {
            QUANTITY.innerHTML = `QUANTITY: <span class="Q">${product.stock - getCartQuantity(product.id) - quantity}</span> Items left`;
        }

        upBtn.addEventListener("click", () => {
            if (quantity + getCartQuantity(product.id) < product.stock) {
                quantity++;
                qtySpan.innerText = quantity;
                updateQuantityText();
            } else {
                showNotification("Reached maximum stock!", "warning");
            }
        });

        downBtn.addEventListener("click", () => {
            if (quantity > 0) {
                quantity--;
                qtySpan.innerText = quantity;
                updateQuantityText();
            }
        });

        addBtn.addEventListener("click", () => {
            if (typeof getCurrentUser !== 'function') {
                swal({
                    title: "Please Login First!",
                    text: "You need to login to add items to your cart.",
                    icon: "warning",
                    buttons: ["Cancel", "Go to Login"]
                }).then(goToLogin => {
                    if (goToLogin) {
                        window.location.href = 'login.html';
                    }
                });
                return;
            }
            
            const currentUser = getCurrentUser();
            if (!currentUser) {
                swal({
                    title: "Please Login First!",
                    text: "You need to login to add items to your cart.",
                    icon: "warning",
                    buttons: ["Cancel", "Go to Login"]
                }).then(goToLogin => {
                    if (goToLogin) {
                        window.location.href = 'login.html';
                    }
                });
                return;
            }

            if (quantity === 0) {
                showNotification("Select at least 1 item!", "warning");
                return;
            }

            swal({
                title: `Do you want to add ${quantity} × ${product.title} to cart?`,
                icon: "info",
                buttons: ["No", "Yes, add it!"]
            }).then(confirmed => {
                if (confirmed) {
                    if (typeof addToCart === 'function') {
                        addToCart(product, quantity);
                        quantity = 0;
                        qtySpan.innerText = quantity;
                        updateQuantityText();
                        showNotification("Item added to cart!", "success");
                    } else {
                        showNotification("Cart function not available. Please refresh the page.", "error");
                    }
                }
            });
        });

        title.style.cursor = "pointer";
        title.addEventListener("click", () => showModal(product));
    });
}

// Show product modal
function showModal(product) {
    const modal = document.getElementById("productModal");
    const details = document.getElementById("product-details");
    let qty = 0;

    details.innerHTML = `
        <span class="close">&times;</span>
        <img src="${product.image}" alt="${product.title}" style="width:100%;">
        <h4>${product.title}</h4>
        <h4>$${product.price}</h4>
        <h4 class="QUANTITY" data-id="${product.id}">QUANTITY: ${product.stock - getCartQuantity(product.id)} Items left</h4>
        <div class="actions">
            <button class="btn down"><i class="fa-solid fa-minus"></i></button>
            <span class="qty">${qty}</span>
            <button class="btn up"><i class="fa-solid fa-plus"></i></button>
            <button class="add-to-cart-modal"><i class="fas fa-cart-plus"></i></button>
        </div>
    `;
    modal.style.display = "flex";

    const closeBtn = details.querySelector(".close");
    const qtySpanModal = details.querySelector(".qty");
    const upBtn = details.querySelector(".up");
    const downBtn = details.querySelector(".down");

    closeBtn.addEventListener("click", () => modal.style.display = "none");

    function updateQuantityText() {
        details.querySelector(".QUANTITY").innerText = `QUANTITY: ${product.stock - getCartQuantity(product.id) - qty} Items left`;
    }

    upBtn.addEventListener("click", () => {
        if (qty + getCartQuantity(product.id) < product.stock) {
            qty++;
            qtySpanModal.textContent = qty;
            updateQuantityText();
        } else {
            showNotification("Reached maximum stock!", "warning");
        }
    });

    downBtn.addEventListener("click", () => {
        if (qty > 0) {
            qty--;
            qtySpanModal.textContent = qty;
            updateQuantityText();
        }
    });

    details.querySelector(".add-to-cart-modal").addEventListener("click", () => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showNotification("Please login to add items to cart!", "warning");
            return;
        }

        if (qty === 0) {
            showNotification("Select at least 1 item!", "warning");
            return;
        }

        swal({
            title: `Do you want to add ${qty} × ${product.title} to cart?`,
            icon: "info",
            buttons: ["No", "Yes, add it!"]
        }).then(confirmed => {
            if (confirmed) {
                addToCart(product, qty);
                qty = 0;
                qtySpanModal.textContent = qty;
                updateQuantityText();
                showNotification("Item added to cart!", "success");
            }
        });
    });
}

// Close modal on clicking outside
document.addEventListener("click", e => {
    const modal = document.getElementById("productModal");
    if (e.target === modal || e.target.classList.contains("close")) modal.style.display = "none";
});

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        let filtered = [...allProducts];
        const category = btn.dataset.filter;
        const priceSort = btn.dataset.price;

        if (category && category !== "all") {
            filtered = filtered.filter(p => p.category === category);
        }

        if (priceSort === "low") filtered.sort((a, b) => a.price - b.price);
        if (priceSort === "high") filtered.sort((a, b) => b.price - a.price);

        renderProducts(filtered);
        window.dispatchEvent(new Event("cartUpdated")); // Update quantities after render
    });
});

// Listen for cart updates to refresh product quantities
window.addEventListener("cartUpdated", (e) => {
    if (e.detail?.productId) {
        updateProductQuantityUI(e.detail.productId);
    } else {
        // Update all products if no specific product ID
        allProducts.forEach(p => updateProductQuantityUI(p.id));
    }
});

// Listen for authentication changes to update UI
window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") {
        // Re-render products to update quantities when user changes
        setTimeout(() => {
            window.dispatchEvent(new Event("cartUpdated"));
        }, 100);
    }
});

// Export functions for global use
window.updateProductQuantityUI = updateProductQuantityUI;
