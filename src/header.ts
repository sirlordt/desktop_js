const THEMES = [
  { value: 'gtk4-light', label: 'GTK4 Light' },
  { value: 'gtk4-dark', label: 'GTK4 Dark' },
  { value: 'win95-light', label: 'WIN95 Light' },
  { value: 'win95-dark', label: 'WIN95 Dark' },
] as const

export interface DemoRoute {
  id: string
  label: string
  render: () => string
  setup?: () => void
}

let routes: DemoRoute[] = []

export function registerDemos(demos: DemoRoute[]) {
  routes = demos
}

export function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('desktop-js-theme', theme)
}

export function getTheme(): string {
  return localStorage.getItem('desktop-js-theme') || 'gtk4-light'
}

function getCurrentRoute(): string {
  return window.location.hash.slice(1) || routes[0]?.id || ''
}

export function renderHeader(): string {
  const currentRoute = getCurrentRoute()
  const theme = getTheme()

  return `
    <header class="app-header">
      <div class="header-left">
        <span class="header-title">Desktop.js</span>
        <nav class="header-nav">
          ${routes.map(r => `
            <a href="#${r.id}" class="nav-link ${currentRoute === r.id ? 'active' : ''}">${r.label}</a>
          `).join('')}
        </nav>
      </div>
      <div class="header-right">
        <label for="theme-select" class="header-theme-label">Theme:</label>
        <select id="theme-select" class="header-theme-select">
          ${THEMES.map(t => `<option value="${t.value}" ${t.value === theme ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </header>
  `
}

export function setupHeader() {
  const select = document.querySelector<HTMLSelectElement>('#theme-select')!
  select.addEventListener('change', () => {
    setTheme(select.value)
  })
}

export function navigateTo(routeId: string) {
  window.location.hash = routeId
}

export function renderApp() {
  const currentRoute = getCurrentRoute()
  const route = routes.find(r => r.id === currentRoute) || routes[0]

  if (!route) return

  const app = document.querySelector<HTMLDivElement>('#app')!
  app.innerHTML = `
    ${renderHeader()}
    <main class="demo-content">
      ${route.render()}
    </main>
  `

  setTheme(getTheme())
  setupHeader()
  route.setup?.()
}

export function initApp() {
  setTheme(getTheme())
  renderApp()

  window.addEventListener('hashchange', () => {
    renderApp()
  })
}
