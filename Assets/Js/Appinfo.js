document.addEventListener('DOMContentLoaded', () => {
    // 获取URL中的app参数
    const urlParams = new URLSearchParams(window.location.search);
    const appName = urlParams.get('app') || 'config';

    // 构建JSON路径
    const jsonPath = `../Assets/Json/${appName}.json`;
    
    // 创建页面加载完成的Promise
    const pageLoaded = new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
    
    // 创建内容加载完成的Promise
    const contentLoaded = loadAppConfig(jsonPath);
    
    // 等待两者都完成后隐藏加载动画
    Promise.all([pageLoaded, contentLoaded])
        .then(() => {
            const loader = document.getElementById('page-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('加载过程中出错:', error);
            const loader = document.getElementById('page-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        });
});

function loadAppConfig(jsonUrl) {
    return new Promise((resolve, reject) => {
        // 1. 加载JSON文件
        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                // 2. 处理CSS变量
                if (data.cssVariables) {
                    applyCssVariables(data.cssVariables);
                }

                // 3. 更新页面内容
                updatePageContent(data);
                resolve(); // 内容更新完成
            })
            .catch(error => {
                console.error('加载JSON配置失败:', error);
                reject(error);
            });
    });
}

function applyCssVariables(cssVariables) {
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'dynamic-css-variables';

    // 构建CSS内容
    let cssContent = ':root {';
    for (const [variable, value] of Object.entries(cssVariables.light)) {
        cssContent += `${variable}: ${value};`;
    }
    cssContent += '}';

    cssContent += '@media (prefers-color-scheme: dark) {:root {';
    for (const [variable, value] of Object.entries(cssVariables.dark)) {
        cssContent += `${variable}: ${value};`;
    }
    cssContent += '}}';

    // 应用样式
    style.textContent = cssContent;
    document.head.appendChild(style);
}

function updatePageContent(data) {
    const app = data.app || {};
    const screenshots = data.screenshots || {};
    const about = data.about || {};
    const features = data.features || [];
    const info = data.info || {};

    // 更新应用信息
    document.title = `${app.name} 应用详情页`;
    document.querySelector('link[rel="icon"]').href = app.icon;
    document.querySelector('.section_title img').src = app.icon;
    document.querySelector('.section_title h1').textContent = app.name;

    // 更新标签
    const tagsContainer = document.querySelector('div[style*="user-select: none"]');
    tagsContainer.innerHTML = '';
    if (app.tags) {
        app.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }

    // 更新描述
    const description = document.querySelector('#description');
    const descriptionText = document.querySelector('#description-text');
    if (description && descriptionText) {
        description.textContent = app.description;
        descriptionText.textContent = app['description-text'];
    }

    // 更新下载链接
    const downloadLinks = document.querySelectorAll('a[href*=".apk"]');
    downloadLinks.forEach(link => {
        link.href = app.downloadUrl;
    });

    // 更新截图
    const screenshotsElements = document.querySelectorAll('picture');
    screenshotsElements.forEach(picture => {
        const img = picture.querySelector('img');
        const source = picture.querySelector('source');

        if (img) {
            img.src = screenshots.phoneSrc;
            img.alt = screenshots.alt;
        }

        if (source) {
            source.srcset = screenshots.tabletSrc;
        }
    });

    // 更新关于部分
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        aboutSection.querySelector('h2').textContent = about.title || '关于应用';

        const aboutContent = aboutSection.querySelector('div');
        if (aboutContent && about.content) {
            aboutContent.innerHTML = about.content.map(p => `<p>${p}</p>`).join('');
        }
    }

    // 更新功能特性
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        const featureCards = featuresSection.querySelectorAll('.card');
        featureCards.forEach((card, index) => {
            if (features[index]) {
                // 获取现有元素
                const icon = card.querySelector('.material-symbols-outlined');
                const title = card.querySelector('h3');
                const description = card.querySelector('p');

                // 更新图标（保留原始元素）
                if (icon) {
                    icon.textContent = features[index].icon; // 只修改文本内容
                } else {
                    // 如果不存在图标则创建
                    const newIcon = document.createElement('span');
                    newIcon.className = 'material-symbols-outlined';
                    newIcon.textContent = features[index].icon;
                    title.insertBefore(newIcon, title.firstChild);
                }

                // 更新标题文本（不破坏DOM结构）
                const titleTextNodes = Array.from(title.childNodes).filter(
                    node => node.nodeType === Node.TEXT_NODE
                );

                if (titleTextNodes.length > 0) {
                    // 更新现有文本节点
                    titleTextNodes[0].textContent = ` ${features[index].title}`;
                } else {
                    // 添加新文本节点
                    title.appendChild(document.createTextNode(` ${features[index].title}`));
                }

                // 更新描述
                if (description) description.textContent = features[index].description;
            }
        });
    }

    // 更新应用信息
    const appInfoCard = document.querySelector('.card.info.app-c');
    if (appInfoCard && info.appInfo) {
        // 更新应用信息图标
        const appInfoCardIcon = appInfoCard.querySelector('h3 .material-symbols-outlined');
        const appInfoCardTitle = appInfoCard.querySelector('h3 #info-h3-text-app');
        if (appInfoCardIcon && appInfoCardTitle) {
            appInfoCardIcon.textContent = info.appInfo.icon;
            appInfoCardTitle.textContent = info.appInfo.title;
        }

        // 更新应用信息文本内容
        const paragraphs = appInfoCard.querySelectorAll('p');
        if (paragraphs.length >= 5) {
            paragraphs[0].textContent = info.appInfo.name;
            paragraphs[1].textContent = `版本：${info.appInfo.version}`;
            paragraphs[2].textContent = `大小：${info.appInfo.size}`;
            paragraphs[3].textContent = `兼容：${info.appInfo.compatibility}`;
            paragraphs[4].textContent = `开发：${info.appInfo.developer}`;
        }
    }

    // 更新曲目信息
    const trackInfoCard = document.querySelector('.card.info.disc-c');
    if (trackInfoCard && info.trackInfo) {
        // 更新曲目信息图标
        const trackInfoCardIcon = trackInfoCard.querySelector('h3 .material-symbols-outlined');
        const trackInfoCardTitle = trackInfoCard.querySelector('h3 #info-h3-text-disc');
        if (trackInfoCardIcon && trackInfoCardTitle) {
            trackInfoCardIcon.textContent = info.trackInfo.icon;
            trackInfoCardTitle.textContent = info.trackInfo.title;
        }

        // 更新曲目信息文本内容
        const paragraphs = trackInfoCard.querySelectorAll('p');
        if (paragraphs.length >= 5) {
            paragraphs[0].textContent = info.trackInfo.name;
            paragraphs[1].textContent = `编码格式：${info.trackInfo.format}`;
            paragraphs[2].textContent = `采样率：${info.trackInfo.sampleRate}`;
            paragraphs[3].textContent = `声道：${info.trackInfo.channel}`;
            paragraphs[4].textContent = `码率：${info.trackInfo.bitRate}`;
        }
    }
}

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