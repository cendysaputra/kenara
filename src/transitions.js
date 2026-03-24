import { gsap } from 'gsap'

export function transitionScenes(fromEl, toEl, onComplete) {
  const fromIndex = parseInt(fromEl.dataset.index)
  const toIndex = parseInt(toEl.dataset.index)
  const isForward = toIndex > fromIndex

  // Determine transition type
  let effectName = 'crossfade'

  if (isForward && fromIndex === 0) {
    effectName = 'closeToButton'
  }

  const transitionEffect = transitions[effectName] || transitions['crossfade']

  transitionEffect(fromEl, toEl, () => {
    if (onComplete) onComplete()
  })
}

// Helper: create color overlay
function createOverlay(color) {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
    background: ${color}; z-index: 40; opacity: 0; pointer-events: none;
  `
  document.body.appendChild(overlay)
  return overlay
}

const transitions = {
  // Simple crossfade (1.5s)
  crossfade(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0, scale: 1, x: 0, y: 0 })
    tl.to(from, { opacity: 0, duration: 1.5, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, '-=1.0')
    tl.set(from, { opacity: 0 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Close everything to the button (circle transition for Start Story)
  closeToButton(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    
    // Calculate center of the Start Story button's arrow icon
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
    
    // Set initial states immediately at timeline position 0
    tl.set(to, { opacity: 0 }, 0)
    tl.set(from, { clipPath: `circle(150% at ${cx} ${cy})`, zIndex: 10, opacity: 1 }, 0)
    
    // Start animations at position 0 so there's absolutely no delay
    tl.to(to, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0)
    tl.to(from, { 
      clipPath: `circle(0% at ${cx} ${cy})`, 
      duration: 1.1, 
      ease: 'power2.inOut' 
    }, 0)
    
    // Cleanup
    tl.set(from, { opacity: 0, clipPath: 'none', zIndex: '' })
    tl.call(() => {
      from.classList.remove('active')
    })
  }
}
