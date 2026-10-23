import { gsap } from 'gsap'

let activeTimeline = null

export function transitionScenes(fromEl, toEl, onComplete) {
  const fromIndex = parseInt(fromEl.dataset.index)
  const toIndex = parseInt(toEl.dataset.index)
  const isForward = toIndex > fromIndex

  let effectName = 'crossfade'

  if (isForward && fromIndex === 0) {
    effectName = 'closeToButton'
  } else if (!isForward && toIndex === 0) {
    effectName = 'openFromFavicon'
  }

  // Selesaikan transisi lama agar tween tidak bertabrakan.
  if (activeTimeline) activeTimeline.progress(1)

  const transitionEffect = transitions[effectName] || transitions['crossfade']

  activeTimeline = transitionEffect(fromEl, toEl, () => {
    activeTimeline = null
    if (onComplete) onComplete()
  })
}

const transitions = {
  // Fade biasa.
  crossfade(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0, scale: 1, x: 0, y: 0 })
    tl.to(from, { opacity: 0, duration: 1.5, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, '-=1.0')
    tl.set(from, { opacity: 0 })
    to.classList.add('active')
    from.classList.remove('active')
    return tl
  },

  // Tutup ke tombol start.
  closeToButton(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })

    let cx = '15%'
    let cy = '60%'
    const btnIcon = from.querySelector('.btn-icon')
    
    if (btnIcon) {
      const rect = btnIcon.getBoundingClientRect()
      if (rect.width > 0) {
        cx = `${Math.round(rect.left + rect.width / 2)}px`
        cy = `${Math.round(rect.top + rect.height / 2)}px`
      }
    }
    
    to.classList.add('active')
    
    tl.set(to, { opacity: 0 }, 0)
    tl.set(from, { clipPath: `circle(150% at ${cx} ${cy})`, zIndex: 10, opacity: 1 }, 0)

    tl.to(to, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0)
    tl.to(from, { 
      clipPath: `circle(0% at ${cx} ${cy})`, 
      duration: 1.1, 
      ease: 'power2.inOut' 
    }, 0)
    
    tl.set(from, { opacity: 0, clipPath: 'none', zIndex: '' })
    tl.call(() => {
      from.classList.remove('active')
    })
    return tl
  },

  // Buka dari tombol akhir.
  openFromFavicon(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })

    let cx = '50%'
    let cy = '40%'
    const btnIcon = from.querySelector('.ending-favicon')
    
    if (btnIcon) {
      const rect = btnIcon.getBoundingClientRect()
      if (rect.width > 0) {
        cx = `${Math.round(rect.left + rect.width / 2)}px`
        cy = `${Math.round(rect.top + rect.height / 2)}px`
      }
    }
    
    to.classList.add('active')
    
    tl.set(from, { opacity: 1 }, 0)
    tl.set(to, { opacity: 1, clipPath: `circle(0% at ${cx} ${cy})`, zIndex: 10 }, 0)

    tl.to(to, { 
      clipPath: `circle(150% at ${cx} ${cy})`, 
      duration: 1.1, 
      ease: 'power2.inOut' 
    }, 0)
    
    tl.set(to, { clipPath: 'none', zIndex: '' })
    tl.set(from, { opacity: 0 })
    tl.call(() => {
      from.classList.remove('active')
    })
    return tl
  }
}
