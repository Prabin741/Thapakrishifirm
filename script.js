document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyAlGgvogc92gzviYrGYRoXezIoSkzaZaJs",
        authDomain: "thapakrishifirm.firebaseapp.com",
        databaseURL: "https://thapakrishifirm-default-rtdb.firebaseio.com",
        projectId: "thapakrishifirm",
        storageBucket: "thapakrishifirm.firebasestorage.app",
        messagingSenderId: "58538789662",
        appId: "1:58538789662:web:92589a52fc09406ea2170f",
        measurementId: "G-G6ZF0LERRT"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- DOM Elements ---
    const showOrderFormBtn = document.getElementById('showOrderFormBtn');
    const showOrderFormBtn2 = document.getElementById('showOrderFormBtn2');
    const orderFormContainer = document.getElementById('orderFormContainer');
    const milkQuantityInput = document.getElementById('milk-quantity');
    const fishQuantityInput = document.getElementById('fish-quantity');
    const orderTotalSpan = document.getElementById('orderTotal');
    const milkPriceDisplay = document.getElementById('milkPriceDisplay');
    const fishPriceDisplay = document.getElementById('fishPriceDisplay');
    const milkPriceForm = document.getElementById('milkPrice');
    const fishPriceForm = document.getElementById('fishPrice');
    const orderProductButtons = document.querySelectorAll('.order-product-button');
    const orderForm = document.getElementById('thapaOrderForm');

    // --- Product Prices ---
    const milkPricePerLiter = 75;
    const fishPricePerKg = 300;

    // --- Functions ---
    function displayPrices() {
        milkPriceDisplay.textContent = milkPricePerLiter.toFixed(2);
        fishPriceDisplay.textContent = fishPricePerKg.toFixed(2);
        milkPriceForm.textContent = milkPricePerLiter.toFixed(2);
        fishPriceForm.textContent = fishPricePerKg.toFixed(2);
    }

    function calculateOrderTotal() {
        const milkQty = parseFloat(milkQuantityInput.value) || 0;
        const fishQty = parseFloat(fishQuantityInput.value) || 0;
        const total = (milkQty * milkPricePerLiter) + (fishQty * fishPricePerKg);
        orderTotalSpan.textContent = total.toFixed(2);
    }

    function showOrderForm() {
        orderFormContainer.classList.remove('hidden-form');
        orderFormContainer.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('customer-name').focus();
    }

    function handleProductOrder(e) {
        const product = e.target.dataset.product;
        showOrderForm();
        if (product === 'milk') milkQuantityInput.value = 1;
        if (product === 'fish') fishQuantityInput.value = 1;
        calculateOrderTotal();
    }

    function saveOrderToFirebase(data) {
        const ordersRef = database.ref('orders');
        const newOrderRef = ordersRef.push();
        return newOrderRef.set(data)
            .then(() => ({ success: true, orderId: newOrderRef.key }))
            .catch((err) => {
                console.error("Firebase Error:", err);
                return { success: false, error: err.message };
            });
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const milkQty = parseFloat(milkQuantityInput.value) || 0;
        const fishQty = parseFloat(fishQuantityInput.value) || 0;
        const orderData = {
            customer: {
                name: document.getElementById('customer-name').value.trim(),
                phone: document.getElementById('customer-phone').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                address: document.getElementById('delivery-address').value.trim()
            },
            order: {
                milk: {
                    quantity: milkQty,
                    pricePerLiter: milkPricePerLiter,
                    total: milkQty * milkPricePerLiter
                },
                fish: {
                    type: document.getElementById('fish-type').value.trim(),
                    quantity: fishQty,
                    pricePerKg: fishPricePerKg,
                    total: fishQty * fishPricePerKg
                },
                grandTotal: milkQty * milkPricePerLiter + fishQty * fishPricePerKg,
                notes: document.getElementById('order-notes').value.trim()
            },
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: "pending"
        };

        saveOrderToFirebase(orderData).then(result => {
            if (result.success) {
                alert("Your order has been submitted! We’ll contact you soon.");
                orderForm.reset();
                orderTotalSpan.textContent = "0.00";
                orderFormContainer.classList.add('hidden-form');
            } else {
                alert("Error submitting order: " + result.error);
            }
        });
    }

    // --- Event Listeners ---
    showOrderFormBtn?.addEventListener('click', showOrderForm);
    showOrderFormBtn2?.addEventListener('click', showOrderForm);
    milkQuantityInput?.addEventListener('input', calculateOrderTotal);
    fishQuantityInput?.addEventListener('input', calculateOrderTotal);
    orderProductButtons.forEach(btn => btn.addEventListener('click', handleProductOrder));
    orderForm?.addEventListener('submit', handleFormSubmit);

    // --- On Load ---
    displayPrices();
    calculateOrderTotal();
});
document.getElementById('checkOrderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const phone = document.getElementById('phoneInput').value.trim();
    const orderResults = document.getElementById('orderResults');
    orderResults.innerHTML = 'Loading your orders...';

    const ordersRef = firebase.database().ref('orders');
    ordersRef.once('value', (snapshot) => {
        const orders = snapshot.val();
        let results = [];

        for (const id in orders) {
            if (orders[id].customer.phone === phone) {
                results.push({ id, ...orders[id] });
            }
        }

        if (results.length === 0) {
            orderResults.innerHTML = `<p>No orders found for this phone number.</p>`;
            return;
        }

        results.sort((a, b) => b.timestamp - a.timestamp);

        const html = results.map(order => {
            const date = new Date(order.timestamp).toLocaleString();
            return `
                <div class="order-summary">
                    <h3>Order #${order.id.slice(0, 8)} - ${order.status.toUpperCase()}</h3>
                    <p><strong>Date:</strong> ${date}</p>
                    ${order.order.milk.quantity > 0 ? `
                        <p>Milk: ${order.order.milk.quantity} L - रु ${order.order.milk.total.toFixed(2)}</p>` : ''}
                    ${order.order.fish.quantity > 0 ? `
                        <p>Fish: ${order.order.fish.quantity} kg - रु ${order.order.fish.total.toFixed(2)}</p>` : ''}
                    <p><strong>Total:</strong> रु ${order.order.grandTotal.toFixed(2)}</p>
                    ${order.order.notes ? `<p><strong>Notes:</strong> ${order.order.notes}</p>` : ''}
                </div>
            `;
        }).join('');

        orderResults.innerHTML = html;
    });
});