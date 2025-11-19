let currentProducts = [];
let editingProductId = null;

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

    loadCategories();
    loadProducts();

    document.getElementById('adminLogout').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
});

function loadCategories() {
    fetch('/api/products/categories')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const categorySelect = document.getElementById('category');
                const filterSelect = document.getElementById('categoryFilter');
                
                data.data.forEach(category => {
                    const option1 = document.createElement('option');
                    option1.value = category.category_id;
                    option1.textContent = category.category_name;
                    categorySelect.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = category.category_id;
                    option2.textContent = category.category_name;
                    filterSelect.appendChild(option2);
                });
            }
        })
        .catch(error => console.error('Error loading categories:', error));
}

function loadProducts() {
    const token = localStorage.getItem('token');
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;

    let url = '/api/admin/products?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${category}&`;

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentProducts = data.data;
            displayProducts(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading products:', error);
        showAlert('Failed to load products', 'error');
    });
}

function displayProducts(products) {
    const container = document.getElementById('productsTable');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="loading">No products found</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td>
                            ${product.image_url ? 
                                `<img src="${product.image_url}" class="product-image-preview" alt="${product.product_name}">` : 
                                '<div class="no-image-placeholder">No Image</div>'}
                        </td>
                        <td>${product.product_id}</td>
                        <td class="product-name-cell">${product.product_name}</td>
                        <td>${product.brand || 'N/A'}</td>
                        <td>${product.category_name || 'N/A'}</td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td>
                            <span class="stock-badge ${getStockClass(product.stock_quantity)}">
                                ${product.stock_quantity}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${product.is_active ? 'status-delivered' : 'status-cancelled'}">
                                ${product.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.product_id})">Edit</button>
                                <button class="btn btn-secondary btn-sm" onclick="deleteProduct(${product.product_id})">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getStockClass(quantity) {
    if (quantity >= 20) return 'stock-high';
    if (quantity >= 10) return 'stock-medium';
    return 'stock-low';
}

function applyFilters() {
    loadProducts();
}

function openAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('existingImageUrl').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('isActive').checked = true;
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size must be less than 5MB', 'error');
            input.value = '';
            preview.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

function handleProductSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    
    formData.append('product_name', document.getElementById('productName').value);
    formData.append('brand', document.getElementById('brand').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('category_id', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('stock_quantity', document.getElementById('stockQuantity').value);
    formData.append('is_featured', document.getElementById('isFeatured').checked ? '1' : '0');
    formData.append('is_active', document.getElementById('isActive').checked ? '1' : '0');

    const specsValue = document.getElementById('specifications').value.trim();
    if (specsValue) {
        try {
            JSON.parse(specsValue);
            formData.append('specifications', specsValue);
        } catch (error) {
            showAlert('Invalid JSON format in specifications', 'error');
            return;
        }
    }

    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const token = localStorage.getItem('token');
    const isEditing = editingProductId !== null;
    const url = isEditing ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            closeProductModal();
            loadProducts();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving product:', error);
        showAlert('Failed to save product', 'error');
    });
}

function editProduct(productId) {
    const token = localStorage.getItem('token');

    fetch(`/api/admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const product = data.data;
            editingProductId = productId;

            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = product.product_id;
            document.getElementById('productName').value = product.product_name;
            document.getElementById('brand').value = product.brand || '';
            document.getElementById('model').value = product.model || '';
            document.getElementById('category').value = product.category_id;
            document.getElementById('description').value = product.description || '';
            document.getElementById('price').value = product.price;
            document.getElementById('stockQuantity').value = product.stock_quantity;
            document.getElementById('isFeatured').checked = product.is_featured;
            document.getElementById('isActive').checked = product.is_active;
            document.getElementById('existingImageUrl').value = product.image_url || '';

            if (product.specifications) {
                try {
                    const specs = typeof product.specifications === 'string' 
                        ? product.specifications 
                        : JSON.stringify(JSON.parse(product.specifications), null, 2);
                    document.getElementById('specifications').value = specs;
                } catch (e) {
                    document.getElementById('specifications').value = '';
                }
            } else {
                document.getElementById('specifications').value = '';
            }

            if (product.image_url) {
                document.getElementById('previewImg').src = product.image_url;
                document.getElementById('imagePreview').style.display = 'block';
            } else {
                document.getElementById('imagePreview').style.display = 'none';
            }

            document.getElementById('productModal').classList.add('active');
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading product:', error);
        showAlert('Failed to load product details', 'error');
    });
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to deactivate this product?')) {
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
            showAlert(data.message, 'success');
            loadProducts();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        showAlert('Failed to delete product', 'error');
    });
}
