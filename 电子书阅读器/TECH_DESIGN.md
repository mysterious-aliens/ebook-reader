# 电子书阅读器 技术设计文档

## 一、技术栈选型

### 1.1 选型结论
| 层 | 选型 | 理由 |
|----|------|------|
| 前端 | 原生 HTML + CSS + JavaScript | 纯静态页面，不需要框架，加载快 |
| 样式 | CSS3 + Flexbox/Grid | 简单布局，不需要预处理器 |
| 文件处理 | FileReader API | 浏览器原生，本地解析，不上传服务器 |
| 存储 | localStorage | 浏览器本地存储，保存阅读设置和进度 |
| 部署 | GitHub Pages | 免费静态托管，自动部署 |

### 1.2 为什么不用框架？
这个项目非常简单，只有一个页面，功能也不多。用 React/Vue 反而增加构建步骤和复杂度。原生 HTML/CSS/JS 足够用，而且直接打开就能跑，不需要任何构建工具。

---

## 二、系统架构

### 2.1 整体架构
纯前端单页应用，所有逻辑都在浏览器端运行：

```
┌─────────────────────────────────┐
│          浏览器端                │
│  ┌─────────┐  ┌──────────────┐ │
│  │ 文件上传 │→ │ 文本解析模块  │ │
│  └─────────┘  └──────┬───────┘ │
│                     ↓          │
│  ┌─────────┐  ┌──────────────┐ │
│  │ 进度存储 │← │ 分页渲染模块  │ │
│  └─────────┘  └──────┬───────┘ │
│                     ↓          │
│              ┌──────────────┐  │
│              │ 阅读设置模块  │  │
│              └──────────────┘  │
└─────────────────────────────────┘
```

### 2.2 模块划分
1. **文件上传模块**：处理用户上传 TXT 文件，读取文本内容
2. **分页渲染模块**：根据字号、行间距、容器高度计算每页显示多少行，渲染当前页
3. **阅读设置模块**：管理字号、行间距、主题等设置，实时生效
4. **进度存储模块**：保存和恢复阅读进度，按文件名区分

---

## 三、核心技术实现

### 3.1 文件上传与解析
使用 FileReader API 读取本地 TXT 文件：

```javascript
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    // 处理文本，开始阅读
  };
  reader.readAsText(file, 'UTF-8');
});
```

### 3.2 分页计算
分页是核心难点。不能简单按字数分页，因为不同字号、不同行间距下，每行能放的字数不一样。

解决方案：**按行分页**。
1. 把文本按换行符 `\n` 拆成行数组
2. 根据容器高度和行高，计算每页能放多少行
3. 根据当前页码，算出要显示哪几行

```javascript
function getLinesPerPage() {
  const containerHeight = document.getElementById('content').clientHeight;
  const lineHeight = parseFloat(getComputedStyle(content).lineHeight);
  return Math.floor(containerHeight / lineHeight);
}
```

### 3.3 阅读进度记忆
用 localStorage 保存进度：
- key：文件名 + 文件大小（简单哈希，区分不同文件）
- value：当前页码

```javascript
function saveProgress(fileName, currentPage) {
  const key = `reader_${fileName}_${fileSize}`;
  localStorage.setItem(key, currentPage);
}

function loadProgress(fileName, fileSize) {
  const key = `reader_${fileName}_${fileSize}`;
  return parseInt(localStorage.getItem(key)) || 1;
}
```

### 3.4 阅读设置
字号、行间距等设置也存到 localStorage，下次打开自动恢复：

```javascript
const settings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light'
};

function saveSettings() {
  localStorage.setItem('reader_settings', JSON.stringify(settings));
}
```

---

## 四、目录结构

```
电子书阅读器/
├── index.html          # 主页面
├── style.css           # 样式文件
├── app.js              # 主逻辑
├── PRD.md              # 需求文档
├── TECH_DESIGN.md      # 技术设计文档
└── AGENTS.md           # 项目说明
```

---

## 五、部署方案

### 5.1 部署方式
用 GitHub Pages 部署，步骤：
1. 把代码推送到 GitHub 仓库
2. 开启 GitHub Pages
3. 自动得到域名

### 5.2 域名格式
`https://mysterious-aliens.github.io/电子书阅读器/`

---

## 六、性能考虑

1. **大文件处理**：虽然是本地解析，但几十 MB 的 TXT 文件一次性读进来也会卡。可以优化成分段读取，但 MVP 版本先不做，先支持 10MB 以内的文件。
2. **渲染性能**：每次翻页只渲染当前页的内容，不渲染全部，保证流畅。
3. **存储限制**：localStorage 一般有 5MB 限制，存阅读进度和设置足够了。
