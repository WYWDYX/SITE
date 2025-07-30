// 功能一：当URL包含ID=JGD时显示隐藏元素
document.addEventListener('DOMContentLoaded', function() {
    // 检查URL参数
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('ID') === 'JGD') {
        const targetElement = document.getElementById('JGD');
        if (targetElement) {
            targetElement.style.display = '';
        }
    }
});

// 功能二：长按调试按钮功能
let pressTimer;
const debugButton = document.getElementById('debug');

// 长按开始事件
function startPress(e) {
    // 防止移动端触发页面滚动
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    // 设置1秒后触发长按动作
    pressTimer = setTimeout(function() {
        // 弹出浏览器原生提示
        alert('阅读－隐藏的项目已解锁！');
        
        // 修改目标链接（使用class选择器）
        const readingLinks = document.querySelectorAll('.Reading-a');
        
        readingLinks.forEach(link => {
            // 添加URL参数
            const originalUrl = link.getAttribute('href');
            const separator = originalUrl.includes('?') ? '&' : '?';
            const newUrl = originalUrl + separator + 'ID=JGD';
            
            link.setAttribute('href', newUrl);
        });
    }, 1000); // 1秒长按时间
}

// 长按结束/取消事件
function cancelPress() {
    // 清除长按计时器
    clearTimeout(pressTimer);
}

// 添加事件监听器
if (debugButton) {
    debugButton.addEventListener('mousedown', startPress);
    debugButton.addEventListener('touchstart', startPress);
    debugButton.addEventListener('mouseup', cancelPress);
    debugButton.addEventListener('mouseleave', cancelPress);
    debugButton.addEventListener('touchend', cancelPress);
}