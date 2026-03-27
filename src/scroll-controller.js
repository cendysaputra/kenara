import { getChapterForScreenIndex, getTotalScreens } from './scene-manager.js'

let currentScreen = 0
let lastScrollTime = 0

export function initScrollController(onScreenChange, initialScreen = 0) {
  const totalScreens = getTotalScreens()
  currentScreen = Math.min(Math.max(initialScreen, 0), totalScreens - 1)

  // Ensure body doesn't actually scroll natively
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.height = '100%'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'

  let touchStartY = 0
  
  function navigate(direction) {
    // Prevent scrolling past hero screen. Must use the start button.
    if (currentScreen === 0 && direction > 0) return

    // Debounce to ensure 1 scroll = 1 section (lock for 1500ms for slower transitions)
    const now = Date.now()
    if (now - lastScrollTime < 1500) return
    lastScrollTime = now

    let targetScreen = currentScreen + direction
    if (targetScreen < 0) targetScreen = 0
    if (targetScreen >= totalScreens) targetScreen = totalScreens - 1

    if (targetScreen !== currentScreen) {
      const previousScreen = currentScreen
      currentScreen = targetScreen
      onScreenChange(previousScreen, currentScreen)
      
      const progress = currentScreen / (totalScreens - 1)
      updateProgressBar(progress)

      const activeChapter = getChapterForScreenIndex(currentScreen)
      updateChapterNav(activeChapter)
    }
  }

  // Wheel listener
  window.addEventListener('wheel', (e) => {
    // Determine direction (+1 for down/next, -1 for up/prev)
    if (Math.abs(e.deltaY) > 20) {
      navigate(e.deltaY > 0 ? 1 : -1)
    }
  }, { passive: false })

  // Touch listener
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY
  }, { passive: false })

  window.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].screenY
    const deltaY = touchStartY - touchEndY
    if (Math.abs(deltaY) > 50) { // Threshold for swipe
      navigate(deltaY > 0 ? 1 : -1)
    }
  }, { passive: false })

  // Keyboard arrows
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      navigate(1)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      navigate(-1)
    }
  }, { passive: false })
  
  // Initial UI setup
  updateProgressBar(currentScreen / (totalScreens - 1))
  updateChapterNav(getChapterForScreenIndex(currentScreen))
  
  // Provide a global goto method for the chapter dots
  window.scrollToScreen = (index) => {
    if (index === currentScreen || index < 0 || index >= totalScreens) return
    const prev = currentScreen
    currentScreen = index
    lastScrollTime = Date.now() // reset debounce
    onScreenChange(prev, currentScreen)
    updateProgressBar(currentScreen / (totalScreens - 1))
    updateChapterNav(getChapterForScreenIndex(currentScreen))
  }
}

function updateProgressBar(progress) {
  const fill = document.getElementById('progress-fill')
  if (fill) fill.style.width = `${progress * 100}%`
}

function updateChapterNav(activeChapter) {
  const dots = document.querySelectorAll('#chapter-nav .dot')
  dots.forEach(dot => {
    const ch = parseInt(dot.dataset.chapter)
    dot.classList.toggle('active', ch === activeChapter)
  })
}

export function getCurrentScreen() {
  return currentScreen
}
