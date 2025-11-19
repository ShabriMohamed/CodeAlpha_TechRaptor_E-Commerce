document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        location.href = '/login';
        return;
    }

    const user = getUser();
    if (user.role === 'admin') {
        location.href = '/admin';
        return;
    }

    loadUserOrders();
});

function loadUserOrders() {
    const token = localStorage.getItem('token');

    fetch('/api/orders', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayOrders(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        showAlert('Failed to load orders', 'error');
    });
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3 style="color: var(--gray-600); margin-bottom: 1rem;">No orders yet</h3>
                <p style="color: var(--gray-500); margin-bottom: 2rem;">Start shopping to place your first order!</p>
                <a href="/products" class="btn">Browse Products</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card" id="order-${order.order_id}">
            <div class="order-header">
                <div>
                    <h3 class="order-id">Order #${order.order_id}</h3>
                    <p class="order-date">${new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
                <div class="order-status-container">
                    <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
                    <p class="order-total">$${parseFloat(order.total_amount).toFixed(2)}</p>
                </div>
            </div>

            <div class="order-info">
                <div class="order-detail">
                    <span class="detail-label">Items:</span>
                    <span class="detail-value">${order.item_count} item(s)</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Payment:</span>
                    <span class="detail-value">${order.payment_method.toUpperCase()}</span>
                </div>
                <div class="order-detail">
                    <span class="detail-label">Payment Status:</span>
                    <span class="payment-status payment-${order.payment_status}">${order.payment_status.toUpperCase()}</span>
                </div>
            </div>

            <div class="order-shipping">
                <strong>Shipping Address:</strong>
                <p>${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}, ${order.shipping_country}</p>
            </div>

            <div class="order-actions">
                <button class="btn btn-secondary" onclick="viewOrderDetails(${order.order_id})">View Details</button>
            </div>
        </div>
    `).join('');
}

function viewOrderDetails(orderId) {
    const token = localStorage.getItem('token');

    fetch(`/api/orders/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showOrderDetailsModal(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading order details:', error);
        showAlert('Failed to load order details', 'error');
    });
}

function showOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const modalBody = document.getElementById('orderDetailsBody');

    modalBody.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--gray-900);">Order Information</h4>
            <div class="order-detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${order.order_id}</span>
            </div>
            <div class="order-detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</span>
            </div>
            <div class="order-detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${order.payment_method.toUpperCase()}</span>
            </div>
            <div class="order-detail-row">
                <span class="detail-label">Payment Status:</span>
                <span class="payment-status payment-${order.payment_status}">${order.payment_status.toUpperCase()}</span>
            </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--gray-900);">Shipping Address</h4>
            <p style="color: var(--gray-700); line-height: 1.6;">
                ${order.shipping_address}<br>
                ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}<br>
                ${order.shipping_country}
            </p>
        </div>

        <div>
            <h4 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--gray-900);">Order Items</h4>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-detail">
                        <div style="display: flex; gap: 1rem; align-items: center; flex: 1;">
                            ${item.image_url ? 
                                `<img src="${item.image_url}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--gray-300);">` :
                                '<div style="width: 60px; height: 60px; background-color: var(--gray-200); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--gray-400);">No Image</div>'}
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: var(--gray-900);">${item.product_name}</div>
                                <div style="color: var(--gray-600); font-size: 0.875rem;">${item.brand || 'Tech'}</div>
                                <div style="color: var(--gray-700); margin-top: 0.25rem;">Quantity: ${item.quantity}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: var(--gray-900);">$${parseFloat(item.price).toFixed(2)}</div>
                            <div style="color: var(--gray-600); font-size: 0.875rem;">Total: $${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="border-top: 2px solid var(--gray-300); margin-top: 1.5rem; padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 700;">
                <span>Total Amount:</span>
                <span>$${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeOrderDetailsModal() {
    document.getElementById('orderDetailsModal').classList.remove('active');
}
