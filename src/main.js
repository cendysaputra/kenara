import './style.css'
import { renderScreens, getTotalScreens, getChapterForScreenIndex, getFirstScreenIndexForChapter } from './scene-manager.js'
import { initScrollController } from './scroll-controller.js'
import { transitionScenes } from './transitions.js'
import { initAudio } from './audio-controller.js'
import { preloadInitialScenes, preloadNearbyScenes } from './image-preloader.js'
import { initTranslate } from './translate-controller.js'

const SCREEN_STORAGE_KEY = 'kenara-screen-index'
const AUDIO_NOTIFICATION_KEY = 'kenara-audio-notification-shown'
const AUDIO_NOTIFICATION_AUTO_HIDE_MS = 10000

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

// Render semua layar.
const container = document.getElementById('story-container')
const totalScreens = renderScreens(container)
const SESSION_ENTRY_KEY = 'kenara-session-entered'
const isFirstSessionEntry = sessionStorage.getItem(SESSION_ENTRY_KEY) !== 'true'
const savedScreenIndex = getSavedScreenIndex(totalScreens)
const initialScreenIndex = isFirstSessionEntry ? 0 : savedScreenIndex
applyInitialScreenState(initialScreenIndex)
saveScreenIndex(initialScreenIndex)
if (isFirstSessionEntry) {
  sessionStorage.setItem(SESSION_ENTRY_KEY, 'true')
}

// Buat tombol chapter.
const nav = document.getElementById('chapter-nav')
for (let i = 1; i <= 7; i++) {
  const dot = document.createElement('button')
  dot.className = `dot ${i === 1 ? 'active' : ''}`
  dot.dataset.chapter = i
  dot.setAttribute('aria-label', `Chapter ${i}`)
  nav.appendChild(dot)
}

// Nyalakan kontrol pindah layar.
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
}, initialScreenIndex)

// Tombol chapter.
document.querySelectorAll('#chapter-nav .dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const targetChapter = parseInt(dot.dataset.chapter)
    const targetIndex = getFirstScreenIndexForChapter(targetChapter)
    if (targetIndex >= 0 && typeof window.scrollToScreen === 'function') {
      window.scrollToScreen(targetIndex)
    }
  })
})

// Nyalakan audio dan translate.
initAudio()
initTranslate()

// Tampilkan info audio di kunjungan awal.
const THREE_HOURS = 3 * 60 * 60 * 1000
const now = Date.now()
const lastNotificationTime = localStorage.getItem(AUDIO_NOTIFICATION_KEY)

const shouldShowNotification = !lastNotificationTime || (now - parseInt(lastNotificationTime)) >= THREE_HOURS

if (shouldShowNotification) {
  setTimeout(() => {
    const notification = document.getElementById('audio-notification')
    if (notification) {
      notification.classList.add('show')
      localStorage.setItem(AUDIO_NOTIFICATION_KEY, String(now))
      setTimeout(() => {
        notification.classList.remove('show')
      }, AUDIO_NOTIFICATION_AUTO_HIDE_MS)
    }
  }, 800)
  
  document.getElementById('audio-notification-close')?.addEventListener('click', () => {
    const notification = document.getElementById('audio-notification')
    if (notification) {
      notification.classList.remove('show')
    }
  })
}

// Muat gambar awal lebih dulu.
preloadInitialScenes(4)
preloadNearbyScenes(initialScreenIndex, 2)

// Cegah zoom tak sengaja.
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

// Batasi inspect umum.
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase()
  const blockedInspectShortcut =
    key === 'f12' ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
    ((e.ctrlKey || e.metaKey) && key === 'u')

  if (blockedInspectShortcut) {
    e.preventDefault()
    e.stopPropagation()
  }
})
