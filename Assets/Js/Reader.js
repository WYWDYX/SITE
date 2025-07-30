// 解析URL参数
const urlParams = new URLSearchParams(window.location.search);
const directoryName = urlParams.get('referrer') || 'demo';
const fileCount = parseInt(urlParams.get('fileCount'), 10) || 1;

// 字体处理
const fontFamilyParam = urlParams.get('fontFamily');
const fontSizeParam = urlParams.get('fontSize');
const fontSize = fontSizeParam ? Math.max(14, Math.min(parseInt(fontSizeParam), 30)) : 20;
let fontFamily = fontFamilyParam || "'Noto Sans SC', sans-serif";

// 创建字体加载状态提示
const fontLoadingElement = document.createElement('div');
fontLoadingElement.className = 'font-loading';
fontLoadingElement.textContent = '加载字体中...';
fontLoadingElement.style.display = 'none';
document.body.appendChild(fontLoadingElement);

// 字体缓存
const fontCache = new Set();

// 动态加载字体
function loadFont(fontName) {
    // 检查字体是否已加载
    if (fontCache.has(fontName)) {
        applyFont(fontName);
        return;
    }
    
    // 显示加载提示
    fontLoadingElement.textContent = `加载字体: ${fontName}...`;
    fontLoadingElement.style.display = 'block';

    // 创建字体样式
    const fontFace = new FontFace(
        fontName,
        `url(../Assets/Font/${fontName}.ttf) format('truetype')`
    );

    // 加载字体
    fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        console.log(`字体 ${fontName} 加载成功`);
        
        // 缓存字体并应用
        fontCache.add(fontName);
        applyFont(fontName);
        
        // 隐藏加载提示
        fontLoadingElement.style.display = 'none';
    }).catch((error) => {
        console.error(`字体 ${fontName} 加载失败:`, error);
        // 回退到默认字体
        applyFont("'Noto Sans SC', sans-serif");
        
        // 更新提示
        fontLoadingElement.textContent = `字体加载失败，使用默认字体`;
        setTimeout(() => {
            fontLoadingElement.style.display = 'none';
        }, 3000);
    });
}

// 应用字体
function applyFont(font) {
    document.getElementById('txtContent').style.fontFamily = font;
}

// 应用初始字体设置
document.getElementById('txtContent').style.fontSize = fontSize + 'px';

// 如果指定了自定义字体，加载它
if (fontFamilyParam) {
    loadFont(fontFamilyParam);
} else {
    // 使用默认字体
    applyFont("'Noto Sans SC', sans-serif");
}

// ==================== 阅读器状态管理 ====================
const readerState = {
    currentPage: parseInt(localStorage.getItem(directoryName)) || 1,
    totalPages: fileCount,
    currentTitle: "",
    
    // 初始化状态
    init() {
        this.updateUI();
        this.loadCurrentPage();
    },
    
    // 跳转到指定页面
    goToPage(page) {
        page = Math.max(1, Math.min(page, this.totalPages));
        if (page === this.currentPage) return;
        
        this.currentPage = page;
        this.currentTitle = "";
        this.updateUI();
        
        // 显示加载提示
        showLoadingIndicator();
        
        this.loadCurrentPage();
        this.saveState();
    },
    
    // 上一页
    prevPage() {
        if (this.currentPage <= 1) return;
        
        // 显示加载提示
        showLoadingIndicator();
        
        this.goToPage(this.currentPage - 1);
    },
    
    // 下一页
    nextPage() {
        if (this.currentPage >= this.totalPages) return;
        
        // 显示加载提示
        showLoadingIndicator();
        
        this.goToPage(this.currentPage + 1);
    },
    
    // 加载当前页内容
    loadCurrentPage() {
        const fileName = `Text-${this.currentPage}.txt`;
        loadText(fileName);
    },
    
    // 保存状态到localStorage
    saveState() {
        localStorage.setItem(directoryName, this.currentPage);
    },
    
    // 更新UI状态
    updateUI() {
        let titleSuffix;
        if (this.currentTitle) {
            titleSuffix = this.currentTitle;
        } else {
            titleSuffix = `${this.currentPage}页`;
        }
        
        document.title = `启始 - 阅读 - ${decodeURIComponent(directoryName)} - ${titleSuffix}`;
        pageNumberInput.value = this.currentPage;
        
        // 禁用上一页按钮（当在第一页时）
        prevButton.disabled = this.currentPage <= 1;
        
        // 禁用下一页按钮（当在最后一页时）
        nextButton.disabled = this.currentPage >= this.totalPages;
        
        // 添加视觉提示（灰色表示禁用）
        if (prevButton.disabled) {
            prevButton.style.opacity = "0.5";
            prevButton.style.cursor = "not-allowed";
        } else {
            prevButton.style.opacity = "1";
            prevButton.style.cursor = "pointer";
        }
        
        if (nextButton.disabled) {
            nextButton.style.opacity = "0.5";
            nextButton.style.cursor = "not-allowed";
        } else {
            nextButton.style.opacity = "1";
            nextButton.style.cursor = "pointer";
        }
    }
};

// 显示加载指示器
function showLoadingIndicator() {
    document.getElementById('txtContent').innerHTML = `
        <div class="loading-indicator">
            <h3>正在加载内容...</h3>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // 滚动到顶部
    window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

// 文本加载功能
function loadText(fileName) {
    // 显示加载指示器（确保立即显示）
    showLoadingIndicator();
    
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const txtContent = xhr.responseText;
                const txtLines = txtContent.split('\n');
                let htmlContent = "";
                let inParagraph = false;
                let partTitle = null;
                let chapterTitle = null;
                
                for (let i = 0; i < txtLines.length; i++) {
                    const txtLine = txtLines[i].trim();
                    if (txtLine.length === 0) {
                        if (inParagraph) {
                            htmlContent += "</p>";
                            inParagraph = false;
                        }
                        htmlContent += "<p>";
                    } else if (/^第([零一二三四五六七八九十百千万]+|[0-9]+|\{.+?\})(部|卷)\s/.test(txtLine)) {
                        if (inParagraph) {
                            htmlContent += "</p>";
                            inParagraph = false;
                        }
                        if (partTitle !== null) {
                            htmlContent += "</div>";
                        }
                        partTitle = txtLine;
                        htmlContent += `<h1>${partTitle}</h1><style>#txtContent {background: rgba(255, 255, 255, 0.25);border-radius: 0;}</style><div>`;
                    } else if (/^第([零一二三四五六七八九十百千万]+|[0-9]+|\{.+?\})章\s/.test(txtLine)) {
                        if (inParagraph) {
                            htmlContent += "</p>";
                            inParagraph = false;
                        }
                        if (chapterTitle !== null) {
                            htmlContent += "</div>";
                        }
                        chapterTitle = txtLine;
                        htmlContent += `<h2>${chapterTitle}</h2><div>`;
                    } else {
                        if (!inParagraph) {
                            htmlContent += "<p>";
                            inParagraph = true;
                        }
                        htmlContent += txtLine + "<p>";
                    }
                }
                
                if (inParagraph) {
                    htmlContent += "</p>";
                }
                if (chapterTitle !== null) {
                    htmlContent += "</div>";
                }
                if (partTitle !== null) {
                    htmlContent += "</div>";
                }
                
                if (partTitle) {
                    readerState.currentTitle = partTitle;
                } else if (chapterTitle) {
                    readerState.currentTitle = chapterTitle;
                } else {
                    readerState.currentTitle = ""; // 没有标题时使用页码
                }
                
                document.getElementById('txtContent').innerHTML = htmlContent;
                readerState.updateUI();
                readerState.saveState();
            } catch (error) {
                showError("内容解析失败", error, fileName);
            }
        } else {
            showError(`加载失败 (${xhr.status})`, xhr.statusText, fileName);
        }
    };
    
    xhr.onerror = function() {
        const errorMsg = navigator.onLine ? 
            "内容加载失败" : "网络连接已断开";
        showError(errorMsg, "网络错误", fileName);
    };
    
    xhr.open('GET', `../Assets/Text/${directoryName}/${fileName}`);
    xhr.send();
}

// 增强错误处理
function showError(title, detail, fileName) {
    const errorId = `error-${Date.now()}`;
    const issueUrl = new URL("https://github.com/WYWDYX/SITE/issues");
    issueUrl.searchParams.set("title", `阅读器错误: ${directoryName}`);
    issueUrl.searchParams.set("body", `错误详情:\n- 文件: ${fileName}\n- 页面: ${readerState.currentPage}\n- 错误: ${title}\n- 详细信息: ${detail}`);
    
    readerState.currentTitle = "";
    readerState.updateUI();
    
    document.getElementById('txtContent').innerHTML = `
        <div class="error-container">
            <h3>${title}</h3>
            <p>${detail}</p>
            <div class="error-details">
                <p>目录: ${decodeURIComponent(directoryName)}</p>
                <p>文件: ${fileName}</p>
                <p>页码: ${readerState.currentPage}/${readerState.totalPages}</p>
            </div>
            <a href="${issueUrl}" class="feedback-issue" target="_blank">反馈问题</a>
        </div>
    `;
}

// ==================== 初始化页面导航 ====================
const pageNumberInput = document.getElementById('pageNumberInput');
const goButton = document.getElementById('goButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');

// 修复输入框处理（允许多位数字输入）
pageNumberInput.addEventListener('input', function() {
    // 仅标记输入状态，不修改值
    this.dataset.changed = 'true';
});

// 添加失焦事件处理
pageNumberInput.addEventListener('blur', function() {
    normalizeInputValue(this);
});

// 归一化输入值函数
function normalizeInputValue(inputElement) {
    let value = parseInt(inputElement.value);
    
    // 处理非数字输入
    if (isNaN(value)) {
        if (inputElement.value === '') {
            // 空输入重置为当前页
            inputElement.value = readerState.currentPage;
        } else {
            // 非数字输入重置为当前页
            inputElement.value = readerState.currentPage;
        }
        return;
    }
    
    // 自动归一化：小于1设为1，大于总页数设为总页数
    if (value < 1) {
        value = 1;
    } else if (value > readerState.totalPages) {
        value = readerState.totalPages;
    }
    
    // 更新输入框值
    inputElement.value = value;
    inputElement.dataset.valid = value;
}

pageNumberInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        normalizeInputValue(this);
        
        // 显示加载提示
        showLoadingIndicator();
        
        readerState.goToPage(parseInt(this.value));
    }
});

// 跳转按钮点击处理
goButton.addEventListener('click', function() {
    normalizeInputValue(pageNumberInput);
    readerState.goToPage(parseInt(pageNumberInput.value));
});

// 上一页/下一页按钮事件绑定
prevButton.addEventListener('click', function() {
    readerState.prevPage();
});

nextButton.addEventListener('click', function() {
    readerState.nextPage();
});

// 移动设备适配
if (navigator.maxTouchPoints > 0) {
    const style = document.createElement('style');
    style.textContent = `
        .size button:hover { background-color: unset; }
        .size button:active { background-color: #e0e0e0; }
        
        /* 禁用按钮样式 */
        .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
        
        /* 加载指示器样式 */
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: #666;
            font-size: 1.2em;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            margin-top: 20px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #FFA500;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// 初始化阅读器
readerState.init();