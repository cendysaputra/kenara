let audioEl = null
let isMuted = true

export function initAudio() {
  audioEl = document.getElementById('bg-audio')
  const toggleBtn = document.getElementById('audio-toggle')
  const icon = document.getElementById('audio-icon')

  if (!audioEl || !toggleBtn) return

  // Start muted
  audioEl.volume = 1
  audioEl.muted = true
  toggleBtn.classList.add('muted')

  toggleBtn.addEventListener('click', () => {
    isMuted = !isMuted
    audioEl.muted = isMuted

    if (!isMuted) {
      audioEl.play().catch(() => {
        // Autoplay blocked, revert
        isMuted = true
        audioEl.muted = true
      })
      toggleBtn.classList.remove('muted')
      icon.textContent = '♪'
    } else {
      toggleBtn.classList.add('muted')
      icon.textContent = '♪'
    }
  })

  // Expose play function to global for inline onclick
  window.playThemeAudio = () => {
    if (audioEl && isMuted) {
      isMuted = false
      audioEl.muted = false
      audioEl.play().catch(() => {})
      toggleBtn.classList.remove('muted')
      icon.textContent = '♪'
    }
  }
}

export function setAudioVolume(volume) {
  if (audioEl) {
    audioEl.volume = Math.max(0, Math.min(1, volume))
  }
}
