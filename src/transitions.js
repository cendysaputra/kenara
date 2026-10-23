import { gsap } from 'gsap'

let activeTimeline = null
let kenBurns = null

// Waktu efek utama (detik); total tetap di bawah jeda navigasi 1500ms.
const TURN_DURATION = 1.15
const REVEAL_AT = 0.55

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function transitionScenes(fromEl, toEl, onComplete) {
  const fromIndex = parseInt(fromEl.dataset.index)
  const toIndex = parseInt(toEl.dataset.index)
  const isForward = toIndex > fromIndex

  let effectName = 'pageTurn'

  if (prefersReducedMotion()) {
    effectName = 'softFade'
  } else if (isForward && fromIndex === 0) {
    effectName = 'closeToButton'
  } else if (!isForward && toIndex === 0) {
    effectName = 'openFromFavicon'
  }

  // Selesaikan transisi lama agar tween tidak bertabrakan.
  if (activeTimeline) activeTimeline.progress(1)
  stopKenBurns()

  const transitionEffect = transitions[effectName] || transitions['pageTurn']

  activeTimeline = transitionEffect(fromEl, toEl, () => {
    activeTimeline = null
    startKenBurns(toEl)
    if (onComplete) onComplete()
  }, isForward)
}

// Animasi masuk saat halaman pertama dibuka.
export function playIntro(el) {
  if (!el) return
  if (activeTimeline) activeTimeline.progress(1)

  const tl = gsap.timeline({
    onComplete: () => {
      activeTimeline = null
      startKenBurns(el)
    }
  })

  if (prefersReducedMotion()) {
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' })
  } else {
    tl.fromTo(el, { '--bg-scale': 1.06 }, { '--bg-scale': 1, duration: 1.6, ease: 'power3.out' }, 0)
    revealContent(tl, el, 0.2)
  }

  activeTimeline = tl
}

// Ken Burns: gerak pelan background selama scene aktif.
function startKenBurns(el) {
  stopKenBurns()
  if (!el.classList.contains('screen-scene') || !el.classList.contains('active')) return
  if (prefersReducedMotion()) return

  const drift = parseInt(el.dataset.index) % 2 ? 1 : -1
  // Mulai dari posisi diam agar tidak membaca nilai kosong.
  kenBurns = gsap.fromTo(el, { '--bg-scale': 1, '--bg-x': 0, '--bg-y': 0 }, {
    '--bg-scale': 1.06,
    '--bg-x': 1.5 * drift,
    '--bg-y': -1,
    duration: 20,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  })
}

function stopKenBurns() {
  if (kenBurns) kenBurns.kill()
  kenBurns = null
}

// Elemen isi tiap jenis layar, sesuai urutan muncul.
function getContentTargets(el) {
  let selectors = []

  if (el.classList.contains('screen-scene')) {
    selectors = ['.scene-body']
  } else if (el.classList.contains('screen-chapter-card')) {
    selectors = ['.chapter-card-label', '.chapter-card-title-text', '.chapter-card-rule']
  } else if (el.classList.contains('screen-hero')) {
    selectors = ['.hero-subtitle', '.hero-title', '.hero-start-btn']
  } else if (el.classList.contains('screen-ending')) {
    selectors = ['.ending-favicon', '.ending-text', '.ending-credit', '.ending-copyright']
  }

  // Lewati elemen yang hilang (mis. diubah Google Translate).
  return selectors.map(sel => el.querySelector(sel)).filter(Boolean)
}

// Kembalikan isi ke gaya CSS asli.
function resetContent(el) {
  const targets = getContentTargets(el)
  if (!targets.length) return
  gsap.killTweensOf(targets)
  gsap.set(targets, { clearProps: 'opacity,transform,filter,letterSpacing' })
  targets.forEach(t => t.classList.remove('is-revealing'))
}

function hideContent(tl, el, at) {
  const targets = getContentTargets(el)
  if (!targets.length) return
  tl.to(targets, { opacity: 0, y: -10, duration: 0.35, ease: 'power1.in', stagger: 0.03 }, at)
}

function revealContent(tl, el, at) {
  const q = sel => el.querySelector(sel)
  let end = at

  if (el.classList.contains('screen-scene')) {
    // Teks muncul baris demi baris lewat mask lembut, naik dan menajam.
    const body = q('.scene-body')
    if (body) {
      body.classList.add('is-revealing')
      tl.fromTo(body,
        { opacity: 0, y: 14, filter: 'blur(6px)', '--reveal': 0 },
        { opacity: 1, y: 0, filter: 'blur(0px)', '--reveal': 1, duration: 0.85, ease: 'power2.out' },
        at
      )
      end = at + 0.85
    }
  } else if (el.classList.contains('screen-chapter-card')) {
    const label = q('.chapter-card-label')
    const title = q('.chapter-card-title-text')
    const rule = q('.chapter-card-rule')

    if (label) {
      tl.fromTo(label,
        { opacity: 0, y: 8, letterSpacing: '0.45em' },
        { opacity: 1, y: 0, letterSpacing: '0.15em', duration: 0.9, ease: 'power3.out' },
        at
      )
    }
    if (title) {
      // Judul naik dari balik garis bawah (mask di h2).
      tl.fromTo(title,
        { opacity: 0, yPercent: 105 },
        { opacity: 1, yPercent: 0, duration: 0.85, ease: 'expo.out' },
        at + 0.12
      )
    }
    if (rule) {
      tl.fromTo(rule,
        { opacity: 0, scaleX: 0 },
        { opacity: 1, scaleX: 1, duration: 0.7, ease: 'power2.inOut' },
        at + 0.3
      )
    }
    end = at + 1
  } else if (el.classList.contains('screen-hero')) {
    const items = [q('.hero-subtitle'), q('.hero-title')].filter(Boolean)
    const button = q('.hero-start-btn')

    if (items.length) {
      tl.fromTo(items,
        { opacity: 0, y: 22, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', stagger: 0.14 },
        at
      )
    }
    if (button) {
      tl.fromTo(button,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        at + 0.35
      )
    }
    end = at + 1.05
  } else if (el.classList.contains('screen-ending')) {
    const targets = getContentTargets(el)
    if (targets.length) {
      tl.fromTo(targets,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 },
        at
      )
      end = at + 0.8 + (targets.length - 1) * 0.1
    }
  }

  // Bersihkan gaya inline setelah selesai.
  tl.add(() => resetContent(el), end)
}

// Rapikan layar lama setelah transisi.
function finishLeave(from) {
  from.classList.remove('active', 'is-leaving')
  gsap.set(from, { opacity: 0, zIndex: '', '--bg-scale': 1, '--bg-x': 0, '--bg-y': 0, '--shade': 0 })
  resetContent(from)
}

const transitions = {
  // Pergantian halaman: wipe lembut searah baca, bg baru menetap, bg lama menjauh dan meredup.
  pageTurn(from, to, done, isForward) {
    const dir = isForward ? 1 : -1
    const tl = gsap.timeline({ onComplete: done })

    to.classList.add('active', 'is-turning')
    to.dataset.turn = isForward ? 'forward' : 'backward'
    from.classList.add('is-leaving')

    tl.set(to, { opacity: 1, zIndex: 3, '--wipe': 0 }, 0)
    tl.set(from, { opacity: 1, zIndex: 2 }, 0)

    tl.to(to, { '--wipe': 130, duration: TURN_DURATION, ease: 'power2.inOut' }, 0)
    tl.fromTo(to,
      { '--bg-scale': 1.08, '--bg-x': 2.5 * dir, '--bg-y': 0 },
      { '--bg-scale': 1, '--bg-x': 0, duration: 1.4, ease: 'power3.out' },
      0
    )
    tl.to(from, {
      '--bg-scale': 1.1,
      '--bg-x': -2 * dir,
      '--shade': 0.35,
      duration: TURN_DURATION,
      ease: 'power2.in'
    }, 0)

    hideContent(tl, from, 0)
    revealContent(tl, to, REVEAL_AT)

    tl.add(() => {
      finishLeave(from)
      to.classList.remove('is-turning')
      delete to.dataset.turn
      gsap.set(to, { zIndex: '' })
    }, TURN_DURATION)

    return tl
  },

  // Versi reduced motion: fade singkat tanpa gerak.
  softFade(from, to, done) {
    const tl = gsap.timeline({ onComplete: done })
    resetContent(to)
    to.classList.add('active')

    tl.set(to, { opacity: 0, zIndex: 3 }, 0)
    tl.to(from, { opacity: 0, duration: 0.4, ease: 'none' }, 0)
    tl.to(to, { opacity: 1, duration: 0.4, ease: 'none' }, 0.1)
    tl.add(() => {
      finishLeave(from)
      gsap.set(to, { zIndex: '' })
    })
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

    revealContent(tl, to, 0.45)

    tl.set(from, { opacity: 0, clipPath: 'none', zIndex: '' }, 1.1)
    tl.add(() => {
      from.classList.remove('active')
      resetContent(from)
    }, 1.1)
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

    revealContent(tl, to, 0.35)

    tl.set(to, { clipPath: 'none', zIndex: '' }, 1.1)
    tl.add(() => finishLeave(from), 1.1)
    return tl
  }
}
