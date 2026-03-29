import { getChapterForScreenIndex, getTotalScreens } from './scene-manager.js'

let currentScreen = 0
let lastScrollTime = 0

export function initScrollController(onScreenChange, initialScreen = 0) {
  const totalScreens = getTotalScreens()
  currentScreen = Math.min(Math.max(initialScreen, 0), totalScreens - 1)

  // Matikan scroll bawaan browser.
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.height = '100%'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'

  let touchStartY = 0
  
  function navigate(direction) {
    // Dari hero, lanjut lewat tombol start.
    if (currentScreen === 0 && direction > 0) return

    // Satu scroll pindah satu layar.
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

  // Scroll mouse.
  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > 20) {
      navigate(e.deltaY > 0 ? 1 : -1)
    }
  }, { passive: false })

  // Swipe layar.
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY
  }, { passive: false })

  window.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].screenY
    const deltaY = touchStartY - touchEndY
    if (Math.abs(deltaY) > 50) {
      navigate(deltaY > 0 ? 1 : -1)
    }
  }, { passive: false })

  // Tombol keyboard.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      navigate(1)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      navigate(-1)
    }
  }, { passive: false })
  
  // Set UI awal.
  updateProgressBar(currentScreen / (totalScreens - 1))
  updateChapterNav(getChapterForScreenIndex(currentScreen))
  
  // Dipakai tombol chapter.
  window.scrollToScreen = (index) => {
    if (index === currentScreen || index < 0 || index >= totalScreens) return
    const prev = currentScreen
    currentScreen = index
    lastScrollTime = Date.now()
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
