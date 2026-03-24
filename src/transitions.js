import { gsap } from 'gsap'

export function transitionScenes(fromEl, toEl, onComplete) {
  const fromIndex = parseInt(fromEl.dataset.index)
  const toIndex = parseInt(toEl.dataset.index)
  const isForward = toIndex > fromIndex

  // Determine transition type based on story progression
  let effectName = 'crossfade'

  /* 
  if (isForward) {
    switch (toIndex) {
      case 5: effectName = 'slowFadeDark'; break;       // 1.3 -> 1.4
      case 8: effectName = 'slideRight'; break;         // 2.1 -> 2.2
      case 9: effectName = 'crossfadeZoomOut'; break;   // 2.2 -> 2.3
      case 10: effectName = 'fadeToDark'; break;        // 2.3 -> Ch 3 Card
      case 12: effectName = 'fadeToDark'; break;        // 3.1 -> 3.2
      case 13: effectName = 'flashReveal'; break;       // 3.2 -> 3.3
      case 14: effectName = 'dissolveDown'; break;      // 3.3 -> 3.4
      case 21: effectName = 'fadeScale'; break;         // 5.1 -> 5.2
      case 22: effectName = 'quickReveal'; break;       // 5.2 -> 5.3
      case 23: effectName = 'slowWarmFade'; break;      // 5.3 -> 5.4
      case 26: effectName = 'slideLeft'; break;         // 6.1 -> 6.2
      case 28: effectName = 'fadeDarkGolden'; break;    // 6.3 -> 6.4
      case 31: effectName = 'crossfadeGolden'; break;   // 7.1 -> 7.2
      case 32: effectName = 'goldenBurst'; break;       // 7.2 -> 7.3
      case 33: effectName = 'slowWarmDissolve'; break;  // 7.3 -> 7.4
    }
  }
  */

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

  // Slow fade with dark tint (2.0s)
  slowFadeDark(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0 })
    tl.to(from, { opacity: 0, duration: 2.0, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 2.0, ease: 'power2.inOut' }, '-=1.2')
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Slide from right
  slideRight(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 1, x: '100%' })
    to.classList.add('active')
    tl.to(from, { x: '-30%', opacity: 0, duration: 1.5, ease: 'power3.inOut' })
    tl.to(to, { x: '0%', duration: 1.5, ease: 'power3.inOut' }, '-=1.2')
    tl.set(from, { x: '0%', opacity: 0 })
    from.classList.remove('active')
  },

  // Slide from left
  slideLeft(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 1, x: '-100%' })
    to.classList.add('active')
    tl.to(from, { x: '30%', opacity: 0, duration: 1.5, ease: 'power3.inOut' })
    tl.to(to, { x: '0%', duration: 1.5, ease: 'power3.inOut' }, '-=1.2')
    tl.set(from, { x: '0%', opacity: 0 })
    from.classList.remove('active')
  },

  // Crossfade with slight zoom out
  crossfadeZoomOut(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0, scale: 1 })
    tl.to(from, { opacity: 0, scale: 0.95, duration: 1.5, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, '-=1.0')
    tl.set(from, { scale: 1, opacity: 0 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Fade to dark then reveal
  fadeToDark(from, to, done) {
    const overlay = createOverlay('#2C2420')
    const tl = gsap.timeline({ onComplete: () => { overlay.remove(); done() } })
    tl.to(overlay, { opacity: 1, duration: 0.8 })
    tl.set(from, { opacity: 0 })
    tl.set(to, { opacity: 1 })
    tl.to(overlay, { opacity: 0, duration: 1.2, delay: 0.2 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Flash white then reveal (curse moment)
  flashReveal(from, to, done) {
    const overlay = createOverlay('#E8D5A3')
    const tl = gsap.timeline({ onComplete: () => { overlay.remove(); done() } })
    tl.to(overlay, { opacity: 1, duration: 0.3 })
    tl.set(from, { opacity: 0 })
    tl.set(to, { opacity: 1 })
    tl.to(overlay, { opacity: 0, duration: 1.5, ease: 'power2.out' })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Dissolve downward (sinking)
  dissolveDown(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0, y: '0%' })
    tl.to(from, { opacity: 0, y: '5%', duration: 1.8, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 1.8, ease: 'power2.inOut' }, '-=1.2')
    tl.set(from, { y: '0%', opacity: 0 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Fade with slight scale (zoom in)
  fadeScale(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0, scale: 1.05 })
    tl.to(from, { opacity: 0, duration: 1.2, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out' }, '-=0.8')
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Quick reveal (make it slightly slower but still fast)
  quickReveal(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0 })
    tl.to(from, { opacity: 0, duration: 0.6, ease: 'power3.inOut' })
    tl.to(to, { opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.3')
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Slow warm fade (emotional)
  slowWarmFade(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0 })
    tl.to(from, { opacity: 0, duration: 2.0, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 2.0, ease: 'power2.inOut' }, '-=1.4')
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Fade dark then golden reveal
  fadeDarkGolden(from, to, done) {
    const overlay = createOverlay('#2C2420')
    const tl = gsap.timeline({ onComplete: () => { overlay.remove(); done() } })
    tl.to(overlay, { opacity: 1, duration: 1.0 })
    tl.set(from, { opacity: 0 })
    tl.set(to, { opacity: 1 })
    tl.to(overlay, { opacity: 0, duration: 1.5, ease: 'power2.out', delay: 0.3 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Crossfade with golden tint
  crossfadeGolden(from, to, done) {
    const overlay = createOverlay('#C8A24E')
    overlay.style.opacity = '0'
    const tl = gsap.timeline({ onComplete: () => { overlay.remove(); done() } })
    tl.to(overlay, { opacity: 0.15, duration: 0.8 })
    tl.to(from, { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, '-=0.4')
    tl.to(to, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, '-=1.0')
    tl.to(overlay, { opacity: 0, duration: 1.0 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Golden burst (climax)
  goldenBurst(from, to, done) {
    const overlay = createOverlay('#E8D5A3')
    const tl = gsap.timeline({ onComplete: () => { overlay.remove(); done() } })
    tl.to(overlay, { opacity: 1, duration: 0.4 })
    tl.set(from, { opacity: 0 })
    tl.set(to, { opacity: 1 })
    tl.to(overlay, { opacity: 0, duration: 2.0, ease: 'power2.out', delay: 0.4 })
    to.classList.add('active')
    from.classList.remove('active')
  },

  // Slow warm dissolve (happy ending)
  slowWarmDissolve(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    tl.set(to, { opacity: 0 })
    tl.to(from, { opacity: 0, duration: 2.5, ease: 'power2.inOut' })
    tl.to(to, { opacity: 1, duration: 2.5, ease: 'power2.inOut' }, '-=1.5')
    to.classList.add('active')
    from.classList.remove('active')
  }
}
