// Basic JavaScript for initial interactions - Can be expanded or replaced by a framework like React/Vue/Angular

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const themeSwitcher = document.getElementById('theme-switcher');
    const languageSelector = document.getElementById('language-selector'); // Placeholder for now
    const navLinks = document.querySelectorAll('#main-header nav ul li a');
    const sections = document.querySelectorAll('main section');
    const checkoutLink = document.querySelector('a[href="#checkout"]');
    const checkoutPage = document.getElementById('checkout-page');
    const productSection = document.getElementById('products');

    // --- Loading Screen ---
    if (loadingScreen) {
        window.addEventListener('load', () => {
            setTimeout(() => { // Simulate loading time
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500); // Match CSS transition time
                }
            }, 1500); // Adjust as needed
        });
    }


    // --- Theme Switcher ---
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            // Optionally save theme preference to localStorage
            if (document.body.classList.contains('light-theme')) {
                localStorage.setItem('hovani-theme', 'light');
                themeSwitcher.textContent = "Dark Mode";
            } else {
                localStorage.setItem('hovani-theme', 'dark');
                themeSwitcher.textContent = "Light Mode";
            }
        });

        // Apply saved theme on load
        const savedTheme = localStorage.getItem('hovani-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeSwitcher.textContent = "Dark Mode";
        } else {
             themeSwitcher.textContent = "Light Mode"; // Default is dark
        }
    }

    // --- Smooth Scrolling and Active Nav Link ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href === '#checkout') {
                e.preventDefault();
                sections.forEach(sec => sec.style.display = 'none');
                if (checkoutPage) checkoutPage.style.display = 'block';
                document.querySelector('#main-header nav ul li a.active')?.classList.remove('active');
                this.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for checkout
                return;
            }


            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    // Hide all sections, then show the target one
                    sections.forEach(sec => {
                        if(sec.id !== 'loading-screen' && sec.id !== 'checkout-page') sec.style.display = 'none';
                    });
                     if (checkoutPage) checkoutPage.style.display = 'none'; // Ensure checkout is hidden

                    targetSection.style.display = 'block';


                    // Scroll to the section
                    // window.scrollTo({
                    //     top: targetSection.offsetTop - document.getElementById('main-header').offsetHeight,
                    //     behavior: 'smooth'
                    // });

                    // Update active link
                    document.querySelector('#main-header nav ul li a.active')?.classList.remove('active');
                    this.classList.add('active');
                }
            }
        });
    });

    // Set initial active link and section (e.g., Home)
    const initialLink = document.querySelector('a[href="#home"]');
    const homeSection = document.getElementById('home');
    if (initialLink && homeSection) {
        sections.forEach(sec => {
             if(sec.id !== 'loading-screen' && sec.id !== 'checkout-page' && sec.id !== 'home') sec.style.display = 'none';
        });
        if (checkoutPage) checkoutPage.style.display = 'none';
        homeSection.style.display = 'block';
        initialLink.classList.add('active');
    }


    // --- Language Selector (Placeholder) ---
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            console.log(`Language selected: ${e.target.value}`);
            // Future: Implement language switching logic
            alert(`Language switching to ${e.target.value} is not yet implemented.`);
        });
    }

    // --- Placeholder for Product Rendering ---
    const productsContainer = document.querySelector('#products'); // Target the section directly for now
    const sampleProducts = [
        { id: 1, name: 'Modern Art T-Shirt', price: '29.99', image: 'images/product1.jpg', description: 'A stylish t-shirt with a unique modern art print.' },
        { id: 2, name: 'Abstract Sculpture', price: '199.99', image: 'images/product2.jpg', description: 'Elegant abstract sculpture for your home or office.' },
        { id: 3, name: 'Minimalist Watch', price: '75.50', image: 'images/product3.jpg', description: 'Sleek and modern minimalist watch.' },
        { id: 4, name: 'Geometric Pattern Cushion', price: '24.00', image: 'images/product4.jpg', description: 'Comfortable cushion with a striking geometric pattern.' },
        { id: 5, name: 'Futuristic Desk Lamp', price: '89.99', image: 'images/product5.jpg', description: 'A desk lamp with a futuristic and functional design.' },
        { id: 6, name: 'Cyberpunk Jacket', price: '150.00', image: 'images/product6.jpg', description: 'Limited edition cyberpunk style jacket.' },
    ];

    function renderProducts() {
        if (!productsContainer) {
            console.error("Products container not found!");
            return;
        }
        // Ensure the product section has a dedicated div for products if not already structured
        let productGrid = productsContainer.querySelector('.product-grid');
        if (!productGrid) {
            productGrid = document.createElement('div');
            productGrid.className = 'product-grid';
            // Insert after the h2 or at the beginning if h2 doesn't exist
            const h2 = productsContainer.querySelector('h2');
            if (h2) {
                h2.insertAdjacentElement('afterend', productGrid);
            } else {
                productsContainer.prepend(productGrid);
            }
        } else {
            productGrid.innerHTML = ''; // Clear existing products before re-rendering
        }


        sampleProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'card product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price}</p>
                    <p class="product-description">${product.description.substring(0, 60)}...</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }

    if (productSection && window.location.hash === '#products' || window.location.hash === '') {
        renderProducts();
    }

    // Re-render products if navigating to the products tab
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#products') {
                 // Ensure other main sections are hidden and products section is shown
                document.getElementById('home').style.display = 'none';
                document.getElementById('single-product-page').style.display = 'none';
                if(checkoutPage) checkoutPage.style.display = 'none';
                productSection.style.display = 'block';
                setTimeout(renderProducts, 0); // Ensure section is visible before rendering
            } else if (href === '#home') {
                document.getElementById('products').style.display = 'none';
                document.getElementById('single-product-page').style.display = 'none';
                 if(checkoutPage) checkoutPage.style.display = 'none';
                document.getElementById('home').style.display = 'block';
            }
            // Checkout link is handled in the main navLinks loop
        });
    });

    const singleProductPage = document.getElementById('single-product-page');
    const backToProductsButton = document.getElementById('back-to-products');

    function showSingleProductPage(productId) {
        const product = sampleProducts.find(p => p.id === parseInt(productId));
        if (!product || !singleProductPage) return;

        // Hide other sections
        document.getElementById('home').style.display = 'none';
        productSection.style.display = 'none';
        if (checkoutPage) checkoutPage.style.display = 'none';

        // Populate product page
        singleProductPage.querySelector('#main-product-image').src = product.image;
        singleProductPage.querySelector('#main-product-image').alt = product.name;
        singleProductPage.querySelector('#product-detail-name').textContent = product.name;
        singleProductPage.querySelector('.product-detail-price').textContent = `$${product.price}`;
        singleProductPage.querySelector('#product-detail-description').textContent = product.description; // Using full description here
        singleProductPage.querySelector('#add-to-cart-detail').dataset.productId = product.id;
        // singleProductPage.querySelector('#product-category-link').textContent = product.category || 'General';
        // singleProductPage.querySelector('#product-sku').textContent = product.sku || `SKU-${product.id}`;


        singleProductPage.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event delegation for product cards (view details)
    // Adding this to the productGrid after it's populated
    function addEventListenersToProductCards() {
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            productGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (card && !e.target.classList.contains('add-to-cart-btn')) { // Check if not clicking the 'add to cart'
                    const productId = card.querySelector('.add-to-cart-btn').dataset.productId;
                    // Instead of direct call, update hash and let hashchange handler do the work if we want history
                    // For simplicity now, direct call:
                    showSingleProductPage(productId);
                }

                if (e.target.classList.contains('add-to-cart-btn')) {
                    const productId = e.target.dataset.productId;
                    console.log(`Add to cart (from grid): Product ID ${productId}`);
                    // Add to cart logic here
                    alert(`Product ID ${productId} added to cart (from grid - placeholder).`);
                }
            });
        }
    }

    // Modify renderProducts to call addEventListenersToProductCards
    // And also add it after initial render
    const originalRenderProducts = renderProducts;
    renderProducts = function() {
        originalRenderProducts.apply(this, arguments);
        addEventListenersToProductCards();
    }

    // Call it once if products are rendered on initial load
    if (productSection.style.display === 'block' || (window.location.hash === '#products' || window.location.hash === '')) {
         setTimeout(addEventListenersToProductCards, 100); // Ensure grid is populated
    }


    if (backToProductsButton) {
        backToProductsButton.addEventListener('click', () => {
            singleProductPage.style.display = 'none';
            productSection.style.display = 'block';
            // document.querySelector('a[href="#products"]').click(); // Simulate click to handle active states etc.
            // Or simpler:
            document.querySelector('#main-header nav ul li a.active')?.classList.remove('active');
            document.querySelector('a[href="#products"]')?.classList.add('active');
            renderProducts(); // Re-render products on the product page
        });
    }

    // Handle "Add to Cart" from detail page
    const addToCartDetailButton = document.getElementById('add-to-cart-detail');
    if(addToCartDetailButton) {
        addToCartDetailButton.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            const quantity = singleProductPage.querySelector('#quantity').value;
            console.log(`Add to cart (from detail): Product ID ${productId}, Quantity: ${quantity}`);
            alert(`Product ID ${productId} (Quantity: ${quantity}) added to cart (placeholder).`);
        });
    }


    console.log('Hovani Storefront Initialized');
});

// Later, this file would be the entry point for a React/Vue/Angular application.
// For example, with React:
// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './src/App'; // Assuming App.js in src folder
// ReactDOM.render(<App />, document.getElementById('app-root'));

// For now, keeping it simple with vanilla JS for basic interactivity.
