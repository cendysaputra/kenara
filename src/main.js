import './style.css'
import { renderScreens, getTotalScreens, getChapterForScreenIndex, getFirstScreenIndexForChapter } from './scene-manager.js'
import { initScrollController } from './scroll-controller.js'
import { transitionScenes } from './transitions.js'
import { initAudio } from './audio-controller.js'

// 1. Render all screens (hero + chapter cards + scenes + ending)
const container = document.getElementById('story-container')
const totalScreens = renderScreens(container)

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

  if (fromEl && toEl) {
    transitionScenes(fromEl, toEl)
  }
})

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

// 6. Preload first few backgrounds
const preloadImages = [
  '/assets/img/cover-hero.jpg',
  '/assets/img/chapter-1-scene-1.jpg',
  '/assets/img/chapter-1-scene-2.jpg'
]
preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})

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
