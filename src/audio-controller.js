let audioEl = null
let isMuted = true
let wantsPlayback = false
let userStopped = false
let playbackRetryId = null

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

function updateAudioUi(toggleBtn, icon) {
  toggleBtn.classList.toggle('muted', isMuted)
  icon.textContent = '♪'
}

function attemptPlayback(toggleBtn, icon) {
  if (!audioEl || !wantsPlayback || userStopped || isHeroActive()) {
    return
  }

  audioEl.muted = false

  audioEl.play()
    .then(() => {
      isMuted = false
      updateAudioUi(toggleBtn, icon)
      syncAudioState()
    })
    .catch(() => {
      isMuted = true
      audioEl.muted = true
      updateAudioUi(toggleBtn, icon)
      syncAudioState()
    })
}

function stopAudio(toggleBtn, icon, resetTime = true) {
  if (!audioEl) return

  clearPlaybackRetry()
  audioEl.pause()
  if (resetTime) {
    audioEl.currentTime = 0
  }
  isMuted = true
  audioEl.muted = true
  updateAudioUi(toggleBtn, icon)
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
      // Ignore until metadata is ready.
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
  const toggleBtn = document.getElementById('audio-toggle')
  const icon = document.getElementById('audio-icon')

  if (!audioEl || !toggleBtn || !icon) return

  const savedState = readAudioState()

  audioEl.volume = 1
  audioEl.muted = true

  wantsPlayback = Boolean(savedState.shouldResume)
  userStopped = Boolean(savedState.userStopped)
  isMuted = true

  restoreCurrentTime(savedState)
  updateAudioUi(toggleBtn, icon)

  if (isHeroActive()) {
    wantsPlayback = false
    userStopped = false
    stopAudio(toggleBtn, icon)
  } else if (wantsPlayback && !userStopped) {
    const tryResume = () => attemptPlayback(toggleBtn, icon)
    tryResume()
    audioEl.addEventListener('canplay', tryResume)
    window.addEventListener('pageshow', tryResume)
  } else {
    syncAudioState()
  }

  toggleBtn.addEventListener('click', () => {
    if (!isMuted && wantsPlayback) {
      wantsPlayback = false
      userStopped = true
      stopAudio(toggleBtn, icon)
      return
    }

    userStopped = false
    wantsPlayback = true
    attemptPlayback(toggleBtn, icon)
  })

  audioEl.addEventListener('timeupdate', syncAudioState)
  audioEl.addEventListener('pause', syncAudioState)
  audioEl.addEventListener('play', syncAudioState)
  window.addEventListener('beforeunload', syncAudioState)
  window.addEventListener('pagehide', syncAudioState)

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
      attemptPlayback(toggleBtn, icon)
    }

    tryStart()
  }

  window.playThemeAudio = () => {
    requestPlaybackFromUi()
  }

  window.stopThemeAudio = () => {
    wantsPlayback = false
    userStopped = true
    stopAudio(toggleBtn, icon)
  }
}

export function setAudioVolume(volume) {
  if (audioEl) {
    audioEl.volume = Math.max(0, Math.min(1, volume))
  }
}
