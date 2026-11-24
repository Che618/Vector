window.WorkspaceTheme = (() => {
// 界面风格（主题）管理：传统风格 / 智能风格
const { ref } = Vue

const STORAGE_KEY = 'ui-theme'

// 主题版本号：切换时自增，供图表等需要重算配色的组件依赖
const themeVersion = ref(0)

function applyTheme(value) {
  const t = value === 'haina' || value === 'smart' ? 'smart' : 'classic'
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem(STORAGE_KEY, t)
  themeVersion.value += 1
  return t
}

// 读取当前主题的图表配色（跟随 CSS 变量，切换主题后调用可拿到新值）
function chartPalette() {
  const cs = getComputedStyle(document.documentElement)
  const v = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb
  return {
    primary: v('--brand-primary', '#0e3f8c'),
    accent: v('--brand-accent', '#3d7bd9'),
    accent2: '#7c3aed',
    axis: '#c9d3e0',
    grid: '#eef2f7',
    muted: '#6b7a90',
    series: ['#2e7bf0', '#27b896', '#7c3aed', '#f59e0b', '#ef4444', '#0ea5e9', '#22c55e', '#f97316']
  }
}


return {applyTheme, chartPalette, themeVersion}
})();
