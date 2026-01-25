/**
 * EPUB 在线阅读器 - 主应用程序
 * 支持文字和图片显示，字体调整，背景主题切换，双页/单页模式，鼠标滚轮翻页，书架功能等
 */

class EpubReader {
    constructor() {
        if (typeof ePub === 'undefined') {
            alert("Epub.js library not loaded. Please check internet connection or CDN links.");
            return;
        }

        // EPUB 阅读器实例
        this.book = null;
        this.rendition = null;
        this.currentLocation = null;
        this.bookData = null;
        this.toc = [];
        this.currentBookInfo = null;
        this.isChangingChapter = false;

        // 设置选项
        this.settings = {
            fontSize: 18,
            fontFamily: 'default',
            theme: 'light',
            lineHeight: 1.6,
            padding: 40,
            brightness: 100,
            customBgColor: '#ffffff',
            customTextColor: '#333333',
            displayMode: 'single', // single 或 double
            spread: 'none' // none 或 auto (双页模式)
        };

        // 书架数据
        this.bookshelf = this.loadBookshelf();

        // 初始化界面
        this.initElements();
        this.bindEvents();
        this.applySettings();
        this.renderBookshelf();
    }

    /**
     * 初始化DOM元素引用
     */
    initElements() {
        // 主要元素
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.epubViewer = document.getElementById('epubViewer');
        this.tocList = document.getElementById('tocList');
        this.pageInfo = document.getElementById('pageInfo');
        this.progressBar = document.getElementById('progress');

        // 按钮
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.tocBtn = document.getElementById('tocBtn');
        this.importBtn = document.getElementById('importBtn');
        this.bookshelfBtn = document.getElementById('bookshelfBtn');
        this.closeToc = document.getElementById('closeToc');
        this.closeSettings = document.getElementById('closeSettings');
        this.closeBookshelf = document.getElementById('closeBookshelf');

        // 设置面板元素
        this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
        this.fontFamilySelect = document.getElementById('fontFamily');
        this.decreaseFontBtn = document.getElementById('decreaseFont');
        this.increaseFontBtn = document.getElementById('increaseFont');
        this.themeBtns = document.querySelectorAll('.theme-btn');
        this.customBgColor = document.getElementById('customBgColor');
        this.customTextColor = document.getElementById('customTextColor');
        this.lineHeightSlider = document.getElementById('lineHeight');
        this.lineHeightDisplay = document.getElementById('lineHeightDisplay');
        this.paddingSlider = document.getElementById('padding');
        this.paddingDisplay = document.getElementById('paddingDisplay');
        this.brightnessSlider = document.getElementById('brightness');
        this.brightnessDisplay = document.getElementById('brightnessDisplay');
        this.displayModeSelect = document.getElementById('displayMode');

        // 面板
        this.tocPanel = document.getElementById('tocPanel');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.bookshelfPanel = document.getElementById('bookshelfPanel');
        this.bookshelfList = document.getElementById('bookshelfList');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 文件上传事件
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖拽上传事件
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 导航按钮
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        // 面板切换
        this.settingsBtn.addEventListener('click', () => this.togglePanel(this.settingsPanel));
        this.tocBtn.addEventListener('click', () => this.togglePanel(this.tocPanel));
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.bookshelfBtn.addEventListener('click', () => this.togglePanel(this.bookshelfPanel));
        this.closeToc.addEventListener('click', () => this.closePanel(this.tocPanel));
        this.closeSettings.addEventListener('click', () => this.closePanel(this.settingsPanel));
        this.closeBookshelf.addEventListener('click', () => this.closePanel(this.bookshelfPanel));

        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && !this.settingsBtn.contains(e.target)) {
                this.closePanel(this.settingsPanel);
            }
            if (!this.tocPanel.contains(e.target) && !this.tocBtn.contains(e.target)) {
                this.closePanel(this.tocPanel);
            }
            if (!this.bookshelfPanel.contains(e.target) && !this.bookshelfBtn.contains(e.target)) {
                this.closePanel(this.bookshelfPanel);
            }
        });

        // 字体大小控制
        this.decreaseFontBtn.addEventListener('click', () => this.adjustFontSize(-2));
        this.increaseFontBtn.addEventListener('click', () => this.adjustFontSize(2));

        // 字体样式选择
        this.fontFamilySelect.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.applySettingsToAllContent();
        });

        // 显示模式选择
        this.displayModeSelect.addEventListener('change', (e) => {
            this.settings.displayMode = e.target.value;
            this.settings.spread = this.settings.displayMode === 'double' ? 'auto' : 'none';
            this.recreateRendition();
        });

        // 主题切换
        this.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
                this.updateThemeButtons(theme);
                this.applySettingsToAllContent(); // Ensure theme applies immediately
            });
        });

        // 自定义颜色
        this.customBgColor.addEventListener('input', (e) => {
            this.settings.customBgColor = e.target.value;
            this.applySettingsToAllContent();
        });

        this.customTextColor.addEventListener('input', (e) => {
            this.settings.customTextColor = e.target.value;
            this.applySettingsToAllContent();
        });

        // 行距控制
        this.lineHeightSlider.addEventListener('input', (e) => {
            this.settings.lineHeight = parseFloat(e.target.value);
            this.lineHeightDisplay.textContent = this.settings.lineHeight;
            this.applySettingsToAllContent();
        });

        // 页边距控制
        this.paddingSlider.addEventListener('input', (e) => {
            this.settings.padding = parseInt(e.target.value);
            this.paddingDisplay.textContent = this.settings.padding + 'px';
            this.applySettingsToAllContent();
        });

        // 亮度控制
        this.brightnessSlider.addEventListener('input', (e) => {
            this.settings.brightness = parseInt(e.target.value);
            this.brightnessDisplay.textContent = this.settings.brightness + '%';
            this.applySettings();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 鼠标滚轮翻页
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        window.addEventListener('resize', () => {
            if (this.rendition) {
                // 使用防抖动，避免拖动窗口时频繁计算导致卡顿
                clearTimeout(this.resizeTimer);
                this.resizeTimer = setTimeout(() => {
                    this.rendition.resize(); 
                }, 100);
            }
        });
    }


    togglePanel(panel) {
        if (panel === this.settingsPanel) {
            this.closePanel(this.tocPanel);
            this.closePanel(this.bookshelfPanel);
        } else if (panel === this.tocPanel) {
            this.closePanel(this.settingsPanel);
            this.closePanel(this.bookshelfPanel);
        } else if (panel === this.bookshelfPanel) {
            this.closePanel(this.settingsPanel);
            this.closePanel(this.tocPanel);
            this.renderBookshelf();
        }
        
        panel.classList.toggle('active');
        
        // 等待 CSS 动画 (0.3s) 完成后刷新阅读器尺寸
        if(this.rendition) {
            setTimeout(() => {
                this.rendition.resize();
            }, 350); 
        }
    }
    /**
     * 重新创建rendition
     */
    recreateRendition() {
        if (!this.rendition || !this.currentLocation) return;

        const currentCfi = this.currentLocation.start.cfi;

        this.rendition.destroy();
        this.epubViewer.innerHTML = '';

        this.rendition = this.book.renderTo('epubViewer', {
            width: '100%',
            height: '100%',
            flow: 'paginated',
            manager: 'default',
            spread: this.settings.spread
        });

        this.epubViewer.setAttribute('data-viewer', this.settings.displayMode);

        this.rendition.display(currentCfi).then(() => {
            this.loadTableOfContents();
            this.applySettingsToAllContent();
            this.updatePageInfo();
        });

        this.rendition.on('relocated', (location) => {
            this.currentLocation = location;
            this.updatePageInfo();
            this.updateProgress();
            this.saveReadingProgress();
        });

        this.rendition.hooks.content.register((contents) => {
            this.applySettingsToIframe(contents);
        });
    }

    /**
     * 处理鼠标滚轮翻页 (Fix: Prevent blocking sidebar scroll)
     */
    handleWheel(e) {
        if (!this.rendition) return;
        
        // BUG FIX: Only trigger wheel page turn if hovering over the viewer
        if (!this.epubViewer.contains(e.target)) return;

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.ctrlKey) return;

        e.preventDefault();
        e.stopPropagation();

        if (e.deltaY > 0) {
            this.nextPage();
        } else {
            this.prevPage();
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            e.target.value = '';
            this.loadEpub(file);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith('.epub')) {
            this.loadEpub(file);
        } else {
            this.showNotification('请上传 .epub 格式的电子书文件');
        }
    }

    loadEpub(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            this.bookData = e.target.result;
            const fileName = file.name;

            try {
                this.book = ePub(this.bookData);

                this.book.loaded.metadata.then((metadata) => {
                    this.currentBookInfo = {
                        title: metadata.title || fileName,
                        author: metadata.creator || '未知作者',
                        cover: null,
                        fileName: fileName,
                        lastRead: new Date().toISOString(),
                        progress: 0
                    };

                    this.book.loaded.cover.then((coverData) => {
                        if (coverData) {
                            this.currentBookInfo.cover = coverData;
                        }
                        this.addToBookshelf(this.currentBookInfo, this.bookData);
                    }).catch(() => {
                        this.addToBookshelf(this.currentBookInfo, this.bookData);
                    });
                });

                this.rendition = this.book.renderTo('epubViewer', {
                    width: '100%',
                    height: '100%',
                    flow: 'paginated',
                    manager: 'default',
                    spread: this.settings.spread
                });

                this.epubViewer.setAttribute('data-viewer', this.settings.displayMode);

                this.rendition.hooks.content.register((contents) => {
                    this.applySettingsToIframe(contents);
                });

                this.rendition.display().then(() => {
                    this.uploadArea.style.display = 'none';
                    this.epubViewer.style.display = 'block';
                    this.loadTableOfContents();
                    this.updatePageInfo();
                    
                    this.book.locations.generate(1000).then(() => {
                        this.updateProgress();
                    });

                    this.rendition.on('relocated', (location) => {
                        this.currentLocation = location;
                        this.updatePageInfo();
                        this.updateProgress();
                        this.saveReadingProgress();
                    });

                    this.applySettingsToAllContent();
                    this.showNotification('电子书加载成功！');
                }).catch(err => {
                    console.error("Rendering error:", err);
                    this.showNotification("渲染书籍时出错");
                });

            } catch (error) {
                console.error('加载电子书失败:', error);
                this.showNotification('加载电子书失败，请检查文件格式');
            }
        };

        reader.onerror = () => {
            this.showNotification('读取文件失败');
        };

        reader.readAsArrayBuffer(file);
    }

    loadTableOfContents() {
        this.book.loaded.navigation.then((nav) => {
            this.toc = nav.toc;
            this.renderToc(this.toc);
        });
    }

    renderToc(toc, level = 0) {
        if(level === 0) this.tocList.innerHTML = '';

        toc.forEach(item => {
            const tocItem = document.createElement('div');
            tocItem.className = `toc-item level-${level + 1}`;
            tocItem.textContent = item.label.trim() || '无标题';
            tocItem.dataset.href = item.href;

            tocItem.addEventListener('click', () => {
                if (this.rendition) {
                    this.isChangingChapter = true;
                    this.rendition.display(item.href).then(() => {
                        this.isChangingChapter = false;
                    });
                    this.closePanel(this.tocPanel);
                }
            });

            this.tocList.appendChild(tocItem);

            if (item.subitems && item.subitems.length > 0) {
                this.renderToc(item.subitems, level + 1);
            }
        });

        if (toc.length === 0 && level === 0) {
            this.tocList.innerHTML = '<p class="placeholder-text">该电子书没有目录</p>';
        }
    }

    prevPage() {
        if (!this.rendition || this.isChangingChapter) return;
        
        const startCfi = this.currentLocation ? this.currentLocation.start.cfi : null;
        
        this.rendition.prev().then(() => {
            // 检查是否真的翻页了
            if (this.currentLocation && startCfi && this.currentLocation.start.cfi === startCfi) {
                // 没有翻页，可能已经到达开头
                this.showNotification('已经是第一页了');
            }
        }).catch(() => {
            this.showNotification('已经是第一页了');
        });
    }

    nextPage() {
        if (!this.rendition || this.isChangingChapter) return;
        
        const startCfi = this.currentLocation ? this.currentLocation.start.cfi : null;
        
        this.rendition.next().then(() => {
            // 检查是否真的翻页了
            if (this.currentLocation && startCfi && this.currentLocation.start.cfi === startCfi) {
                // 没有翻页，可能已经到达结尾
                this.showNotification('已经是最后一页了');
            }
        }).catch(() => {
            this.showNotification('已经是最后一页了');
        });
    }

    updatePageInfo() {
        if (this.rendition && this.currentLocation) {
            // Note: Epub.js locations can be vague depending on generation
            // Simplified display
            this.pageInfo.textContent = `阅读中`; 
            
            // Try to get real page info if available via locations
            if(this.currentLocation.start && this.currentLocation.start.displayed) {
                 const currentPage = this.currentLocation.start.displayed.page;
                 const totalPages = this.currentLocation.start.displayed.total;
                 if(currentPage && totalPages) {
                    this.pageInfo.textContent = `${currentPage} / ${totalPages}`;
                 }
            }

            this.prevBtn.disabled = false;
            this.nextBtn.disabled = false;
        } else {
            this.pageInfo.textContent = '0 / 0';
            this.prevBtn.disabled = true;
            this.nextBtn.disabled = true;
        }
    }

    updateProgress() {
        if (this.rendition && this.currentLocation && this.book && this.book.locations.length() > 0) {
            try {
                const progress = this.currentLocation.start.cfi ?
                    this.book.locations.percentageFromCfi(this.currentLocation.start.cfi) : 0;
                const percentage = Math.max(0, Math.min(100, progress * 100));
                this.progressBar.style.width = percentage + '%';

                if (this.currentBookInfo) {
                    this.currentBookInfo.progress = percentage;
                    this.updateBookshelfProgress(this.currentBookInfo.fileName, percentage);
                }
            } catch (e) {
                console.warn('更新进度失败:', e);
            }
        }
    }

    saveReadingProgress() {
        if (this.currentBookInfo && this.currentLocation) {
            this.currentBookInfo.lastRead = new Date().toISOString();
            this.updateBookshelfBook(this.currentBookInfo);
        }
    }

    adjustFontSize(delta) {
        const newSize = this.settings.fontSize + delta;
        if (newSize >= 12 && newSize <= 32) {
            this.settings.fontSize = newSize;
            this.fontSizeDisplay.textContent = newSize + 'px';
            this.applySettingsToAllContent();
        }
    }

    setTheme(theme) {
        this.settings.theme = theme;
        document.body.classList.remove('theme-light', 'theme-sepia', 'theme-dark', 'theme-green');
        document.body.classList.add(`theme-${theme}`);
    }

    updateThemeButtons(activeTheme) {
        this.themeBtns.forEach(btn => {
            if (btn.dataset.theme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    applySettings() {
        if(this.epubViewer) {
            this.epubViewer.style.filter = `brightness(${this.settings.brightness}%)`;
        }
    }

    applySettingsToAllContent() {
        if (!this.rendition) return;

        // Apply to current view
        this.applySettingsToIframe();

        // Apply to any other iframes in the viewer (for spread mode)
        const iframes = this.epubViewer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            this.applySettingsToIframe(iframe);
        });
    }

    applySettingsToIframe(target) {
        let doc;
        
        // 处理不同类型的 target
        if (target && target.document) {
            // target 是 contents 对象（epub.js）
            doc = target.document;
        } else if (target && target.contentDocument) {
            // target 是 iframe 元素
            doc = target.contentDocument;
        } else {
            // 获取当前活跃的 iframe
            const iframe = this.epubViewer.querySelector('iframe');
            if (!iframe) return;
            doc = iframe.contentDocument;
        }

        if (!doc || !doc.head) return;

        const fontSize = this.settings.fontSize + 'px';
        
        // 改进字体设置，确保中文显示正常
        let fontFamily;
        if (this.settings.fontFamily === 'default') {
            // 默认使用系统字体栈，优先中文字体
            fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif';
        } else {
            fontFamily = this.settings.fontFamily;
        }

        let bgColor, textColor;
        switch (this.settings.theme) {
            case 'light': bgColor = '#ffffff'; textColor = '#333333'; break;
            case 'sepia': bgColor = '#f4ecd8'; textColor = '#5c4b37'; break;
            case 'dark': bgColor = '#2d2d2d'; textColor = '#e0e0e0'; break;
            case 'green': bgColor = '#e8f5e9'; textColor = '#2e7d32'; break;
            default: bgColor = this.settings.customBgColor; textColor = this.settings.customTextColor;
        }

        const cssId = 'reader-custom-styles';
        let styleEl = doc.getElementById(cssId);
        if(!styleEl) {
            styleEl = doc.createElement('style');
            styleEl.id = cssId;
            doc.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            * {
                box-sizing: border-box !important;
            }
            html {
                margin: 0 !important;
                padding: 0 !important;
            }
            body {
                font-size: ${fontSize} !important;
                font-family: ${fontFamily} !important;
                line-height: ${this.settings.lineHeight} !important;
                color: ${textColor} !important;
                background-color: ${bgColor} !important;
                margin: 0 !important;
                padding: ${this.settings.padding}px !important;
            }
            p { 
                margin-bottom: 1em !important; 
            }
            img { 
                max-width: 100% !important; 
                height: auto !important; 
                display: block !important;
                margin: 0 auto !important;
            }
        `;
    }

    togglePanel(panel) {
        if (panel === this.settingsPanel) {
            this.closePanel(this.tocPanel);
            this.closePanel(this.bookshelfPanel);
        } else if (panel === this.tocPanel) {
            this.closePanel(this.settingsPanel);
            this.closePanel(this.bookshelfPanel);
        } else if (panel === this.bookshelfPanel) {
            this.closePanel(this.settingsPanel);
            this.closePanel(this.tocPanel);
            this.renderBookshelf();
        }
        panel.classList.toggle('active');
    }

    closePanel(panel) {
        panel.classList.remove('active');
    }

    handleKeyboard(e) {
        if (!this.rendition) return;
        switch (e.key) {
            case 'ArrowLeft': e.preventDefault(); this.prevPage(); break;
            case 'ArrowRight': e.preventDefault(); this.nextPage(); break;
            case '+':
            case '=': 
                if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.adjustFontSize(2); } 
                break;
            case '-': 
                if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.adjustFontSize(-2); } 
                break;
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification fade-in';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8); color: white; padding: 12px 24px;
            border-radius: 8px; z-index: 2000; font-size: 14px; text-align: center;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadBookshelf() {
        try {
            const data = localStorage.getItem('epub-bookshelf');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('加载书架失败:', e);
            return [];
        }
    }

    saveBookshelf() {
        try {
            localStorage.setItem('epub-bookshelf', JSON.stringify(this.bookshelf));
        } catch (e) {
            console.error('保存书架失败:', e);
        }
    }

    addToBookshelf(bookInfo, bookData) {
        const existingIndex = this.bookshelf.findIndex(b => b.fileName === bookInfo.fileName);
        if (existingIndex >= 0) {
            this.bookshelf[existingIndex] = bookInfo;
        } else {
            this.bookshelf.push(bookInfo);
        }
        this.saveBookData(bookInfo.fileName, bookData);
        this.saveBookshelf();
    }

    updateBookshelfBook(bookInfo) {
        const index = this.bookshelf.findIndex(b => b.fileName === bookInfo.fileName);
        if (index >= 0) {
            this.bookshelf[index] = bookInfo;
            this.saveBookshelf();
        }
    }

    updateBookshelfProgress(fileName, progress) {
        const book = this.bookshelf.find(b => b.fileName === fileName);
        if (book) {
            book.progress = progress;
            book.lastRead = new Date().toISOString();
            this.saveBookshelf();
        }
    }

    removeFromBookshelf(fileName) {
        const index = this.bookshelf.findIndex(b => b.fileName === fileName);
        if (index >= 0) {
            this.bookshelf.splice(index, 1);
            this.saveBookshelf();
            this.deleteBookData(fileName);
            this.renderBookshelf();
            this.showNotification('已从书架移除');
        }
    }

    openBookFromBookshelf(fileName) {
        this.showNotification('正在加载书籍...');
        this.loadBookData(fileName).then(bookData => {
            if (bookData) {
                if (this.rendition) {
                    this.rendition.destroy();
                    this.rendition = null;
                }
                this.book = null;
                this.currentLocation = null;
                this.toc = [];
                this.epubViewer.innerHTML = '';
                this.bookData = bookData;
                this.book = ePub(this.bookData);
                this.currentBookInfo = this.bookshelf.find(b => b.fileName === fileName);
                
                this.rendition = this.book.renderTo('epubViewer', {
                    width: '100%',
                    height: '100%',
                    flow: 'paginated',
                    manager: 'default',
                    spread: this.settings.spread
                });

                this.epubViewer.setAttribute('data-viewer', this.settings.displayMode);
                this.rendition.hooks.content.register((contents) => {
                    this.applySettingsToIframe(contents);
                });

                this.rendition.display().then(() => {
                    this.uploadArea.style.display = 'none';
                    this.epubViewer.style.display = 'block';
                    this.loadTableOfContents();
                    this.updatePageInfo();
                    this.book.locations.generate(1000).then(() => {
                        this.updateProgress();
                    });
                    this.rendition.on('relocated', (location) => {
                        this.currentLocation = location;
                        this.updatePageInfo();
                        this.updateProgress();
                        this.saveReadingProgress();
                    });
                    this.applySettingsToAllContent();
                    this.closePanel(this.bookshelfPanel);
                    this.showNotification('书籍加载成功！');
                });
            } else {
                this.showNotification('无法加载书籍数据');
            }
        });
    }

    renderBookshelf() {
        this.bookshelfList.innerHTML = '';
        if (this.bookshelf.length === 0) {
            this.bookshelfList.innerHTML = '<p class="placeholder-text">书架是空的，点击右下角的导入按钮添加书籍</p>';
            return;
        }
        const sortedBooks = [...this.bookshelf].sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));
        sortedBooks.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.className = 'bookshelf-item';
            let coverHtml = book.cover ? `<img src="${book.cover}" class="book-cover">` : `<div class="book-cover book-cover-default">...</div>`;
            bookItem.innerHTML = `
                ${coverHtml}
                <div class="book-info">
                    <h4 class="book-title">${book.title}</h4>
                    <div class="book-progress">
                        <div class="progress-bar"><div class="progress" style="width: ${book.progress||0}%"></div></div>
                        <span class="progress-text">${Math.round(book.progress||0)}%</span>
                    </div>
                </div>
                <div class="book-actions">
                    <button class="book-action-btn read-btn">阅读</button>
                    <button class="book-action-btn delete-btn">删除</button>
                </div>
            `;
            bookItem.querySelector('.read-btn').addEventListener('click', (e) => { e.stopPropagation(); this.openBookFromBookshelf(book.fileName); });
            bookItem.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); if(confirm('删除?')) this.removeFromBookshelf(book.fileName); });
            this.bookshelfList.appendChild(bookItem);
        });
    }

    saveBookData(fileName, bookData) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EpubReaderDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(['books'], 'readwrite');
                tx.objectStore('books').put({ fileName, data: bookData, savedAt: new Date().toISOString() });
                tx.oncomplete = () => resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'fileName' });
            };
        });
    }

    loadBookData(fileName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EpubReaderDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const req = db.transaction(['books'], 'readonly').objectStore('books').get(fileName);
                req.onsuccess = () => resolve(req.result ? req.result.data : null);
            };
            request.onupgradeneeded = (e) => {
                 const db = e.target.result;
                 if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'fileName' });
            };
        });
    }
    
    deleteBookData(fileName) {
        return new Promise((resolve) => {
            const request = indexedDB.open('EpubReaderDB', 1);
            request.onsuccess = () => {
                const db = request.result;
                db.transaction(['books'], 'readwrite').objectStore('books').delete(fileName).onsuccess = () => resolve();
            };
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.epubReader = new EpubReader(); });