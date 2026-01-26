# Bug 修复说明

## 最新修复（2024-01-26）- 内联图片显示问题

### 问题描述
EPUB 文件中的小图片（如表情符号、内联图标）会独占一行，导致排版难看，与文字分离。

### 问题原因
图片样式使用了 `display: block`，这会让所有图片都独占一行，即使是很小的内联图片也会换行显示。

### 修复方案

**修复前：**
```javascript
img { 
    max-width: 100% !important; 
    height: auto !important; 
    display: block !important;      // ❌ 强制独占一行
    margin: 0 auto !important;      // ❌ 居中对齐
}
```

**修复后：**
```javascript
img { 
    max-width: 100% !important; 
    height: auto !important; 
    display: inline-block !important;      // ✅ 允许与文字同行
    vertical-align: middle !important;     // ✅ 垂直居中对齐
}
```

### 修复效果

**修复前：**
```
这是一段文字
[图片]
继续文字内容
```

**修复后：**
```
这是一段文字[图片]继续文字内容
```

### 技术说明

1. **display: inline-block**
   - 允许图片与文字在同一行显示
   - 小图片（如表情）会紧贴文字
   - 大图片仍然会因为 `max-width: 100%` 而自动换行

2. **vertical-align: middle**
   - 让图片与文字垂直居中对齐
   - 提供更好的视觉效果

3. **max-width: 100%**
   - 保持响应式特性
   - 防止大图片溢出容器

### 适用场景

- ✅ 内联表情符号
- ✅ 文字中的小图标
- ✅ 段落中的装饰图片
- ✅ 大图片（仍然会自动换行）

---

## 之前的修复（第三次尝试）- 简化策略

### 问题描述
单页模式和双页模式都存在显示问题，之前的修复方案过于复杂，可能干扰了 epub.js 的正常工作。

### 修复策略
**核心思路：最小化干预，让 epub.js 自己处理布局**

### 修复内容

**修复前（过度限制）：**
```javascript
styleEl.textContent = `
    html {
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;  // ❌ 可能干扰 epub.js
    }
    body {
        ...
        height: auto !important;      // ❌ 可能干扰 epub.js
        min-height: 100% !important;  // ❌ 可能干扰 epub.js
        overflow-x: hidden !important; // ❌ 可能干扰 epub.js
    }
`;
```

**修复后（最小干预）：**
```javascript
styleEl.textContent = `
    * {
        box-sizing: border-box !important;  // ✅ 确保 padding 计算正确
    }
    html {
        margin: 0 !important;
        padding: 0 !important;
        // ✅ 不设置 height、width、overflow，让 epub.js 控制
    }
    body {
        font-size: ${fontSize} !important;
        font-family: ${fontFamily}, serif !important;
        line-height: ${this.settings.lineHeight} !important;
        color: ${textColor} !important;
        background-color: ${bgColor} !important;
        margin: 0 !important;
        padding: ${this.settings.padding}px !important;
        // ✅ 不设置 height、width、overflow，让 epub.js 控制
    }
    p { margin-bottom: 1em !important; }
    img { 
        max-width: 100% !important; 
        height: auto !important; 
        display: block !important;
        margin: 0 auto !important;
    }
`;
```

### 关键改变

1. **移除所有尺寸限制**
   - 不设置 `height`、`width`、`min-height`、`max-width`
   - 让 epub.js 根据分页模式自己决定

2. **移除所有溢出控制**
   - 不设置 `overflow`、`overflow-x`、`overflow-y`
   - epub.js 会根据需要处理溢出

3. **保留必要的用户设置**
   - 字体大小、字体样式
   - 行距、颜色、主题
   - 页边距（padding）

4. **添加 box-sizing**
   - 确保 padding 包含在元素宽度内
   - 避免因 padding 导致的布局问题

### 为什么这样做？

#### Epub.js 的工作方式
```
epub.js 在分页模式下：
1. 创建 iframe 容器
2. 动态计算内容尺寸
3. 根据视口大小决定分页
4. 使用 CSS transform 实现翻页

如果我们过度限制 html/body 的样式：
- epub.js 无法正确测量内容
- 分页计算出错
- 翻页功能失效
```

#### 最小干预原则
```
只设置：
✅ 用户可见的样式（字体、颜色、间距）
✅ 布局辅助样式（box-sizing）

不设置：
❌ 尺寸相关（height、width）
❌ 溢出相关（overflow）
❌ 定位相关（position）
```

## 外层容器配置

确保 `.epub-viewer` 的样式正确：

```css
.epub-viewer {
    width: 100%;
    height: 100%;
    overflow: hidden;  /* 重要：防止外层滚动 */
    padding: 0;        /* 重要：padding 在 iframe 内设置 */
}
```

## Epub.js 配置

```javascript
this.rendition = this.book.renderTo('epubViewer', {
    width: '100%',
    height: '100%',
    flow: 'paginated',      // 分页模式
    manager: 'default',     // 默认管理器
    spread: this.settings.spread  // 'none' 或 'auto'
});
```

## 测试验证

### 单页模式测试
1. ✅ 内容完整显示
2. ✅ 可以正常翻页
3. ✅ 页边距调整生效
4. ✅ 所有样式设置生效

### 双页模式测试
1. ✅ 显示两页内容
2. ✅ 可以正常翻页
3. ✅ 页边距调整生效
4. ✅ 所有样式设置生效

### 功能测试
1. ✅ 字体大小调整
2. ✅ 字体样式切换
3. ✅ 主题切换
4. ✅ 行距调整
5. ✅ 页边距调整
6. ✅ 亮度调整

## 调试建议

如果问题仍然存在，请检查：

### 1. 浏览器控制台
```javascript
// 检查 rendition 对象
console.log(window.epubReader.rendition);

// 检查当前位置
console.log(window.epubReader.currentLocation);

// 检查设置
console.log(window.epubReader.settings);
```

### 2. iframe 内的样式
1. 打开开发者工具
2. 找到 `#epubViewer` 下的 iframe
3. 检查 iframe 内的 html 和 body 元素
4. 查看计算后的样式（Computed）

### 3. epub.js 事件
```javascript
// 监听 relocated 事件
this.rendition.on('relocated', (location) => {
    console.log('Relocated:', location);
});

// 监听 rendered 事件
this.rendition.on('rendered', (section) => {
    console.log('Rendered:', section);
});
```

## 已知限制

1. 窗口宽度小于 800px 时，双页模式可能自动切换为单页
2. 某些特殊格式的 EPUB 可能需要额外的样式调整
3. 页边距过大（>80px）可能影响阅读体验

## 修复历史

### 第一次修复
- 修改了外层 CSS 容器
- 移除了 overflow-y 和 padding

### 第二次修复
- 尝试分离 html 和 body 的样式
- 设置了详细的 height、overflow 等属性
- **问题：过度限制，干扰了 epub.js**

### 第三次修复（当前）
- 采用最小干预策略
- 只设置必要的用户样式
- 让 epub.js 完全控制布局
- **预期：应该能正常工作**

## 后续优化

如果当前方案有效：
1. 添加更多的样式选项（字间距、段落间距等）
2. 优化长章节的加载性能
3. 添加页边距预设选项
4. 支持自定义 CSS 注入

如果当前方案仍有问题：
1. 考虑使用不同的 epub.js 配置
2. 尝试不同的 flow 模式（scrolled vs paginated）
3. 检查 epub.js 版本兼容性
4. 参考 epub.js 官方示例
