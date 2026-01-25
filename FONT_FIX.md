# 中文字体显示修复说明

## 问题描述
部分汉字无法正常显示，显示为方框或乱码。

## 问题原因

### 1. 字体回退问题
```javascript
// 之前的代码
let fontFamily = this.settings.fontFamily !== 'default' ? this.settings.fontFamily : 'inherit';
// 然后在 CSS 中
font-family: ${fontFamily}, serif !important;
```

**问题：**
- 当使用 'inherit' 时，可能继承到不支持中文的字体
- 添加 `, serif` 后缀会强制使用衬线字体
- 西文衬线字体（如 Times New Roman）通常不包含完整的中文字符集

### 2. 字体选项不准确
```html
<!-- 之前的代码 -->
<option value="serif">宋体</option>
<option value="sans-serif">黑体</option>
```

**问题：**
- `serif` 和 `sans-serif` 是通用字体族，不是具体字体
- 浏览器可能选择不支持中文的字体

## 修复方案

### 1. 改进默认字体栈

**修复后：**
```javascript
let fontFamily;
if (this.settings.fontFamily === 'default') {
    // 使用完整的中文字体栈
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif';
} else {
    fontFamily = this.settings.fontFamily;
}
```

**字体栈说明：**
- `-apple-system`: macOS 系统字体
- `BlinkMacSystemFont`: Chrome on macOS
- `"Segoe UI"`: Windows 系统字体
- `"Microsoft YaHei"`, `"微软雅黑"`: Windows 中文字体
- `"PingFang SC"`: macOS 简体中文字体
- `"Hiragino Sans GB"`: macOS 旧版中文字体
- `"Heiti SC"`: macOS 黑体
- `"WenQuanYi Micro Hei"`: Linux 中文字体
- `sans-serif`: 最终回退

### 2. 更新字体选项

**修复后：**
```html
<select id="fontFamily" class="setting-select">
    <option value="default">默认字体</option>
    <option value="'SimSun', 'STSong', serif">宋体</option>
    <option value="'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif">微软雅黑</option>
    <option value="'SimHei', 'STHeiti', sans-serif">黑体</option>
    <option value="'KaiTi', 'STKaiti', serif">楷体</option>
    <option value="'FangSong', 'STFangsong', serif">仿宋</option>
    <option value="'Courier New', 'Consolas', monospace">等宽字体</option>
</select>
```

**改进点：**
- 每个选项都指定了具体的中文字体名称
- 提供了跨平台的字体回退
- Windows 和 macOS 都有对应的字体

### 3. 移除 serif 后缀

**修复前：**
```javascript
font-family: ${fontFamily}, serif !important;
```

**修复后：**
```javascript
font-family: ${fontFamily} !important;
```

**原因：**
- 字体栈已经包含了合适的回退字体
- 不需要额外添加 `serif` 后缀
- 避免强制使用可能不支持中文的衬线字体

## 字体支持说明

### Windows 平台
- **宋体**: SimSun
- **黑体**: SimHei
- **微软雅黑**: Microsoft YaHei
- **楷体**: KaiTi
- **仿宋**: FangSong

### macOS 平台
- **宋体**: STSong
- **黑体**: STHeiti
- **苹方**: PingFang SC
- **楷体**: STKaiti
- **仿宋**: STFangsong
- **冬青黑体**: Hiragino Sans GB

### Linux 平台
- **文泉驿微米黑**: WenQuanYi Micro Hei
- **文泉驿正黑**: WenQuanYi Zen Hei
- **Noto Sans CJK**: Google 开源字体

## 测试验证

### 1. 基本测试
- [ ] 打开包含中文的 EPUB 文件
- [ ] 检查所有汉字是否正常显示
- [ ] 没有方框或乱码

### 2. 字体切换测试
- [ ] 切换到"宋体"，检查显示
- [ ] 切换到"微软雅黑"，检查显示
- [ ] 切换到"黑体"，检查显示
- [ ] 切换到"楷体"，检查显示
- [ ] 切换到"仿宋"，检查显示
- [ ] 切换回"默认字体"，检查显示

### 3. 特殊字符测试
测试以下字符是否正常显示：
- 常用汉字：你好世界
- 生僻字：龘靐齉爩
- 繁体字：繁體中文
- 标点符号：，。！？；：""''
- 数字和英文：ABC123

### 4. 跨平台测试
- [ ] Windows 系统测试
- [ ] macOS 系统测试
- [ ] Linux 系统测试（如果适用）

## 如果问题仍然存在

### 检查 1：EPUB 文件本身
某些 EPUB 文件可能指定了特定的字体，这些字体可能不存在于系统中。

**解决方案：**
在 CSS 中添加更高优先级的字体设置：
```javascript
body {
    font-family: ${fontFamily} !important;
}
* {
    font-family: inherit !important;  // 强制所有元素继承
}
```

### 检查 2：字符编码
确保 EPUB 文件使用 UTF-8 编码。

### 检查 3：系统字体
确认系统中安装了中文字体：
- Windows: 检查 C:\Windows\Fonts
- macOS: 打开"字体册"应用
- Linux: 使用 `fc-list :lang=zh` 命令

### 检查 4：浏览器设置
某些浏览器可能有字体设置限制：
1. 打开浏览器设置
2. 找到"字体"或"外观"设置
3. 确认中文字体设置正确

## 额外优化建议

### 1. 添加字体加载检测
```javascript
// 检测字体是否可用
async function isFontAvailable(fontName) {
    const testString = '中文测试';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    context.font = `12px ${fontName}`;
    const width1 = context.measureText(testString).width;
    
    context.font = '12px sans-serif';
    const width2 = context.measureText(testString).width;
    
    return width1 !== width2;
}
```

### 2. 提供字体下载链接
如果用户系统缺少某些字体，可以提供下载链接：
- 思源黑体: https://github.com/adobe-fonts/source-han-sans
- 思源宋体: https://github.com/adobe-fonts/source-han-serif
- Noto Sans CJK: https://www.google.com/get/noto/

### 3. 使用 Web Fonts
考虑使用 Web Fonts 服务：
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap" rel="stylesheet">
```

## 技术参考

### CSS Font Stack
推荐的中文字体栈：
```css
font-family: 
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "Microsoft YaHei",
    "微软雅黑",
    "PingFang SC",
    "Hiragino Sans GB",
    "Heiti SC",
    "WenQuanYi Micro Hei",
    sans-serif;
```

### Unicode 范围
中文字符的 Unicode 范围：
- 基本汉字: U+4E00 - U+9FFF
- 扩展 A: U+3400 - U+4DBF
- 扩展 B: U+20000 - U+2A6DF
- 扩展 C-F: 更多扩展区域

## 总结

通过以下修复，中文显示问题应该得到解决：
1. ✅ 使用完整的中文字体栈
2. ✅ 指定具体的中文字体名称
3. ✅ 移除可能导致问题的 serif 后缀
4. ✅ 提供跨平台的字体支持

如果问题仍然存在，请检查 EPUB 文件本身和系统字体配置。
