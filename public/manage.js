// manage.js (最终完整版)
document.addEventListener('DOMContentLoaded', () => {
    const photoListContainer = document.getElementById('photo-list-container');
    const modal = document.getElementById('edit-modal');
    const closeModalButton = document.querySelector('.close-button');
    const editForm = document.getElementById('edit-form');
    let datePicker;

    // 1. Load and display all photos
    async function loadPhotos() {
        try {
            const response = await fetch('/api/photos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const photos = await response.json();
            
            photoListContainer.innerHTML = '';
            if (photos.length === 0) {
                photoListContainer.innerHTML = '<p style="text-align:center;">还没有照片，快去上传吧！</p>';
                return;
            }

            photos.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'manage-list-item';
                item.setAttribute('data-id', photo.id);
                item.innerHTML = `
                    <img src="${photo.imageUrl}" alt="Photo thumbnail" class="manage-thumbnail">
                    <div class="manage-item-content">
                        <h3 id="date-${photo.id}">${photo.date}</h3>
                        <p id="desc-${photo.id}">${photo.description.substring(0, 100)}${photo.description.length > 100 ? '...' : ''}</p>
                    </div>
                    <div class="manage-item-actions">
                        <button class="edit-btn" title="Edit"><i class='bx bxs-edit-alt'></i></button>
                        <button class="delete-btn" title="Delete"><i class='bx bxs-trash'></i></button>
                    </div>
                `;
                // 存储完整描述以供编辑时使用
                item.querySelector('.manage-item-content p')._fullDescription = photo.description;
                photoListContainer.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load photos:', error);
            photoListContainer.innerHTML = '<p>加载照片失败，请刷新页面。</p>';
        }
    }

    // 2. Handle click events (edit or delete)
    photoListContainer.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        
        if (editButton) {
            const item = editButton.closest('.manage-list-item');
            const photoId = item.getAttribute('data-id');
            openEditModal(photoId);
        }

        if (deleteButton) {
            const item = deleteButton.closest('.manage-list-item');
            const photoId = item.getAttribute('data-id');
            deletePhoto(photoId, item);
        }
    });

    // 3. Open and prepare the edit modal
    function openEditModal(id) {
        const date = document.getElementById(`date-${id}`).textContent;
        const descriptionElement = document.getElementById(`desc-${id}`);
        const fullDescription = descriptionElement._fullDescription || descriptionElement.textContent;

        document.getElementById('edit-photo-id').value = id;
        document.getElementById('edit-description').value = fullDescription;
        
        const dateInput = document.getElementById('edit-date');
        if (datePicker) {
            datePicker.destroy();
        }
        datePicker = flatpickr(dateInput, {
            locale: "zh",
            dateFormat: "Y年m月d日",
            defaultDate: date
        });

        modal.style.display = 'block';
    }

    // 4. Close the modal
    closeModalButton.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
    
    // 5. Submit the edit form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-photo-id').value;
        const date = document.getElementById('edit-date').value;
        const description = document.getElementById('edit-description').value;

        try {
            const response = await fetch(`/api/photos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description })
            });

            // 如果登录过期，跳转到登录页
            if (response.status === 401) {
                alert('登录已过期，请重新登录。');
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) {
                throw new Error('更新失败');
            }
            
            document.getElementById(`date-${id}`).textContent = date;
            const descElement = document.getElementById(`desc-${id}`);
            descElement.textContent = `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`;
            descElement._fullDescription = description;
            
            modal.style.display = 'none';
        } catch (error) {
            console.error('Failed to update photo info:', error);
            alert('更新失败，请重试。');
        }
    });

    // 6. Delete a photo
    async function deletePhoto(id, element) {
        if (!confirm('确定要永久删除这张照片及其信息吗？此操作无法撤销。')) {
            return;
        }

        try {
            const response = await fetch(`/api/photos/${id}`, {
                method: 'DELETE'
            });

            // 如果登录过期，跳转到登录页
            if (response.status === 401) {
                alert('登录已过期，请重新登录。');
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) {
                throw new Error('删除失败');
            }
            
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '0';
            element.style.transform = 'translateX(-20px)';
            setTimeout(() => element.remove(), 500);

        } catch (error) {
            console.error('Failed to delete photo:', error);
            alert('删除失败，请重试。');
        }
    }

    loadPhotos();
});