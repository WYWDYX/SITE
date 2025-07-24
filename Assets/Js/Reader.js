// 解析URL参数
const urlParams = new URLSearchParams(window.location.search);
const directoryName = urlParams.get('referrer') || 'demo';
const fileCount = parseInt(urlParams.get('fileCount'), 10) || 10;
var currentPageNumber = parseInt(localStorage.getItem(directoryName)) || 1;

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

// 动态加载字体
function loadFont(fontName) {
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

        // 应用字体
        document.getElementById('txtContent').style.fontFamily = fontName;

        // 隐藏加载提示
        fontLoadingElement.style.display = 'none';
    }).catch((error) => {
        console.error(`字体 ${fontName} 加载失败:`, error);
        // 回退到默认字体
        document.getElementById('txtContent').style.fontFamily = "'Noto Sans SC', sans-serif";

        // 更新提示
        fontLoadingElement.textContent = `字体加载失败，使用默认字体`;
        setTimeout(() => {
            fontLoadingElement.style.display = 'none';
        }, 3000);
    });
}

// 应用初始字体设置
document.getElementById('txtContent').style.fontSize = fontSize + 'px';

// 如果指定了自定义字体，加载它
if (fontFamilyParam) {
    loadFont(fontFamilyParam);
} else {
    // 使用默认字体
    document.getElementById('txtContent').style.fontFamily = "'Noto Sans SC', sans-serif";
}

// 文本加载功能
function loadText(fileName) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (xhr.status === 200) {
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
                    htmlContent += "<p><em>&nbsp;&nbsp;</em>";
                } else if (/^第([一二三四五六七八九十百千万]+|[0-9]+|\{.+?\})部\s/.test(txtLine)) {
                    if (inParagraph) {
                        htmlContent += "</p>";
                        inParagraph = false;
                    }
                    if (partTitle !== null) {
                        htmlContent += "</div>";
                    }
                    partTitle = txtLine;
                    htmlContent += `<h1>${partTitle}</h1><div>`;
                } else if (/^第([一二三四五六七八九十百千万]+|[0-9]+|\{.+?\})章\s/.test(txtLine)) {
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
            document.getElementById('txtContent').innerHTML = htmlContent;
            window.scroll({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });

            // 更新按钮状态
            document.getElementById("prevButton").style.opacity = (currentPageNumber === 1) ? 0.5 : 1;
            document.getElementById("nextButton").style.opacity = (currentPageNumber === fileCount) ? 0.5 : 1;

            localStorage.setItem(directoryName, currentPageNumber);
        } else {
            document.getElementById('txtContent').innerHTML = `
      <p id="warning-1">无法加载 (๑╹っ╹๑):${xhr.statusText}</p>
      <p id="warning-2">向站长反馈:PGWD_YX@iCloud.com</p>`;
        }
    };
    xhr.onerror = function() {
        document.getElementById('txtContent').innerHTML = `<p id="warning-1">网络连接断开 (๑╹っ╹๑)</p>`;
    };
    xhr.open('GET', `../Assets/Text/${directoryName}/${fileName}`);
    xhr.send();
}

function changePageNumber(change) {
    const totalPagesNumber = fileCount * Math.pow(10, (directoryName.length - 4));
    currentPageNumber += change;
    if (currentPageNumber < 1) {
        currentPageNumber = 1;
    }
    if (currentPageNumber > totalPagesNumber) {
        currentPageNumber = totalPagesNumber;
    }
}

// 初始化页面导航
const pageNumberInput = document.getElementById('pageNumberInput');
pageNumberInput.addEventListener('input', function(event) {
    currentPageNumber = parseInt(event.target.value) || 1;
});

pageNumberInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        goButton.click();
    }
});

const goButton = document.getElementById('goButton');
goButton.addEventListener('click', function() {
    const totalPagesNumber = fileCount * Math.pow(10, (directoryName.length - 4));
    currentPageNumber = Math.max(1, Math.min(currentPageNumber, totalPagesNumber));
    document.title = decodeURIComponent(directoryName) + '-' + currentPageNumber + '页';
    const fileName = `Text-${String(currentPageNumber).padStart(directoryName.length - 4, '0')}.txt`;
    loadText(fileName);
    pageNumberInput.value = currentPageNumber;
});

const prevButton = document.getElementById('prevButton');
prevButton.addEventListener('click', function() {
    document.title = '启始 - 阅读 - ' + decodeURIComponent(directoryName) + ' - ' + (currentPageNumber - 1) + '页';
    changePageNumber(-1);
    const fileName = `Text-${String(currentPageNumber).padStart(directoryName.length - 4, '0')}.txt`;
    loadText(fileName);
    pageNumberInput.value = currentPageNumber;
});

const nextButton = document.getElementById('nextButton');
nextButton.addEventListener('click', function() {
    document.title = '启始 - 阅读 - ' + decodeURIComponent(directoryName) + ' - ' + (currentPageNumber + 1) + '页';
    changePageNumber(1);
    const fileName = `Text-${String(currentPageNumber).padStart(directoryName.length - 4, '0')}.txt`;
    loadText(fileName);
    pageNumberInput.value = currentPageNumber;
});

// 初始加载
const fileName = `Text-${String(currentPageNumber).padStart(directoryName.length - 4, '0')}.txt`;
document.title = '启始 - 阅读 - ' + decodeURIComponent(directoryName);
document.getElementById("prevButton").style.opacity = (currentPageNumber === 1) ? 0.5 : 1;
document.getElementById("nextButton").style.opacity = (currentPageNumber === fileCount) ? 0.5 : 1;
document.getElementById('pageNumberInput').value = currentPageNumber;

// 移动设备适配
if (navigator.maxTouchPoints > 0) {
    const cssRules = [].slice.call(document.styleSheets).flatMap(s => [...s.cssRules || s.rules || []]);
    cssRules.forEach(r => {
        if (r.selectorText === '.size button:hover') {
            r.selectorText = '.size button:active';
        }
    });
}

loadText(fileName);