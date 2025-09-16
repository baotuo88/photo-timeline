// photo-detail.js (最终完整版)
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const photoId = parseInt(params.get('id'), 10); // 转换为数字类型
    const container = document.getElementById('photo-container');

    if (!photoId) {
        container.innerHTML = '<h2>照片未找到</h2>';
        return;
    }

    fetch('/api/photos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 1. 找到当前正在查看的主照片
            const mainPhoto = data.find(p => p.id === photoId);

            if (mainPhoto) {
                // 2. 填充主照片的信息
                document.title = `照片详情 - ${mainPhoto.date}`;
                document.getElementById('photo-date').textContent = mainPhoto.date;
                document.getElementById('photo-image').src = mainPhoto.imageUrl;
                document.getElementById('photo-image').alt = mainPhoto.description.substring(0, 50);
                document.getElementById('photo-description').textContent = mainPhoto.description;

                // 3. *** 新增：查找同一天的所有其他照片 (siblings) ***
                const siblingPhotos = data.filter(p => 
                    p.date === mainPhoto.date && p.id !== mainPhoto.id
                );

                // 4. *** 新增：如果存在同日照片，则渲染它们 ***
                const siblingContainer = document.getElementById('sibling-photos-container');
                if (siblingPhotos.length > 0) {
                    // 创建缩略图网格的 HTML
                    const thumbnailsHtml = siblingPhotos.map(photo => `
                        <a href="photo.html?id=${photo.id}" class="sibling-photo-item">
                            <img src="${photo.imageUrl}" alt="${photo.description.substring(0, 30)}">
                        </a>
                    `).join('');

                    // 将标题和网格一起放入容器
                    siblingContainer.innerHTML = `
                        <h3>当天其他照片：</h3>
                        <div class="sibling-photos-grid">
                            ${thumbnailsHtml}
                        </div>
                    `;
                } else {
                    // 如果没有，则清空容器
                    siblingContainer.innerHTML = '';
                }

            } else {
                container.innerHTML = '<h2>照片不存在</h2>';
            }
        })
        .catch(error => {
            console.error('无法加载照片详情:', error);
            container.innerHTML = '<h2>加载照片详情失败，请稍后重试。</h2>';
        });
});