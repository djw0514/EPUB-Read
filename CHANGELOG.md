# 更新日志

## 2024-01-26 - UI 改进

### 1. 自定义配色功能优化

**改进内容：**
- 将"自定义背景色"改为"自定义配色"
- 为背景色和文字色添加了清晰的标签说明
- 优化了颜色选择器的布局，使用并排显示

**修改文件：**
1. `index.html` - 更新了设置面板中的自定义配色部分
2. `styles.css` - 添加了新的样式类：
   - `.color-setting-group` - 配色组容器
   - `.color-setting-item` - 单个配色项
   - `.color-setting-item label` - 配色标签样式

**视觉效果：**
- 背景色和文字色现在并排显示
- 每个颜色选择器上方都有清晰的标签（"背景色"和"文字色"）
- 布局更加清晰直观，用户体验更好

**技术细节：**
```html
<div class="color-setting-group">
    <div class="color-setting-item">
        <label for="customBgColor">背景色</label>
        <input type="color" id="customBgColor" value="#ffffff" class="color-picker">
    </div>
    <div class="color-setting-item">
        <label for="customTextColor">文字色</label>
        <input type="color" id="customTextColor" value="#333333" class="color-picker">
    </div>
</div>
```

**兼容性：**
- 完全向后兼容，不影响现有功能
- 保存的设置仍然可以正常加载
- 所有浏览器均支持

---

### 2. 新增"自定义"主题选项

**新增功能：**
- 在背景主题选项中新增"自定义"主题按钮
- 用户可以直接选择"自定义"主题来使用自己设置的配色
- 当用户调整自定义配色时，自动切换到"自定义"主题

**修改文件：**
1. `index.html` - 在主题选项中添加"自定义"按钮
2. `styles.css` - 更新样式：
   - 将主题选项布局从 4 列改为 5 列
   - 添加 `.custom-preview` 样式（渐变显示背景色和文字色）
   - 调整按钮大小以适应 5 个按钮
3. `app.js` - 添加逻辑：
   - 在 `applySettingsToIframe` 中添加 'custom' 主题处理
   - 在 `setTheme` 中添加 'theme-custom' 类处理
   - 新增 `updateCustomThemePreview()` 方法动态更新预览
   - 修改自定义颜色事件处理器，自动切换到自定义主题

**功能特点：**
- 自定义主题预览使用渐变效果，左下角显示背景色，右上角显示文字色
- 当用户修改自定义配色时，预览会实时更新
- 自动切换到"自定义"主题并高亮显示
- 设置会自动保存，下次打开时恢复

**用户体验：**
```
主题选项：
┌────┬────┬────┬────┬────────┐
│亮色│护眼│深色│绿意│ 自定义 │
└────┴────┴────┴────┴────────┘
```

**技术实现：**
```javascript
// 自定义主题预览动态更新
updateCustomThemePreview() {
    const customPreview = document.querySelector('.custom-preview');
    if (customPreview) {
        customPreview.style.background = `linear-gradient(135deg, 
            ${this.settings.customBgColor} 50%, 
            ${this.settings.customTextColor} 50%)`;
    }
}
```

**兼容性：**
- 完全向后兼容
- 旧版本保存的设置可以正常加载
- 如果之前使用的是自定义配色，会自动识别为"自定义"主题
