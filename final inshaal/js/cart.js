const cartContainer = document.getElementById("cart-container");
const totalElement = document.getElementById("total");

function renderCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartContainer.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src="${item.image}" alt="${item.title}" width="80">
            <h3>${item.title}</h3>
            <p > Price: <span class="price">$${item.price}</span></p>
            <div class="actions">
                <button class="btn down non"><i class="fa-solid fa-minus"></i></button>
                <span class="qty">${item.quantity}</span>
                <button class="btn up non"><i class="fa-solid fa-plus"></i></button>
                <button class="buy non">Buy Now</button>
                <button class="delete non">Delete</button>
            </div>
            <p>Subtotal: <span class="subtotal">$ ${(item.price * item.quantity).toFixed(2)}</span></p>
        `;
        cartContainer.appendChild(div);

        const qtySpan = div.querySelector(".qty");
        const subtotalSpan = div.querySelector(".subtotal");

        function updateAll() {
            localStorage.setItem("cart", JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: item.id } }));
            subtotalSpan.textContent = (item.price * item.quantity).toFixed(2);
            updateTotal();
        }

        div.querySelector(".up").addEventListener("click", () => {
            const stock = JSON.parse(localStorage.getItem("products")).find(p => p.id === item.id).stock;
            if (item.quantity < stock) {
                item.quantity++;
                qtySpan.textContent = item.quantity;
                updateAll();
            } else swal("Warning", "Reached maximum stock!", "warning");
        });

        div.querySelector(".down").addEventListener("click", () => {
            if (item.quantity > 1) {
                item.quantity--;
                qtySpan.textContent = item.quantity;
                updateAll();
            }
        });

        div.querySelector(".delete").addEventListener("click", () => {
            swal({
                title: `Remove "${item.title}" from cart?`,
                icon: "warning",
                buttons: ["No", "Yes, remove it!"],
                dangerMode: true
            }).then(confirmed => {
                if (confirmed) {
                    cart.splice(index, 1);
                    updateAll();
                    renderCart();
                }
            });
        });

        div.querySelector(".buy").addEventListener("click", () => {
            const buttons = div.querySelectorAll(".non");
            buttons.forEach(btn => btn.disabled = true);
            div.querySelector(".buy").textContent = "المنتج جاي في الطريق";
            swal("المنتج جاي في الطريق", "Thanks for using our site!", "success");
        });

        total += item.price * item.quantity;
    });

    updateTotal();
}

function updateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalElement.innerText = "Total: $" + total.toFixed(2);
}

// Update product cards and modal when cart changes
window.addEventListener("cartUpdated", e => {
    if (e.detail?.productId) {
        updateProductQuantityUI(e.detail.productId);
    } else {
        JSON.parse(localStorage.getItem("products")).forEach(p => updateProductQuantityUI(p.id));
    }
});

renderCart();
