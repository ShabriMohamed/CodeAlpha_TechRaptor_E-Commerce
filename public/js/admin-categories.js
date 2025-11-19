// Admin Categories Management JavaScript
let currentCategories = [];
let editingCategoryId = null;

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

    document.getElementById('adminLogout').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
});

function loadCategories() {
    const token = localStorage.getItem('token');

    fetch('/api/admin/categories', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentCategories = data.data;
            displayCategories(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading categories:', error);
        showAlert('Failed to load categories', 'error');
    });
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesTable');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="loading">No categories found</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${categories.map(category => `
                    <tr>
                        <td>
                            ${category.image_url ? 
                                `<img src="${category.image_url}" class="category-image-preview" alt="${category.category_name}">` : 
                                '<div class="no-image-placeholder">No Image</div>'}
                        </td>
                        <td>${category.category_id}</td>
                        <td class="category-name-cell">${category.category_name}</td>
                        <td class="category-desc-cell">${category.description || 'N/A'}</td>
                        <td>${category.product_count || 0} products</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-secondary btn-sm" onclick="editCategory(${category.category_id})">Edit</button>
                                <button class="btn btn-secondary btn-sm" onclick="deleteCategory(${category.category_id})">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openAddCategoryModal() {
    editingCategoryId = null;
    document.getElementById('modalTitle').textContent = 'Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('existingImageUrl').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    editingCategoryId = null;
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

function handleCategorySubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    
    formData.append('category_name', document.getElementById('categoryName').value);
    formData.append('description', document.getElementById('description').value);

    const imageFile = document.getElementById('categoryImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const token = localStorage.getItem('token');
    const isEditing = editingCategoryId !== null;
    const url = isEditing ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories';
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
            closeCategoryModal();
            loadCategories();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving category:', error);
        showAlert('Failed to save category', 'error');
    });
}

function editCategory(categoryId) {
    const token = localStorage.getItem('token');

    fetch(`/api/admin/categories/${categoryId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const category = data.data;
            editingCategoryId = categoryId;

            document.getElementById('modalTitle').textContent = 'Edit Category';
            document.getElementById('categoryId').value = category.category_id;
            document.getElementById('categoryName').value = category.category_name;
            document.getElementById('description').value = category.description || '';
            document.getElementById('existingImageUrl').value = category.image_url || '';

            if (category.image_url) {
                document.getElementById('previewImg').src = category.image_url;
                document.getElementById('imagePreview').style.display = 'block';
            } else {
                document.getElementById('imagePreview').style.display = 'none';
            }

            document.getElementById('categoryModal').classList.add('active');
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading category:', error);
        showAlert('Failed to load category details', 'error');
    });
}

function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        return;
    }

    const token = localStorage.getItem('token');

    fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            loadCategories();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting category:', error);
        showAlert('Failed to delete category', 'error');
    });
}
