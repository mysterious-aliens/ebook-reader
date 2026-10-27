// 电子书阅读器主逻辑

// 全局状态
let state = {
  fileName: '',
  fileSize: 0,
  lines: [],        // 拆分后的文本行
  currentPage: 1,
  totalPages: 1,
  settings: {
    fontSize: 18,
    lineHeight: 1.8,
    theme: 'light'
  }
};

// DOM 元素
const uploadPage = document.getElementById('uploadPage');
const readerPage = document.getElementById('readerPage');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const backBtn = document.getElementById('backBtn');
const fileNameEl = document.getElementById('fileName');
const content = document.getElementById('content');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const progressFill = document.getElementById('progressFill');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const lineHeightSlider = document.getElementById('lineHeightSlider');
const lineHeightValue = document.getElementById('lineHeightValue');
const themeBtns = document.querySelectorAll('.theme-btn');

// 初始化
function init() {
  loadSettings();
  applySettings();
  bindEvents();
}

// 绑定事件
function bindEvents() {
  // 上传按钮
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileUpload);

  // 返回按钮
  backBtn.addEventListener('click', () => {
    saveProgress();
    uploadPage.classList.add('active');
    readerPage.classList.remove('active');
  });

  // 翻页按钮
  prevBtn.addEventListener('click', () => goToPage(state.currentPage - 1));
  nextBtn.addEventListener('click', () => goToPage(state.currentPage + 1));

  // 键盘翻页
  document.addEventListener('keydown', (e) => {
    if (readerPage.classList.contains('active')) {
      if (e.key === 'ArrowLeft') goToPage(state.currentPage - 1);
      if (e.key === 'ArrowRight') goToPage(state.currentPage + 1);
    }
  });

  // 设置面板
  settingsBtn.addEventListener('click', () => settingsPanel.classList.add('open'));
  closeSettings.addEventListener('click', () => settingsPanel.classList.remove('open'));

  // 字号调节
  fontSizeSlider.addEventListener('input', (e) => {
    state.settings.fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = state.settings.fontSize + 'px';
    applySettings();
    calculatePages();
    renderPage();
  });

  // 行间距调节
  lineHeightSlider.addEventListener('input', (e) => {
    state.settings.lineHeight = parseFloat(e.target.value);
    lineHeightValue.textContent = state.settings.lineHeight;
    applySettings();
    calculatePages();
    renderPage();
  });

  // 主题切换
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.settings.theme = btn.dataset.theme;
      applySettings();
    });
  });

  // 窗口大小变化时重新计算分页
  window.addEventListener('resize', () => {
    if (state.lines.length > 0) {
      calculatePages();
      renderPage();
    }
  });
}

// 处理文件上传
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.fileName = file.name;
  state.fileSize = file.size;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    state.lines = text.split('\n');
    
    // 过滤空行？不保留空行，因为排版需要
    // state.lines = state.lines.filter(line => line.trim() !== '');
    
    fileNameEl.textContent = file.name;
    
    // 加载进度
    const savedPage = loadProgress();
    state.currentPage = savedPage || 1;
    
    calculatePages();
    renderPage();
    
    // 切换到阅读页面
    uploadPage.classList.remove('active');
    readerPage.classList.add('active');
    settingsPanel.classList.remove('open');
  };
  reader.readAsText(file, 'UTF-8');
}

// 计算分页
function calculatePages() {
  const containerHeight = content.clientHeight;
  const fontSize = state.settings.fontSize;
  const lineHeight = state.settings.lineHeight;
  const lineHeightPx = fontSize * lineHeight;
  
  const linesPerPage = Math.floor(containerHeight / lineHeightPx);
  
  state.totalPages = Math.ceil(state.lines.length / linesPerPage);
  
  // 确保当前页码不超过总页数
  if (state.currentPage > state.totalPages) {
    state.currentPage = state.totalPages;
  }
  
  updatePageInfo();
}

// 渲染当前页
function renderPage() {
  const fontSize = state.settings.fontSize;
  const lineHeight = state.settings.lineHeight;
  const lineHeightPx = fontSize * lineHeight;
  
  const containerHeight = content.clientHeight;
  const linesPerPage = Math.floor(containerHeight / lineHeightPx);
  
  const start = (state.currentPage - 1) * linesPerPage;
  const end = start + linesPerPage;
  
  const pageLines = state.lines.slice(start, end);
  content.textContent = pageLines.join('\n');
  
  updatePageInfo();
}

// 跳转到指定页
function goToPage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.currentPage = page;
  renderPage();
  saveProgress();
}

// 更新页面信息
function updatePageInfo() {
  currentPageEl.textContent = state.currentPage;
  totalPagesEl.textContent = state.totalPages;
  
  const progress = (state.currentPage / state.totalPages) * 100;
  progressFill.style.width = progress + '%';
  
  prevBtn.disabled = state.currentPage <= 1;
  nextBtn.disabled = state.currentPage >= state.totalPages;
}

// 保存阅读进度
function saveProgress() {
  if (!state.fileName) return;
  const key = `reader_${state.fileName}_${state.fileSize}`;
  localStorage.setItem(key, state.currentPage.toString());
}

// 加载阅读进度
function loadProgress() {
  if (!state.fileName) return 1;
  const key = `reader_${state.fileName}_${state.fileSize}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved) : 1;
}

// 保存设置
function saveSettings() {
  localStorage.setItem('reader_settings', JSON.stringify(state.settings));
}

// 加载设置
function loadSettings() {
  const saved = localStorage.getItem('reader_settings');
  if (saved) {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
  }
  
  // 更新滑块位置
  fontSizeSlider.value = state.settings.fontSize;
  fontSizeValue.textContent = state.settings.fontSize + 'px';
  lineHeightSlider.value = state.settings.lineHeight;
  lineHeightValue.textContent = state.settings.lineHeight;
  
  // 更新主题按钮
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === state.settings.theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 应用设置
function applySettings() {
  content.style.fontSize = state.settings.fontSize + 'px';
  content.style.lineHeight = state.settings.lineHeight;
  
  if (state.settings.theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  
  saveSettings();
}

// 启动
init();
