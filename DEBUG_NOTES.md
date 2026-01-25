# EPUB 阅读器调试说明

## 当前修复策略

### 问题分析
单页和双页模式都有问题，可能的原因：
1. iframe 内的样式过度限制了 epub.js 的布局
2. epub.js 的 `flow: 'paginated'` 模式需要特定的 DOM 结构
3. 外层容器的样式影响了 epub.js 的计算

### 最新修复方案（简化样式）

**核心思路：** 最小化干预，让 epub.js 自己处理布局

```javascript
// 只设置必要的样式，不限制 html/body 的尺寸和溢出
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
        font-family: ${fontFamily}, serif !important;
        line-height: ${this.settings.lineHeight} !important;
        color: ${textColor} !important;
        background-color: ${bgColor} !important;
        margin: 0 !important;
        padding: ${this.settings.padding}px !important;
    }
    ...
`;
```

### 为什么这样做？

1. **移除 height/width 限制**：让 epub.js 自己决定内容高度
2. **移除 overflow 限制**：epub.js 会自己处理溢出
3. **保留必要样式**：字体、颜色、padding 等用户设置
4. **box-sizing: border-box**：确保 padding 计算正确

## 调试步骤

### 1. 检查 iframe 内的实际样式
打开浏览器开发者工具：
1. 找到 `#epubViewer` 下的 iframe
2. 检查 iframe 内的 html 和 body 元素
3. 查看计算后的样式（Computed）
4. 确认没有意外的样式覆盖

### 2. 检查 epub.js 的配置
```javascript
this.rendition = this.book.renderTo('epubViewer', {
    width: '100%',
    height: '100%',
    flow: 'paginated',      // 分页模式
    manager: 'default',     // 默认管理器
    spread: 'none'/'auto'   // 单页/双页
});
```

### 3. 检查外层容器
```css
.epub-viewer {
    width: 100%;
    height: 100%;
    overflow: hidden;  /* 重要：防止外层滚动 */
    padding: 0;        /* 重要：不要在外层设置 padding */
}
```

## 可能的问题和解决方案

### 问题 1：内容显示不完整
**症状：** 只能看到部分内容，无法翻页看到更多
**可能原因：**
- body 高度被限制
- overflow: hidden 隐藏了内容
**解决方案：** 移除 body 的 height 和 overflow 限制

### 问题 2：页面无法翻页
**症状：** 点击翻页按钮没有反应
**可能原因：**
- epub.js 无法正确计算页数
- currentLocation 未正确更新
**解决方案：** 检查 relocated 事件是否正常触发

### 问题 3：双页模式显示异常
**症状：** 双页模式下只显示一页或布局错乱
**可能原因：**
- spread: 'auto' 配置问题
- 窗口宽度不足
**解决方案：** 确保窗口宽度足够（至少 800px）

### 问题 4：页边距不生效
**症状：** 调整页边距滑块没有效果
**可能原因：**
- padding 被其他样式覆盖
- box-sizing 设置不正确
**解决方案：** 使用 !important 和 box-sizing: border-box

## Epub.js 分页模式的工作原理

### 单页模式 (spread: 'none')
```
1. epub.js 创建一个 iframe
2. 将内容加载到 iframe 中
3. 测量内容的实际高度
4. 根据视口高度计算页数
5. 使用 CSS transform 切换页面
```

### 双页模式 (spread: 'auto')
```
1. epub.js 创建两个 iframe（或一个分栏的 iframe）
2. 将内容分配到两页
3. 同时显示两页内容
4. 翻页时同时切换两页
```

## 测试清单

- [ ] 单页模式能完整显示内容
- [ ] 单页模式能正常翻页
- [ ] 双页模式能显示两页
- [ ] 双页模式能正常翻页
- [ ] 页边距调整生效
- [ ] 字体大小调整生效
- [ ] 主题切换生效
- [ ] 行距调整生效
- [ ] 在不同 EPUB 文件上测试

## 如果还有问题

### 尝试 1：完全移除自定义样式
临时注释掉 `applySettingsToIframe` 中的所有样式，看 epub.js 默认行为是否正常。

### 尝试 2：检查 epub.js 版本
确认使用的 epub.js 版本是否与配置兼容。

### 尝试 3：查看 epub.js 文档
参考官方文档的示例配置：
https://github.com/futurepress/epub.js/

### 尝试 4：使用浏览器控制台
```javascript
// 在控制台中检查 rendition 对象
console.log(window.epubReader.rendition);
console.log(window.epubReader.currentLocation);
console.log(window.epubReader.settings);
```

## 联系信息
如果问题持续存在，请提供：
1. 浏览器版本和类型
2. EPUB 文件的特征（大小、格式版本）
3. 浏览器控制台的错误信息
4. 截图显示问题
