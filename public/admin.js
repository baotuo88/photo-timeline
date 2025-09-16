// admin.js (最终升级版)
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button');
    submitButton.disabled = true;
    submitButton.textContent = '上传中...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();

        if (response.ok) {
            Toastify({ text: result.message, duration: 3000, gravity: "top", position: "center", backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)" }).showToast();
            form.reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        Toastify({ text: `上传失败: ${error.message}`, duration: 3000, gravity: "top", position: "center", backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)" }).showToast();
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '上 传';
    }
});