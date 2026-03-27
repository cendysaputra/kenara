import './style.css'
import { renderScreens, getTotalScreens, getChapterForScreenIndex, getFirstScreenIndexForChapter } from './scene-manager.js'
import { initScrollController } from './scroll-controller.js'
import { transitionScenes } from './transitions.js'
import { initAudio } from './audio-controller.js'
import { preloadInitialScenes, preloadNearbyScenes } from './image-preloader.js'
import { initTranslate } from './translate-controller.js'

const SCREEN_STORAGE_KEY = 'kenara-screen-index'

function getSavedScreenIndex(totalScreens) {
  const rawValue = Number.parseInt(localStorage.getItem(SCREEN_STORAGE_KEY) ?? '0', 10)
  if (Number.isNaN(rawValue)) return 0
  return Math.min(Math.max(rawValue, 0), totalScreens - 1)
}

function saveScreenIndex(index) {
  localStorage.setItem(SCREEN_STORAGE_KEY, String(index))
}

function applyInitialScreenState(index) {
  const screens = container.querySelectorAll('.screen')

  screens.forEach((screen, screenIndex) => {
    screen.classList.toggle('active', screenIndex === index)
  })

  document.body.classList.toggle('hero-active', index === 0)
}

// 1. Render all screens (hero + chapter cards + scenes + ending)
const container = document.getElementById('story-container')
const totalScreens = renderScreens(container)
const savedScreenIndex = getSavedScreenIndex(totalScreens)
applyInitialScreenState(savedScreenIndex)
saveScreenIndex(savedScreenIndex)

// 2. Render chapter nav dots (7 chapters)
const nav = document.getElementById('chapter-nav')
for (let i = 1; i <= 7; i++) {
  const dot = document.createElement('button')
  dot.className = `dot ${i === 1 ? 'active' : ''}`
  dot.dataset.chapter = i
  dot.setAttribute('aria-label', `Chapter ${i}`)
  nav.appendChild(dot)
}

// 3. Initialize scroll controller
initScrollController((fromIndex, toIndex) => {
  const allScreens = container.querySelectorAll('.screen')
  const fromEl = allScreens[fromIndex]
  const toEl = allScreens[toIndex]

  if (toIndex === 0) {
    document.body.classList.add('hero-active')
  } else {
    document.body.classList.remove('hero-active')
  }

  if (fromEl && toEl) {
    transitionScenes(fromEl, toEl)
  }

  saveScreenIndex(toIndex)
  preloadNearbyScenes(toIndex, 2)
}, savedScreenIndex)

// 4. Chapter dot click navigation
document.querySelectorAll('#chapter-nav .dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const targetChapter = parseInt(dot.dataset.chapter)
    const targetIndex = getFirstScreenIndexForChapter(targetChapter)
    if (targetIndex >= 0 && typeof window.scrollToScreen === 'function') {
      window.scrollToScreen(targetIndex)
    }
  })
})

// 5. Initialize audio
initAudio()
initTranslate()

// 6. Preload initial visuals and keep the next scenes warm
preloadInitialScenes(4)
preloadNearbyScenes(savedScreenIndex, 2)

// 7. Disable zooming (ctrl + wheel / ctrl + keys)
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) {
    e.preventDefault();
  }
});
