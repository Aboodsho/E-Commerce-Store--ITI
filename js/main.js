
setTimeout(() => {
    swal("Warning", " 😁انا  اسف علي الديزاين ", "warning");
}, 1500);

//active link

const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.addEventListener('click', function() {
            // Remove 'active' class from all links
            links.forEach(l => l.classList.remove('active'));
            // Add 'active' class to the clicked link
            this.classList.add('active');
        });
    });

// slider

var images = [ "imgs/psoter1.webp", 
    "imgs/poster2.jpg",
    "imgs/poster3.jpg" ];
var index = 0; 
var img = document.getElementById("imgslid"); 
function showSlide() { 
    index = (index + 1) % images.length; 
    img.style.opacity = 0; 
    setTimeout(() => {
        img.src = images[index]; 
        img.style.opacity = 1; }, 1000);
} 
setInterval(showSlide, 3000);

var images1 = [ "imgs/about.png", 
    "imgs/about3.jpg",
    "imgs/about2.webp" ];
var index1 = 0; 
var img1 = document.getElementById("bootslider"); 
function showSlide1() { 
    index1 = (index1 + 1) % images1.length; 
    img1.style.opacity = 0; 
    setTimeout(() => {
        img1.src = images1[index1]; 
        img1.style.opacity = 1; }, 1000);
} 
setInterval(showSlide1, 3000);

// products

// buttons
/////  QUANTITY ITEMS

    var up = document.querySelector(".up"),
        down = document.querySelector(".down"),
        input = document.querySelector(".quantity__number");

    function getValue() {
        return parseInt(input.value);
    }

    up.onclick = function (event) {
        input.value = getValue() + 1;
    };
    down.onclick = function (event) {
        if (input.value <= 1) {
            return 1;
        } else {
            input.value = getValue() - 1;
        }

    }






///////////////////
let imgCard=document.querySelector("#imag-card img")
let cardHead=document.querySelector(".card h3")
let cardCon=document.querySelector(".card .content")
let cardPrice=document.querySelector(".card .price")


// fetch('https://fakestoreapi.com/products')
// .then(response => response.json())
// .then(data => {
//     console.log(data)
//     data.forEach(product => {
//         // imgCard.innerHTML=`<img   src="${product.image}" alt="">`
//         imgCard.src=product.image
//         cardHead.innerHTML=product.title
//         cardCon.innerHTML=product.description
//         cardPrice.innerHTML=`${product.price} $`
//     });
// });

//     const container = document.getElementById("products-container");
// document.addEventListener("DOMContentLoaded", () => {
    

//     fetch('https://fakestoreapi.com/products')
//         .then(res => res.json())
//         .then(data => {
//             data.forEach(product => {
//                 // Create card div
//                 const card = document.createElement("div");
//                 card.classList.add("card", "col-md-4", "mb-3");
//                 card.style.width = "18rem";

//                 // Image
//                 const img = document.createElement("img");
//                 img.src = product.image;
//                 img.classList.add("card-img-top");
//                 img.alt = product.title;

//                 // Card body
//                 const cardBody = document.createElement("div");
//                 cardBody.classList.add("card-body");

//                 const title = document.createElement("h5");
//                 title.classList.add("card-title");
//                 title.innerText = product.title;

//                 const desc = document.createElement("p");
//                 desc.classList.add("card-text");
//                 desc.innerText = product.description;

//                 const price = document.createElement("p");
//                 price.classList.add("card-text", "fw-bold");
//                 price.innerText = `${product.price} $`;

//                 // Quantity & add to cart
//                 const quantityDiv = document.createElement("div");
//                 quantityDiv.classList.add("d-flex", "align-items-center", "mb-2");

//                 const input = document.createElement("input");
//                 input.type = "number";
//                 input.min = "1";
//                 input.value = "1";
//                 input.classList.add("form-control", "me-2");
//                 input.style.width = "70px";

//                 const upBtn = document.createElement("button");
//                 upBtn.innerHTML = "+";
//                 upBtn.classList.add("btn", "btn-sm", "btn-outline-secondary", "me-1");

//                 const downBtn = document.createElement("button");
//                 downBtn.innerHTML = "-";
//                 downBtn.classList.add("btn", "btn-sm", "btn-outline-secondary", "me-2");

//                 const addBtn = document.createElement("button");
//                 addBtn.innerText = "Add to Cart";
//                 addBtn.classList.add("btn", "btn-primary");

//                 quantityDiv.append(downBtn, input, upBtn, addBtn);

//                 // Combine card body
//                 cardBody.append(title, desc, price, quantityDiv);
//                 card.append(img, cardBody);
//                 container.appendChild(card);

//                 // Quantity logic
//                 upBtn.addEventListener("click", () => input.value = parseInt(input.value) + 1);
//                 downBtn.addEventListener("click", () => {
//                     if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
//                 });

//                 // Add to cart click (simple console log for demo)
//                 addBtn.addEventListener("click", () => {
//                     console.log(`Added ${input.value} of ${product.title} to cart`);
//                 });
//             });
//         })
//         .catch(err => console.error(err));
// });



