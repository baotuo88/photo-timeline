// main.js (最终升级版)
document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('photo-gallery');
    const yearFilter = document.getElementById('year-filter');
    
    let currentPage = 1;
    const limit = 12;
    let totalPhotos = 0;
    let isLoading = false;

    // --- 初始化灯箱 ---
    const lg = lightGallery(gallery, {
        selector: '.gallery-item',
        plugins: [lgThumbnail],
        speed: 500,
        download: false
    });

    // --- 获取照片数据的函数 (分页) ---
    async function fetchPhotos(page) {
        if (isLoading || (page > 1 && (currentPage - 1) * limit >= totalPhotos)) return;
        isLoading = true;
        // 可以在此处添加加载中的UI提示

        try {
            const response = await fetch(`/api/photos?page=${page}&limit=${limit}`);
            const { photos, total } = await response.json();
            totalPhotos = total;
            displayPhotos(photos);
            currentPage++;
        } catch (error) {
            console.error('无法加载照片数据:', error);
        } finally {
            isLoading = false;
            // 可以在此处移除加载中的UI提示
        }
    }

    // --- 显示照片 ---
    function displayPhotos(photos) {
        const newItems = photos.map(photo => `
            <a href="${photo.imageUrl}" class="gallery-item" data-sub-html="<h4>${photo.date}</h4><p>${photo.description}</p>">
                <img src="${photo.thumbnailUrl}" alt="${photo.description.substring(0, 30)}" loading="lazy">
                <div class="overlay"><span>${photo.date}</span></div>
            </a>
        `).join('');
        
        gallery.insertAdjacentHTML('beforeend', newItems);

        // 每次添加新图片后，需要刷新灯箱实例
        setTimeout(() => {
            lg.refresh();
        }, 100);
    }
    
    // --- 无限滚动 ---
    window.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        // 如果滚动到离底部500px以内，且还有更多照片，则加载
        if (scrollTop + clientHeight >= scrollHeight - 500 && !isLoading) {
            fetchPhotos(currentPage);
        }
    });

    // --- 初始加载 ---
    fetchPhotos(currentPage);

    // 年份筛选功能需要基于数据库进行更复杂的查询，暂时隐藏
    if (yearFilter) {
        yearFilter.style.display = 'none'; 
    }
});