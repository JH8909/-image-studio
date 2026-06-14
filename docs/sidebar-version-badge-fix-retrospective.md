# 左侧栏版本号问题复盘与后续准则

## 背景

本次修改目标很小：调整左侧栏视觉，让图标更简洁，底部版本号只直接展示，保留可点击跳转或检测更新能力，但不要出现额外 hover、空白、边框、发光、隐藏等交互状态。

实际执行中，多次偏离了这个目标，改动范围扩大到了全局 glow、标题提示、focus、role、版本检测按钮等逻辑，造成反复返工。

## 真实问题

用户看到的红圈空白位置，不是单纯的 hover 样式问题。

真正根因是这条 CSS：

```css
.update-now-btn.show + .project-version-badge {
    display: none;
}
```

当检测到有新版本时，`update-now-btn` 会显示 `show` 状态，紧挨着的版本号 `project-version-badge` 会被隐藏，所以左侧栏底部出现空白。

另一个相关问题是版本号颜色使用了主题变量：

```css
color: var(--accent);
```

在当前主题下可能显示成黑色，不符合“显示绿色”的要求。

## 错误做法

这次主要错误包括：

1. 没有第一时间锁定 `#project-version-badge` 的显示/隐藏规则。
2. 把“版本号消失”误判为 hover、focus、title 或 glow 状态问题。
3. 修改了全局 glow 逻辑，扩大了影响面。
4. 曾经移除过版本号的点击功能，违背“可以跳转/检测”的要求。
5. 曾误改 `.nav-item.active` 的颜色，影响了无关导航状态。
6. 每次修复后没有围绕用户截图里的可见现象做最小验证。

## 正确解决方案

正确方向应该是只针对版本号和更新按钮之间的显示关系：

```css
.update-now-btn.show {
    display: none !important;
}

.update-now-btn.show + .project-version-badge {
    display: flex !important;
}

.sidebar .project-version-badge,
.sidebar .project-version-badge:hover,
.sidebar .project-version-badge:focus,
.sidebar .project-version-badge:focus-visible,
.sidebar .project-version-badge:active,
.sidebar .project-version-badge.checking {
    color: #22c55e !important;
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    opacity: 1 !important;
    animation: none !important;
    transform: none !important;
    transition: none !important;
}
```

并保留版本号的点击能力：

```html
onclick="checkForUpdates(true)"
```

## 后续执行准则

处理这种 UI 小问题时，必须按下面顺序执行：

1. 先锁定用户截图对应的 DOM 元素。
2. 如果问题是“看不见/空白”，优先查 `display`、`visibility`、`opacity`、`width`、`height` 和相邻选择器。
3. 如果问题是“状态变化”，再查 `:hover`、`:focus`、`:active`、JS 动态 class。
4. 只改目标元素和直接相关元素，不改全局系统。
5. 不删除用户要求保留的功能。
6. 每次只做一个假设对应的一处最小修改。
7. 修改后验证用户实际关心的可见结果，而不是只验证 CSS 字符串存在。

## 针对此项目的检查清单

左侧栏版本号相关修改前，先检查这些位置：

- `static/index.html` 中 `.project-version-badge`
- `static/index.html` 中 `.update-now-btn.show + .project-version-badge`
- `static/index.html` 中 `setProjectVersionBadge()`
- `static/index.html` 中 `showUpdateNotice()`
- `static/js/theme.js` 中全局 glow 选择器

如果用户要求“只展示但可点击”，版本号应满足：

- 始终可见。
- 颜色固定为绿色。
- 无边框、无底色、无阴影。
- hover/focus/active 不发生视觉变化。
- 点击仍可触发更新检测或跳转。
- 不被 `NEW` 或 `update-now-btn.show` 替换或隐藏。

## 验证命令

```powershell
$html = (Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.100:3000/static/index.html' -TimeoutSec 5).Content
$html.Contains('.update-now-btn.show + .project-version-badge { display:flex !important; }')
$html.Contains('color: #22c55e !important;')
$html.Contains('onclick="checkForUpdates(true)"')
```

预期结果：

```text
True
True
True
```

