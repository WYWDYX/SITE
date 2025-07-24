// 初始化逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 渐入动画
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => {
        el.style.opacity = 1;
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 书籍卡片动画
    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});