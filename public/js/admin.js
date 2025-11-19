document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        location.href = '/login';
        return;
    }

    const user = getUser();
    if (user.role !== 'admin') {
        showAlert('Access denied. Admin privileges required.', 'error');
        setTimeout(() => location.href = '/', 2000);
        return;
    }

    const page = window.location.pathname.split('/').pop().replace('.html', '');
    
    switch(page) {
        case 'admin':
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadAdminProducts();
            break;
        case 'orders':
            loadAdminOrders();
            break;
    }
});

function loadDashboard() {
    const token = localStorage.getItem('token');

    fetch('/api/admin/dashboard', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayDashboardStats(data.data);
        }
    })
    .catch(error => {
        console.error('Error loading dashboard:', error);
    });
}

function displayDashboardStats(stats) {
    const container = document.getElementById('dashboardStats');
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.orders.total_orders || 0}</div>
            <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.orders.pending_orders || 0}</div>
            <div class="stat-label">Pending Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${parseFloat(stats.orders.total_revenue || 0).toFixed(2)}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalUsers || 0}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalProducts || 0}</div>
            <div class="stat-label">Total Products</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${parseFloat(stats.orders.today_revenue || 0).toFixed(2)}</div>
            <div class="stat-label">Today's Revenue</div>
        </div>
    `;
}

function loadAdminOrders() {
    const token = localStorage.getItem('token');

    fetch('/api/admin/orders', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayAdminOrders(data.data);
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
    });
}

function displayAdminOrders(orders) {
    const container = document.getElementById('ordersTable');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="loading">No orders found</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>#${order.order_id}</td>
                        <td>${order.first_name} ${order.last_name}</td>
                        <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        <td>${new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                            <select onchange="updateOrderStatus(${order.order_id}, this.value)" 
                                    style="padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                                <option value="">Change Status</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateOrderStatus(orderId, status) {
    if (!status) return;

    const token = localStorage.getItem('token');

    fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Order status updated', 'success');
            loadAdminOrders();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating order:', error);
        showAlert('Failed to update order status', 'error');
    });
}

function loadAdminProducts() {
    const token = localStorage.getItem('token');

    fetch('/api/products', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayAdminProducts(data.data);
        }
    })
    .catch(error => {
        console.error('Error loading products:', error);
    });
}

function displayAdminProducts(products) {
    const container = document.getElementById('productsTable');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td>${product.product_id}</td>
                        <td>${product.product_name}</td>
                        <td>${product.brand || 'N/A'}</td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td>${product.stock_quantity}</td>
                        <td>${product.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="deleteProduct(${product.product_id})" 
                                    style="padding: 0.5rem 1rem; font-size: 0.875rem;">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    const token = localStorage.getItem('token');

    fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Product deleted successfully', 'success');
            loadAdminProducts();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        showAlert('Failed to delete product', 'error');
    });
}
