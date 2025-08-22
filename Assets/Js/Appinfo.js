// 选择器和配置常量
const SELECTORS = {
    LOADER: '#page-loader',
    SECTION_TITLE_IMG: '.section_title img',
    SECTION_TITLE_H1: '.section_title h1',
    TAGS_CONTAINER: 'div[style*="user-select: none"]',
    DESCRIPTION: '#description',
    DESCRIPTION_TEXT: '#description-text',
    ABOUT_SECTION: '#about',
    FEATURES_SECTION: '#features',
    APP_INFO_CARD: '.card.info.app-c',
    TRACK_INFO_CARD: '.card.info.disc-c'
};

const CSS_CLASSES = {
    HIDDEN: 'hidden',
    SCROLL_HIDDEN: 'scroll-hidden',
    SCROLL_SHOW: 'scroll-show',
    TAG_HIDDEN: 'tag-hidden',
    TAG_SHOW: 'tag-show',
    ICON_HIDDEN: 'icon-hidden',
    ICON_SHOW: 'icon-show',
    SCROLL_HIDE: 'scroll-hide',
    TAG_HIDE: 'tag-hide',
    ICON_HIDE: 'icon-hide'
};

const errorMessages = {
    404: {
        title: "404",
        subtitle: "应用不存在",
        solution: "请<span>检查应用ID</span>是否正确，或<span>联系管理员</span>确认应用是否已上传。"
    },
    500: {
        title: "500",
        subtitle: "服务器内部错误",
        solution: "请<span>稍后重试</span>或<span>联系技术支持</span>处理服务器问题。"
    },
    400: {
        title: "400",
        subtitle: "无效的应用ID",
        solution: "请<span>确认您的ID无误</span>或<span>联系技术支持</span>处理。"
    },
    0: {
        title: "0",
        subtitle: "网络连接失败",
        solution: "请<span>检查网络连接</span>是否正常，或<span>尝试刷新页面</span>重新加载。"
    }
};

// 创建页面加载完成的Promise
function createPageLoadedPromise() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve, {
                once: true
            });
        }
    });
}

// CSS变量应用，使用更高效的方式
function applyCssVariables(cssVariables) {
    const style = document.createElement('style');
    style.id = 'dynamic-css-variables';

    // 字符串构建
    const lightVars = Object.entries(cssVariables.light)
        .map(([variable, value]) => `${variable}: ${value};`)
        .join('');

    const darkVars = Object.entries(cssVariables.dark)
        .map(([variable, value]) => `${variable}: ${value};`)
        .join('');

    style.textContent = `
        :root { ${lightVars} }
        @media (prefers-color-scheme: dark) { :root { ${darkVars} } }
    `;

    document.head.appendChild(style);
}

// 标签创建
function updateTags(tags, container) {
    const fragment = document.createDocumentFragment();

    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        fragment.appendChild(tagElement);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// 功能特性更新
function updateFeatures(features, featuresSection) {
    const featureCards = featuresSection.querySelectorAll('.card');

    featureCards.forEach((card, index) => {
        if (!features[index]) return;

        const feature = features[index];
        const icon = card.querySelector('.material-symbols-outlined');
        const title = card.querySelector('h3');
        const description = card.querySelector('p');

        // 更新图标
        if (icon) {
            icon.textContent = feature.icon;
        } else {
            const newIcon = document.createElement('span');
            newIcon.className = 'material-symbols-outlined';
            newIcon.textContent = feature.icon;
            title.insertBefore(newIcon, title.firstChild);
        }

        // 更新标题
        const titleText = title.childNodes[title.childNodes.length - 1];
        if (titleText && titleText.nodeType === Node.TEXT_NODE) {
            titleText.textContent = ` ${feature.title}`;
        } else {
            title.appendChild(document.createTextNode(` ${feature.title}`));
        }

        // 更新描述
        if (description) description.textContent = feature.description;
    });
}

// 信息卡片更新
function updateInfoCard(card, info, fields, prefixes = {}) {
    if (!card || !info) return;

    // 更新标题和图标
    const icon = card.querySelector('h3 .material-symbols-outlined');
    const title = card.querySelector('h3').lastChild;

    if (icon && title) {
        icon.textContent = info.icon;
        title.textContent = info.title;
    }

    // 更新内容
    const paragraphs = card.querySelectorAll('p');
    fields.forEach((field, i) => {
        if (paragraphs[i] && info[field]) {
            // 前缀处理
            const prefix = prefixes[field] || '';
            paragraphs[i].textContent = prefix + info[field];
        }
    });
}

// 更新页面
function updatePageContent(data) {
    const {
        app,
        screenshots,
        about,
        features,
        info
    } = data;

    // 更新应用基本信息
    document.title = `${app.name} 应用详情页`;
    document.querySelector('link[rel="icon"]').href = app.icon;
    document.querySelector(SELECTORS.SECTION_TITLE_IMG).src = app.icon;
    document.querySelector(SELECTORS.SECTION_TITLE_H1).textContent = app.name;

    // 更新标签
    const tagsContainer = document.querySelector(SELECTORS.TAGS_CONTAINER);
    if (tagsContainer && app.tags) {
        updateTags(app.tags, tagsContainer);
    }

    // 更新描述
    const description = document.querySelector(SELECTORS.DESCRIPTION);
    const descriptionText = document.querySelector(SELECTORS.DESCRIPTION_TEXT);
    if (description && descriptionText) {
        description.textContent = app.description;
        descriptionText.textContent = app['description-text'];
    }

    // 更新下载链接
    document.querySelectorAll('a[href*=".apk"]').forEach(link => {
        link.href = app.downloadUrl;
    });

    // 更新截图
    document.querySelectorAll('picture').forEach(picture => {
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
    const aboutSection = document.querySelector(SELECTORS.ABOUT_SECTION);
    if (aboutSection && about) {
        aboutSection.querySelector('h2').textContent = about.title || '关于应用';

        const aboutContent = aboutSection.querySelector('div');
        if (aboutContent && about.content) {
            aboutContent.innerHTML = about.content.map(p => `<p>${p}</p>`).join('');
        }
    }

    // 更新功能特性
    const featuresSection = document.querySelector(SELECTORS.FEATURES_SECTION);
    if (featuresSection && features) {
        updateFeatures(features, featuresSection);
    }

    // 更新应用信息
    const appInfoCard = document.querySelector(SELECTORS.APP_INFO_CARD);
    if (appInfoCard && info.appInfo) {
        updateInfoCard(appInfoCard, info.appInfo, [
            'name',
            'version',
            'size',
            'compatibility',
            'developer'
        ], {
            version: '版本：',
            size: '大小：',
            compatibility: '兼容：',
            developer: '开发：'
        });
    }

    // 更新曲目信息
    const trackInfoCard = document.querySelector(SELECTORS.TRACK_INFO_CARD);
    if (trackInfoCard && info.trackInfo) {
        updateInfoCard(trackInfoCard, info.trackInfo, [
            'name',
            'format',
            'sampleRate',
            'channel',
            'bitRate'
        ], {
            format: '编码格式：',
            sampleRate: '采样率：',
            channel: '声道：',
            bitRate: '码率：'
        });
    }
}

// 加载配置函数
async function loadAppConfig(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();

        if (data.cssVariables) {
            applyCssVariables(data.cssVariables);
        }

        updatePageContent(data);
    } catch (error) {
        console.error('加载JSON配置失败:', error);

        // 确定错误代码
        let errorCode = error.status || 0;
        if (error instanceof SyntaxError) errorCode = 400;

        // 获取错误信息（如果没有匹配的代码，使用默认错误）
        const errorInfo = errorMessages[errorCode] || {
            title: "ERR",
            subtitle: "未知错误",
            solution: "请<span>查看控制台日志</span>获取详细信息，或<span>联系技术支持</span>。"
        };

        // 更新错误信息
        document.getElementById('error-title').textContent = errorInfo.title;
        document.getElementById('error-subtitle').textContent = errorInfo.subtitle;
        document.getElementById('error-solution').innerHTML = errorInfo.solution;

        // 显示错误面板
        document.getElementById('error').style.display = '';

        throw error;
    }
}

// 取消元素上所有正在进行的 Web Animations（更稳）
function cancelAllAnimations(el) {
    if (typeof el.getAnimations === 'function') {
        el.getAnimations().forEach(a => {
            try {
                a.cancel();
            } catch (_) {}
        });
    }
}

// 强制重启某个动画类：先移除两种态，再强制重排，再添加
function restartAnim(el, addCls, removeCls) {
    el.classList.remove(addCls, removeCls);
    cancelAllAnimations(el); // 解决某些浏览器对同名动画复用的问题
    void el.offsetWidth; // 强制重排，刷新样式
    el.classList.add(addCls);
}

// IntersectionObserver 回调（可反复触发）
function handleIntersection(entries, headerHeight) {
    entries.forEach(entry => {
        const el = entry.target;

        if (entry.isIntersecting) {
            // 进入视口：播放“出现”动画，并确保移除反向类
            if (el.classList.contains(CSS_CLASSES.SCROLL_HIDDEN)) {
                restartAnim(el, CSS_CLASSES.SCROLL_SHOW, CSS_CLASSES.SCROLL_HIDE);
            }
            if (el.classList.contains(CSS_CLASSES.TAG_HIDDEN)) {
                restartAnim(el, CSS_CLASSES.TAG_SHOW, CSS_CLASSES.TAG_HIDE);
            }
            if (el.classList.contains(CSS_CLASSES.ICON_HIDDEN)) {
                restartAnim(el, CSS_CLASSES.ICON_SHOW, CSS_CLASSES.ICON_HIDE);
            }
        } else {
            // 离开视口：播放“消失”动画，并确保移除正向类
            if (el.classList.contains(CSS_CLASSES.SCROLL_SHOW)) {
                restartAnim(el, CSS_CLASSES.SCROLL_HIDE, CSS_CLASSES.SCROLL_SHOW);
            }
            if (el.classList.contains(CSS_CLASSES.TAG_SHOW)) {
                restartAnim(el, CSS_CLASSES.TAG_HIDE, CSS_CLASSES.TAG_SHOW);
            }
            if (el.classList.contains(CSS_CLASSES.ICON_SHOW)) {
                restartAnim(el, CSS_CLASSES.ICON_HIDE, CSS_CLASSES.ICON_SHOW);
            }
        }
    });
}

// 初始化滚动动画观察器
function initScrollAnimation() {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;

    const observer = new IntersectionObserver(
        (entries) => handleIntersection(entries, headerHeight), {
            threshold: 0.1,
            rootMargin: `-${headerHeight}px 0px 0px 0px`
        }
    );

    // 监听section
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.add(CSS_CLASSES.SCROLL_HIDDEN);
        observer.observe(sec);
    });

    // 监听tag + 随机延迟
    document.querySelectorAll('.tag').forEach((tag, i) => {
        tag.classList.add(CSS_CLASSES.TAG_HIDDEN);
        tag.style.setProperty('--delay', `${i * 0.05}s`);
        observer.observe(tag);
    });

    // 监听icon + 随机延迟
    document.querySelectorAll('.material-symbols-outlined').forEach((icon, i) => {
        icon.classList.add(CSS_CLASSES.ICON_HIDDEN);
        icon.style.setProperty('--delay', `${i * 0.05}s`);
        observer.observe(icon);
    });
}

// 复制URL功能
async function copyUrlWithoutHash() {
    const urlWithoutHash = window.location.href.split('#')[0];

    try {
        await navigator.clipboard.writeText(urlWithoutHash);
        showCopyToast('链接已复制');
    } catch (err) {
        console.error('现代剪贴板API失败，使用备用方法:', err);
        copyToClipboardFallback(urlWithoutHash);
    }
}

// 复制到剪贴板的备用方法
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        showCopyToast(successful ? '链接已复制' : '复制失败，请手动复制链接', !successful);
    } catch (err) {
        showCopyToast('复制失败，请手动复制链接', true);
    } finally {
        document.body.removeChild(textarea);
    }
}

// 提示弹窗
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

// 主初始化函数
function init() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const appName = urlParams.get('app') || 'error/URL';
    if (!urlParams.has('app')) {
        document.getElementById('error').style.display = '';
        const ErrorAction = document.querySelector('a.error-action');
        if (ErrorAction) {
            ErrorAction.setAttribute('href', '?app=AEGIS');
            ErrorAction.textContent = '推荐的应用';
        }
    }

    const jsonPath = `../Assets/Json/AppStore/${appName}.json`;

    // 创建Promise
    const pageLoaded = createPageLoadedPromise();
    const contentLoaded = loadAppConfig(jsonPath);

    // 等待两者完成
    Promise.all([pageLoaded, contentLoaded])
        .then(() => {
            const loader = document.querySelector(SELECTORS.LOADER);
            if (loader) loader.classList.add(CSS_CLASSES.HIDDEN);
        })
        .catch(error => {
            console.error('加载过程中出错:', error);
            const loader = document.querySelector(SELECTORS.LOADER);
            if (loader) loader.classList.add(CSS_CLASSES.HIDDEN);
        });

    // 初始化滚动动画
    initScrollAnimation();
}

// 使用DOMContentLoaded事件启动应用
document.addEventListener('DOMContentLoaded', init);