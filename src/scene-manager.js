import { screens } from './data/screens.js'

export function getTotalScreens() {
  return screens.length
}

export function getScreenData() {
  return screens
}

export function getChapterForScreenIndex(index) {
  const screen = screens[index]
  if (!screen) return null
  if (screen.type === 'hero' || screen.type === 'ending') return null
  return screen.chapter || null
}

export function getFirstScreenIndexForChapter(chapter) {
  return screens.findIndex(s => s.type === 'chapter-card' && s.chapter === chapter)
}

export function renderScreens(container) {
  screens.forEach((data, index) => {
    let el

    switch (data.type) {
      case 'hero':
        el = renderHero(data, index)
        break
      case 'chapter-card':
        el = renderChapterCard(data, index)
        break
      case 'scene':
        el = renderScene(data, index)
        break
      case 'ending':
        el = renderEnding(data, index)
        break
    }

    if (el) {
      el.dataset.index = index
      container.appendChild(el)
    }
  })

  return screens.length
}

function renderHero(data, index) {
  const el = document.createElement('div')
  el.className = `screen screen-hero ${index === 0 ? 'active' : ''}`
  el.style.backgroundImage = `url('${data.background}')`

  el.innerHTML = `
    <h1 class="hero-title">${data.title}</h1>
    <p class="hero-subtitle">${data.subtitle}</p>
    <span class="hero-scroll-hint">↓ Scroll to begin</span>
  `
  return el
}

function renderChapterCard(data, index) {
  const el = document.createElement('div')
  el.className = `screen screen-chapter-card ${data.variant || 'default'}`
  el.dataset.chapter = data.chapter

  el.innerHTML = `
    <span class="chapter-card-label">Chapter ${data.chapter}</span>
    <h2 class="chapter-card-title">${data.chapterTitle}</h2>
  `
  return el
}

function renderScene(data, index) {
  const el = document.createElement('div')
  el.className = 'screen screen-scene'
  el.dataset.chapter = data.chapter
  el.dataset.scene = data.scene
  el.dataset.textPosition = data.textPosition
  el.style.backgroundImage = `url('${data.background}')`

  el.innerHTML = `
    <div class="scene-text">
      <p class="scene-body">${data.text}</p>
    </div>
  `
  return el
}

function renderEnding(data, index) {
  const el = document.createElement('div')
  el.className = 'screen screen-ending'

  el.innerHTML = `
    <p class="ending-text">${data.text}</p>
    <p class="ending-credit">${data.credit}</p>
  `
  return el
}
