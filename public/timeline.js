// timeline.js (最终完整版)

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('timeline-container');

    // 1. 获取照片数据
    try {
        const response = await fetch('/api/photos');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // 2. *** 新增：将照片按日期分组 ***
        const groupedPhotos = data.reduce((acc, photo) => {
            const date = photo.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(photo);
            return acc;
        }, {});

        // 3. *** 新增：对日期进行排序（最新的日期在最前面）***
        const sortedDates = Object.keys(groupedPhotos).sort((a, b) => {
            // 将 "YYYY年MM月DD日" 格式转为可比较的 Date 对象
            const dateA = new Date(a.replace('年', '-').replace('月', '-').replace('日', ''));
            const dateB = new Date(b.replace('年', '-').replace('月', '-').replace('日', ''));
            return dateB - dateA;
        });

        // 4. *** 修改：遍历排序后的日期来生成时间轴 ***
        sortedDates.forEach((date, index) => {
            const photosForDay = groupedPhotos[date];
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';

            if (index % 2 === 0) {
                timelineItem.classList.add('left');
            } else {
                timelineItem.classList.add('right');
            }

            // 为节点内的每张图片生成一个链接和缩略图
            const photosHtml = photosForDay.map(photo => `
                <a href="photo.html?id=${photo.id}" class="timeline-photo-link">
                    <img src="${photo.imageUrl}" alt="${photo.description.substring(0, 30)}">
                </a>
            `).join('');

            // 创建包含日期和所有照片的HTML结构
            timelineItem.innerHTML = `
                <div class="item-content grouped">
                    <h3>${date}</h3>
                    <div class="timeline-photo-grid">
                        ${photosHtml}
                    </div>
                </div>
            `;
            container.appendChild(timelineItem);
        });

        // (滚动逻辑保持不变)
        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('id');
        if (targetId) {
            // 由于现在是分组的，我们需要找到包含目标ID的那个时间轴节点
            const targetLink = document.querySelector(`.timeline-photo-link[href="photo.html?id=${targetId}"]`);
            if (targetLink) {
                const targetItem = targetLink.closest('.timeline-item');
                if (targetItem) {
                    targetItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    // 高亮整个节点
                    targetItem.classList.add('highlight');
                    setTimeout(() => {
                        targetItem.classList.remove('highlight');
                    }, 2000);
                }
            }
        }

    } catch (error) {
        console.error('Failed to load timeline photos:', error);
        container.innerHTML = '<p style="text-align:center;">无法加载时间轴数据，请稍后重试。</p>';
    }
});