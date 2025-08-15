function copyUrlWithoutHash() {
    // 获取当前URL不带hash的部分
    const urlWithoutHash = window.location.href.split('#')[0];

    // 使用现代剪贴板API
    navigator.clipboard.writeText(urlWithoutHash)
        .then(() => {
            // 复制成功提示（可选）
            alert('链接已复制: ' + urlWithoutHash);
        })
        .catch(err => {
            // 如果现代API失败，使用备用方法
            console.error('现代剪贴板API失败，使用备用方法:', err);
            copyToClipboardFallback(urlWithoutHash);
        });
}

// 备用复制方法（兼容旧浏览器）
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // 防止页面滚动
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert('链接已复制: ' + text);
        } else {
            alert('复制失败，请手动复制链接');
        }
    } catch (err) {
        alert('复制失败，请手动复制链接: ' + text);
    }

    document.body.removeChild(textarea);
}