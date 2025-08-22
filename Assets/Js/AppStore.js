// ===== 工具函数 =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ===== 应用数据 =====
let appsData = [];

// ===== 页面加载后初始化 =====
window.addEventListener("load", () => {
    loadAppsData();
});

// ===== 加载应用数据 =====
async function loadAppsData() {
    try {
        const response = await fetch('../Assets/Json/AppStore.json');
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        const data = await response.json();
        appsData = data.apps;

        // 初始化页面内容
        const loader = $("#page-loader");
        if (loader) {
            setTimeout(() => loader.classList.add("hidden"), 300);
        }
        initPageContent();
    } catch (error) {
        console.error('加载应用数据失败:', error);
        showDataError();
    }
}

// ===== 显示数据加载错误 =====
function showDataError() {
    const loader = $("#page-loader");
    if (loader) loader.classList.add("hidden");

    const mainContent = $(".main-content");
    if (mainContent) {
        document.getElementById('error').style.display = '';
    }
}

let currentSlide = 0;
let mainInterval = null;

// ===== 工具：根据屏幕方向替换文件名 tablet ↔ phone =====
function adaptMainImage(url, isPortrait) {
    if (!url) return url;

    const parts = url.split("/");
    const filename = parts.pop(); // 取出最后的文件名
    let newFilename = filename;

    if (isPortrait) {
        newFilename = filename.replace("tablet", "phone");
    } else {
        newFilename = filename.replace("phone", "tablet");
    }

    parts.push(newFilename);
    return parts.join("/");
}

// ===== 主初始化 =====
function initPageContent() {
    if (!appsData || appsData.length === 0) {
        showDataError();
        return;
    }

    // 从JSON数据中提取所有标签用于分类筛选
    initCategories();

    initMainSection();
    initNewReleases();
    initEditorChoice();
    initAppsGrid();
    initScrollAnimations();
    initFilters();
    initSearch();
    ensureAnchors();

    // 监听屏幕方向变化，实时更新 Main 背景
    window
        .matchMedia("(orientation: portrait)")
        .addEventListener("change", () => {
            updateMainSlide(currentSlide);
        });
}

// ===== 初始化分类标签 =====
function initCategories() {
    const categoriesContainer = $("#categories");
    if (!categoriesContainer) return;

    // 收集所有标签
    const allTags = new Set();
    appsData.forEach(app => {
        app.tags.forEach(tag => allTags.add(tag));
    });

    // 添加分类按钮
    Array.from(allTags).sort().forEach(tag => {
        const button = document.createElement("button");
        button.className = "category-btn";
        button.textContent = tag;
        categoriesContainer.appendChild(button);
    });
}

// ===== Main 区域 =====
function initMainSection() {
    const mainSection = $("#main");
    const mainNav = $(".main-nav");
    if (!mainSection || !mainNav) return;

    // 获取所有特色应用
    const featuredApps = appsData.filter(app => app.featured);
    if (featuredApps.length === 0) return;

    // 背景层 & 导航点
    featuredApps.forEach((app, index) => {
        const bgDiv = document.createElement("div");
        bgDiv.className = "main-bg";
        if (index === 0) bgDiv.classList.add("active");
        mainSection.appendChild(bgDiv);

        const navBtn = document.createElement("button");
        navBtn.className = "main-nav-btn";
        if (index === 0) navBtn.classList.add("active");
        navBtn.addEventListener("click", () => updateMainSlide(index, true));
        mainNav.appendChild(navBtn);
    });

    // 初始激活
    updateMainSlide(0);

    // 自动轮播
    if (mainInterval) clearInterval(mainInterval);
    mainInterval = setInterval(() => {
        const next = (currentSlide + 1) % featuredApps.length;
        updateMainSlide(next);
    }, 6000);
}

// 用 WAAPI 为 main-card 提供"高度丝滑过渡"
function animateCardSize(element, mutate) {
    if (!element || typeof mutate !== "function") return;
    const firstHeight = element.getBoundingClientRect().height;

    mutate(); // 更新内容

    const lastHeight = element.getBoundingClientRect().height;
    if (firstHeight === lastHeight) return;

    element.style.overflow = "hidden";
    const anim = element.animate(
        [{
            height: `${firstHeight}px`
        }, {
            height: `${lastHeight}px`
        }], {
            duration: 400,
            easing: "ease-in-out"
        }
    );
    anim.onfinish = () => {
        element.style.height = "";
        element.style.overflow = "";
    };
}

function updateMainSlide(index, userTriggered = false) {
    const featuredApps = appsData.filter(app => app.featured);
    const app = featuredApps[index];
    if (!app) return;

    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const mainBgs = $$(".main-bg");
    const mainNavBtns = $$(".main-nav-btn");
    const mainTitle = $(".main h1");
    const mainDesc = $(".main p");
    const mainCard = $(".main-card");
    const mainIcon = $(".main-app-icon");
    const mainAppInfo = $(".main-app-info");
    const mainActions = $(".main-app-actions");
    const learnMoreBtn = $(".main-app-actions a:first-child");

    // 切换背景与导航点
    mainBgs.forEach((bg) => bg.classList.remove("active"));
    mainNavBtns.forEach((btn) => btn.classList.remove("active"));
    if (mainBgs[index]) {
        mainBgs[index].style.backgroundImage = `url(${adaptMainImage(
      app.background,
      isPortrait
    )})`;
        mainBgs[index].classList.add("active");
    }
    if (mainNavBtns[index]) mainNavBtns[index].classList.add("active");

    // 卡片尺寸平滑变化 + 内容更新
    animateCardSize(mainCard, () => {
        if (mainTitle) mainTitle.textContent = "探索无限可能";
        if (mainDesc)
            mainDesc.textContent =
            "WYWDYX STORE";
        const h2 = $(".main-app-info h2");
        const p = $(".main-app-info p");
        if (h2) h2.textContent = app.name;
        if (p) p.textContent = app.description;
        if (mainIcon) {
            mainIcon.src = app.icon;
            mainIcon.alt = `${app.name} 图标`;
        }
        if (learnMoreBtn) learnMoreBtn.href = `Appinfo.html?app=${app.id}`;
    });

    // 重置入场动画
    [mainTitle, mainDesc, mainCard, mainIcon, mainAppInfo, mainActions].forEach(
        (el) => el && el.classList.remove("active")
    );

    setTimeout(() => {
        [mainTitle, mainDesc, mainCard, mainIcon, mainAppInfo, mainActions].forEach(
            (el) => el && el.classList.add("active")
        );
    }, 60);

    currentSlide = index;

    // 手动切换重置自动轮播
    if (userTriggered && mainInterval) {
        clearInterval(mainInterval);
        mainInterval = setInterval(() => {
            const next = (currentSlide + 1) % featuredApps.length;
            updateMainSlide(next);
        }, 6000);
    }
}

// ===== 新品上线（横向滑动 + 拖拽） =====
function initNewReleases() {
    const newReleases = $(".new-releases");
    const prevBtn = $(".carousel-btn.prev");
    const nextBtn = $(".carousel-btn.next");
    if (!newReleases || !prevBtn || !nextBtn) return;

    // 根据日期排序获取最新的5个应用
    const newApps = [...appsData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    newApps.forEach((app, index) => {
        const appEl = document.createElement("div");
        appEl.className = "new-app";
        appEl.innerHTML = `
      <img src="${app.icon}" alt="${app.name} 图标" class="new-app-icon" />
      <div class="new-app-info">
        <h3 class="new-app-title">${app.name}</h3>
        <p class="new-app-category">${app.tags.join(" · ")}</p>
        <button class="app-details-btn" onclick="location.href='Appinfo.html?app=${app.id}'">详情</button>
      </div>`;
        newReleases.appendChild(appEl);

        setTimeout(() => appEl.classList.add("active"), index * 120);
    });

    const cardWidth = 300 + 24;
    const scrollByAmount = () =>
        Math.max(cardWidth, newReleases.clientWidth * 0.9);

    prevBtn.addEventListener("click", () => {
        newReleases.scrollBy({
            left: -scrollByAmount(),
            behavior: "smooth"
        });
    });
    nextBtn.addEventListener("click", () => {
        newReleases.scrollBy({
            left: scrollByAmount(),
            behavior: "smooth"
        });
    });

    // 拖拽滑动
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    newReleases.addEventListener("pointerdown", (e) => {
        isDown = true;
        startX = e.clientX;
        scrollLeft = newReleases.scrollLeft;
        if (e.pointerId != null) newReleases.setPointerCapture(e.pointerId);
    });

    newReleases.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        newReleases.scrollLeft = scrollLeft - dx;
    });

    const endDrag = () => (isDown = false);
    newReleases.addEventListener("pointerup", endDrag);
    newReleases.addEventListener("pointercancel", endDrag);
    newReleases.addEventListener("pointerleave", endDrag);
}

// ===== 编辑推荐 =====
function initEditorChoice() {
    const editorChoice = $(".editor-choice");
    if (!editorChoice) return;

    // 获取所有编辑推荐应用
    const editorApps = appsData.filter(app => app.editorChoice);

    editorApps.forEach((app, index) => {
        const appEl = document.createElement("div");
        appEl.className = "editor-card";
        appEl.innerHTML = `
      <img src="${app.icon}" alt="${app.name} 图标" class="editor-app-icon" />
      <div class="editor-app-info">
        <h3>${app.name}</h3>
        <p>${app.description}</p>
        <button class="app-details-btn" onclick="location.href='Appinfo.html?app=${app.id}'">详情</button>
      </div>`;
        editorChoice.appendChild(appEl);

        setTimeout(() => appEl.classList.add("active"), index * 160);
    });
}

// ===== 初始化应用网格 =====
function initAppsGrid() {
    const appsGrid = $(".apps-grid");
    if (!appsGrid) return;

    appsData.forEach(app => {
        const appCard = document.createElement("div");
        appCard.className = "app-card";
        appCard.innerHTML = `
      <img src="${app.icon}" alt="${app.name} 图标" class="app-icon" />
      <h3 class="app-title">${app.name}</h3>
      <p class="app-description">${app.description}</p>
      <div class="app-tags">
        ${app.tags.map(tag => `<span class="app-tag">${tag}</span>`).join('')}
      </div>
      <div class="app-actions">
        <button class="app-details-btn" onclick="location.href='Appinfo.html?app=${app.id}'">详情</button>
      </div>`;
        appsGrid.appendChild(appCard);
    });
}

// ===== 搜索功能 =====
function initSearch() {
    const searchBox = $(".search-box");
    const searchResults = $("#search-results");

    if (!searchBox || !searchResults) return;

    searchBox.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (query.length === 0) {
            searchResults.classList.remove("active");
            return;
        }

        // 过滤匹配的应用
        const filteredApps = appsData.filter(app =>
            app.name.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query) ||
            app.tags.some(tag => tag.toLowerCase().includes(query))
        );

        // 更新搜索结果
        updateSearchResults(filteredApps, searchResults);
        searchResults.classList.add("active");
    });

    // 点击页面其他地方关闭搜索结果
    document.addEventListener("click", (e) => {
        if (!searchBox.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove("active");
        }
    });

    // 防止点击搜索结果时关闭
    searchResults.addEventListener("click", (e) => {
        e.stopPropagation();
    });
}

function updateSearchResults(apps, container) {
    container.innerHTML = "";

    if (apps.length === 0) {
        container.innerHTML = `<div class="search-result-item" style="justify-content: center;">未找到匹配的应用</div>`;
        return;
    }

    apps.slice(0, 5).forEach(app => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
      <img src="${app.icon}" alt="${app.name} 图标" class="search-result-icon" />
      <div class="search-result-info">
        <div class="search-result-name">${app.name}</div>
        <div class="search-result-desc">${app.description}</div>
      </div>`;

        item.addEventListener("click", () => {
            window.location.href = `Appinfo.html?app=${app.id}`;
        });

        container.appendChild(item);
    });
}

// ===== 滚动动画系统（可重复触发，考虑 header 高度） =====
function initScrollAnimations() {
    const sectionTitles = $$('.section-title');
    const appCards = $$('.app-card'); // 用自身的 transition 体系：.show
    const categoryBtns = $$('.category-btn');
    const appTags = $$('.app-tag'); // 用 keyframes：tag-show / tag-hide
    const appIcons = $$('.app-icon, .new-app-icon, .editor-app-icon'); // 用 keyframes：icon-show / icon-hide

    // ---- 初始状态：只给"需要 keyframes"的元素加 hidden 类；app-card 不加 ---
    sectionTitles.forEach(el => el.classList.add('scroll-hidden'));
    categoryBtns.forEach(el => el.classList.add('scroll-hidden'));
    // 注意：不要再给 appCards 加 scroll-hidden，否则会与 .show 冲突，导致只首次动画。
    appTags.forEach((el, i) => {
        el.classList.add('tag-hidden');
        el.style.setProperty('--delay', `${i * 0.05}s`);
    });
    appIcons.forEach((el, i) => {
        el.classList.add('icon-hidden');
        el.style.setProperty('--delay', `${i * 0.05}s`);
    });

    // ---- 工具：强制重排以重启 CSS Animation（关键！解决"只生效一次"） ----
    const play = (el, addCls, removeCls) => {
        el.classList.remove(addCls, removeCls);
        // 强制重排刷新样式计算，保证后续添加类能重新触发动画
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add(addCls);
    };

    // ---- 计算 header 高度，延后触发时机，避免"过早执行" ----
    const headerHeight = document.querySelector('header')?.offsetHeight || 60;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;

            if (entry.isIntersecting) {
                // 进入视口 —— 出现动画
                if (el.classList.contains('app-card')) {
                    // app-card 用 transition，从 base -> .show
                    el.classList.add('show'); // 移除时会自动反向过渡到 base（即"消失动画"）
                }
                if (el.classList.contains('scroll-hidden')) {
                    play(el, 'scroll-show', 'scroll-hide');
                }
                if (el.classList.contains('tag-hidden')) {
                    play(el, 'tag-show', 'tag-hide');
                }
                if (el.classList.contains('icon-hidden')) {
                    play(el, 'icon-show', 'icon-hide');
                }
            } else {
                // 离开视口 —— 消失动画（相反方向）
                if (el.classList.contains('app-card')) {
                    el.classList.remove('show'); // 依赖 .app-card 自带的 transition 反向过渡
                }
                if (el.classList.contains('scroll-hidden')) {
                    play(el, 'scroll-hide', 'scroll-show');
                }
                if (el.classList.contains('tag-hidden')) {
                    play(el, 'tag-hide', 'tag-show');
                }
                if (el.classList.contains('icon-hidden')) {
                    play(el, 'icon-hide', 'icon-show');
                }
            }
        });
    }, {
        threshold: 0.1,
        // 顶部用 -headerHeight，确保元素通过 sticky header 后才触发；底部不做额外缩进
        rootMargin: `-${headerHeight}px 0px 0px 0px`
    });

    // ---- 注册观察 ----
    sectionTitles.forEach(el => observer.observe(el));
    categoryBtns.forEach(el => observer.observe(el));
    appTags.forEach(el => observer.observe(el));
    appIcons.forEach(el => observer.observe(el));
    appCards.forEach(el => observer.observe(el));
}

// ===== 分类筛选 =====
function initFilters() {
    const categoryButtons = $$(".category-btn");
    const appCards = $$(".app-card");
    if (!categoryButtons.length || !appCards.length) return;

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            categoryButtons.forEach((b) => b.classList.remove("active"));
            button.classList.add("active");

            const category = button.textContent.trim();
            appCards.forEach((card) => {
                if (category === "全部") {
                    card.style.display = "flex";
                    requestAnimationFrame(() => card.classList.add("show"));
                } else {
                    const tags = $$(".app-tag", card).map((t) => t.textContent.trim());
                    const visible = tags.includes(category);
                    card.style.display = visible ? "flex" : "none";
                    if (visible) requestAnimationFrame(() => card.classList.add("show"));
                }
            });
        });
    });
}

// ===== 兜底：补 anchor 避免跳空 =====
function ensureAnchors() {
    if (!document.getElementById("games")) {
        const anchor = document.createElement("div");
        anchor.id = "games";
        anchor.className = "anchor-target";
        document.body.appendChild(anchor);
    }
}