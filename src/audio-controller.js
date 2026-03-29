let audioEl = null
let isMuted = true
let wantsPlayback = false
let userStopped = false
let playbackRetryId = null
let playbackRequestId = 0
let audioButtons = []

const AUDIO_STATE_KEY = 'kenara-audio-state'

function readAudioState() {
  try {
    return JSON.parse(localStorage.getItem(AUDIO_STATE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAudioState(state) {
  localStorage.setItem(AUDIO_STATE_KEY, JSON.stringify(state))
}

function isHeroActive() {
  return document.body.classList.contains('hero-active')
}

function syncAudioState() {
  if (!audioEl) return

  writeAudioState({
    muted: isMuted,
    shouldResume: wantsPlayback,
    userStopped,
    currentTime: audioEl.currentTime || 0
  })
}

function clearPlaybackRetry() {
  if (playbackRetryId !== null) {
    window.clearTimeout(playbackRetryId)
    playbackRetryId = null
  }
}

function pauseForHiddenPage() {
  if (!audioEl) return

  playbackRequestId += 1
  clearPlaybackRetry()
  audioEl.pause()
  audioEl.muted = true
  isMuted = true
  updateAudioUi()
  syncAudioState()
}

function getButtonIcon(button) {
  return button.querySelector('[data-audio-icon]')
}

function updateAudioUi() {
  audioButtons.forEach((button) => {
    button.classList.toggle('muted', isMuted)

    const icon = getButtonIcon(button)
    if (icon) {
      icon.textContent = '\u266A'
    }
  })
}

function attemptPlayback(forceOnHero = false) {
  if (!audioEl || !wantsPlayback || userStopped || (!forceOnHero && isHeroActive())) {
    return
  }

  const requestId = ++playbackRequestId
  audioEl.muted = false

  audioEl.play()
    .then(() => {
      if (requestId !== playbackRequestId || !wantsPlayback || userStopped) {
        audioEl.pause()
        audioEl.muted = true
        return
      }

      isMuted = false
      updateAudioUi()
      syncAudioState()
    })
    .catch(() => {
      isMuted = true
      audioEl.muted = true
      updateAudioUi()
      syncAudioState()
    })
}

function stopAudio(resetTime = true) {
  if (!audioEl) return

  playbackRequestId += 1
  clearPlaybackRetry()
  audioEl.pause()
  if (resetTime) {
    audioEl.currentTime = 0
  }
  isMuted = true
  audioEl.muted = true
  updateAudioUi()
  syncAudioState()
}

function restoreCurrentTime(savedState) {
  if (typeof savedState.currentTime !== 'number' || !Number.isFinite(savedState.currentTime)) {
    return
  }

  const applyTime = () => {
    try {
      audioEl.currentTime = savedState.currentTime
    } catch {
      // Tunggu metadata siap.
    }
  }

  if (audioEl.readyState >= 1) {
    applyTime()
    return
  }

  audioEl.addEventListener('loadedmetadata', applyTime, { once: true })
}

export function initAudio() {
  audioEl = document.getElementById('bg-audio')
  audioButtons = Array.from(document.querySelectorAll('[data-audio-toggle]'))

  if (!audioEl || audioButtons.length === 0) return

  const savedState = readAudioState()

  audioEl.volume = 1
  audioEl.muted = true

  wantsPlayback = Boolean(savedState.shouldResume)
  userStopped = Boolean(savedState.userStopped)
  isMuted = true

  restoreCurrentTime(savedState)
  updateAudioUi()

  if (isHeroActive()) {
    wantsPlayback = false
    userStopped = false
    stopAudio()
  } else if (wantsPlayback && !userStopped) {
    const tryResume = () => attemptPlayback()
    tryResume()
    audioEl.addEventListener('canplay', tryResume)
    window.addEventListener('pageshow', tryResume)
  } else {
    syncAudioState()
  }

  audioButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (wantsPlayback && !userStopped) {
        wantsPlayback = false
        userStopped = true
        stopAudio()
        return
      }

      userStopped = false
      wantsPlayback = true
      attemptPlayback(true)
    })
  })

  audioEl.addEventListener('timeupdate', syncAudioState)
  audioEl.addEventListener('pause', syncAudioState)
  audioEl.addEventListener('play', syncAudioState)
  window.addEventListener('beforeunload', () => pauseForHiddenPage())
  window.addEventListener('pagehide', () => pauseForHiddenPage())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseForHiddenPage()
      return
    }

    if (document.visibilityState === 'visible' && wantsPlayback && !userStopped && !isHeroActive()) {
      attemptPlayback()
    }
  })

  function requestPlaybackFromUi() {
    userStopped = false
    wantsPlayback = true
    clearPlaybackRetry()

    const tryStart = () => {
      if (!wantsPlayback || userStopped) return

      if (isHeroActive()) {
        playbackRetryId = window.setTimeout(tryStart, 120)
        return
      }

      playbackRetryId = null
      attemptPlayback()
    }

    tryStart()
  }

  window.playThemeAudio = () => {
    requestPlaybackFromUi()
  }

  window.stopThemeAudio = () => {
    wantsPlayback = false
    userStopped = true
    stopAudio()
  }
}

export function setAudioVolume(volume) {
  if (audioEl) {
    audioEl.volume = Math.max(0, Math.min(1, volume))
  }
}
