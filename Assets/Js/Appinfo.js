// ==================== 页面加载动画 ====================
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
});

// ==================== 获取顶部栏高度 ====================
const headerHeight = document.querySelector('header')?.offsetHeight || 0;

// ==================== 滚动动画（考虑顶部栏高度 + 延迟随机化） ====================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('scroll-hidden')) {
                entry.target.classList.add('scroll-show');
            }
            if (entry.target.classList.contains('tag-hidden')) {
                entry.target.classList.add('tag-show');
            }
            if (entry.target.classList.contains('icon-hidden')) {
                entry.target.classList.add('icon-show');
            }
        } else {
            // 元素离开视口后回到初始状态
            entry.target.classList.remove('scroll-show', 'tag-show', 'icon-show');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: `-${headerHeight}px 0px 0px 0px` // 避开顶部栏
});

// 监听 section
document.querySelectorAll('.section').forEach(sec => {
    sec.classList.add('scroll-hidden');
    observer.observe(sec);
});

// 监听 tag + 随机延迟
document.querySelectorAll('.tag').forEach((tag, i) => {
    tag.classList.add('tag-hidden');
    tag.style.setProperty('--delay', `${i * 0.05}s`);
    observer.observe(tag);
});

// 监听 icon + 随机延迟
document.querySelectorAll('.material-symbols-outlined').forEach((icon, i) => {
    icon.classList.add('icon-hidden');
    icon.style.setProperty('--delay', `${i * 0.05}s`);
    observer.observe(icon);
});

// ==================== 复制链接功能（带自定义弹窗） ====================
function copyUrlWithoutHash() {
    const urlWithoutHash = window.location.href.split('#')[0];

    navigator.clipboard.writeText(urlWithoutHash)
        .then(() => {
            showCopyToast('链接已复制');
        })
        .catch(err => {
            console.error('现代剪贴板API失败，使用备用方法:', err);
            copyToClipboardFallback(urlWithoutHash);
        });
}

function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyToast('链接已复制');
        } else {
            showCopyToast('复制失败，请手动复制链接', true);
        }
    } catch (err) {
        showCopyToast('复制失败，请手动复制链接', true);
    }

    document.body.removeChild(textarea);
}

// ==================== 自定义提示弹窗 ====================
function showCopyToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `copy-toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    void toast.offsetWidth; // 强制重绘
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}