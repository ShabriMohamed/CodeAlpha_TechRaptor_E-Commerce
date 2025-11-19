document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        location.href = '/login';
        return;
    }
    loadCart();
});

function loadCart() {
    const token = localStorage.getItem('token');

    fetch('/api/cart', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCart(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading cart:', error);
        showAlert('Failed to load cart', 'error');
    });
}

function displayCart(cartData) {
    const container = document.getElementById('cartItems');
    
    if (cartData.items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3 style="color: var(--gray-600); margin-bottom: 1rem;">Your cart is empty</h3>
                <a href="/products" class="btn">Start Shopping</a>
            </div>
        `;
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }

    container.innerHTML = cartData.items.map(item => `
        <div class="cart-item" id="cart-item-${item.cart_id}">
            <div class="cart-item-image">
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.product_name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: var(--gray-100); font-size: 2rem; color: var(--gray-300);">&#9632;</div>'}
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.product_name}</h3>
                <div class="product-brand" style="margin-bottom: 0.5rem;">${item.brand || 'Tech'}</div>
                <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.cart_id}, ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock_quantity}" 
                           onchange="updateQuantity(${item.cart_id}, this.value)" readonly>
                    <button class="quantity-btn" onclick="updateQuantity(${item.cart_id}, ${item.quantity + 1})" 
                            ${item.quantity >= item.stock_quantity ? 'disabled' : ''}>+</button>
                    <button class="btn btn-secondary" onclick="removeFromCart(${item.cart_id})" 
                            style="margin-left: 1rem; padding: 0.5rem 1rem;">Remove</button>
                </div>
                ${item.quantity >= item.stock_quantity ? 
                    '<small style="color: var(--gray-600); margin-top: 0.5rem; display: block;">Maximum stock reached</small>' : ''}
            </div>
            <div style="font-size: 1.25rem; font-weight: 700;">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    document.getElementById('subtotal').textContent = `$${parseFloat(cartData.total).toFixed(2)}`;
    document.getElementById('total').textContent = `$${parseFloat(cartData.total).toFixed(2)}`;
    document.getElementById('checkoutBtn').disabled = false;
}

function updateQuantity(cartId, newQuantity) {
    const token = localStorage.getItem('token');
    const quantity = parseInt(newQuantity);

    if (quantity < 1) {
        removeFromCart(cartId);
        return;
    }

    fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cart_id: cartId, quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCart();
            updateCartBadge();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating cart:', error);
        showAlert('Failed to update cart', 'error');
    });
}

function removeFromCart(cartId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    const token = localStorage.getItem('token');

    fetch(`/api/cart/remove/${cartId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Item removed from cart', 'success');
            loadCart();
            updateCartBadge();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error removing item:', error);
        showAlert('Failed to remove item', 'error');
    });
}

function proceedToCheckout() {
    location.href = '/checkout';
}
