import { gsap } from 'gsap'

let activeTimeline = null
let kenBurns = null

// Waktu efek utama (detik); total tetap di bawah jeda navigasi 1500ms.
const TURN_DURATION = 1.15
const REVEAL_AT = 0.55

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isNarrow = () => window.innerWidth < 768

export function transitionScenes(fromEl, toEl, onComplete) {
  const fromIndex = parseInt(fromEl.dataset.index)
  const toIndex = parseInt(toEl.dataset.index)
  const isForward = toIndex > fromIndex

  // Selesaikan transisi lama agar tween tidak bertabrakan.
  if (activeTimeline) activeTimeline.progress(1)
  stopKenBurns()

  let effectName

  if (prefersReducedMotion()) {
    effectName = 'softFade'
  } else if (isForward && fromIndex === 0) {
    effectName = 'closeToButton'
  } else if (!isForward && toIndex === 0) {
    effectName = 'openFromFavicon'
  } else {
    // Maju pakai gaya layar tujuan; mundur memutar balik gaya layar asal.
    const owner = isForward ? toEl : fromEl
    effectName = owner.dataset.transition
  }

  const transitionEffect = transitions[effectName] || transitions.pageTurn

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
  gsap.set(targets, { clearProps: 'opacity,transform,filter,letterSpacing,clipPath,transformOrigin' })
  targets.forEach(t => {
    t.classList.remove(...TEXT_MASK_CLASSES)
    t.style.removeProperty('--reveal')
    t.style.removeProperty('--reveal-from')
  })
}

function hideContent(tl, el, at) {
  const targets = getContentTargets(el)
  if (!targets.length) return
  tl.to(targets, { opacity: 0, y: -10, duration: 0.35, ease: 'power1.in', stagger: 0.03 }, at)
}

// Kelas mask teks yang dipasang sementara saat teks muncul.
const TEXT_MASK_CLASSES = ['is-revealing', 'is-bleeding']

// Sisi teks (kiri/kanan/tengah) untuk arah gerak teks.
function textSide(body) {
  const align = getComputedStyle(body).textAlign
  if (align === 'right' || align === 'end') return 1
  if (align === 'center') return 0
  return -1
}

// Varian munculnya teks scene; animasi di wadah/mask, tanpa memecah kata.
function revealSceneText(tl, body, at, variant, dir) {
  const side = textSide(body)

  if (variant === 'bleed') {
    // Tinta: teks merembes dari sudut awal baris.
    body.classList.add('is-bleeding')
    body.style.setProperty('--reveal-from', side > 0 ? '100% 0%' : side === 0 ? '50% 0%' : '0% 0%')
    tl.fromTo(body,
      { opacity: 0, y: 6, '--reveal': 0 },
      { opacity: 1, y: 0, '--reveal': 1, duration: 0.9, ease: 'power2.out' },
      at
    )
    return at + 0.9
  }

  if (variant === 'focus') {
    // Iris: teks menajam dari sedikit kabur, seperti lensa mencari fokus.
    tl.fromTo(body,
      { opacity: 0, scale: 0.97, filter: 'blur(5px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
      at
    )
    return at + 0.8
  }

  // Bawaan: baris demi baris lewat mask lembut, naik dan menajam.
  body.classList.add('is-revealing')
  tl.fromTo(body,
    { opacity: 0, y: 14, filter: 'blur(6px)', '--reveal': 0 },
    { opacity: 1, y: 0, filter: 'blur(0px)', '--reveal': 1, duration: 0.85, ease: 'power2.out' },
    at
  )
  return at + 0.85
}

function revealContent(tl, el, at, variant = 'lines', dir = 1) {
  const q = sel => el.querySelector(sel)
  let end = at

  if (el.classList.contains('screen-scene')) {
    const body = q('.scene-body')
    if (body) end = revealSceneText(tl, body, at, variant, dir)
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

// Hapus semua sisa efek (mask, transform, z-index, variabel) dari layar.
const FX_VARS = ['--p', '--feather', '--wipe']
const MASK_PROPS = ['mask-image', 'mask-size', 'mask-position', 'mask-repeat']

function clearFx(el) {
  el.classList.remove('is-turning', 'is-leaving')
  delete el.dataset.turn
  MASK_PROPS.forEach(prop => {
    el.style.removeProperty(prop)
    el.style.removeProperty(`-webkit-${prop}`)
  })
  FX_VARS.forEach(v => el.style.removeProperty(v))
  gsap.set(el, { clearProps: 'zIndex,transform' })
}

// Pasang mask inline (dengan awalan -webkit- untuk Safari).
function setMask(el, { image, size, position, repeat = 'no-repeat' }) {
  const values = { 'mask-image': image, 'mask-size': size, 'mask-position': position, 'mask-repeat': repeat }
  Object.entries(values).forEach(([prop, value]) => {
    if (!value) return
    el.style.setProperty(prop, value)
    el.style.setProperty(`-webkit-${prop}`, value)
  })
}

// Rapikan layar lama setelah transisi.
function finishLeave(from) {
  clearFx(from)
  from.classList.remove('active')
  gsap.set(from, { opacity: 0, '--bg-scale': 1, '--bg-x': 0, '--bg-y': 0, '--shade': 0 })
  resetContent(from)
}

// Rapikan layar baru setelah transisi.
function finishEnter(to) {
  clearFx(to)
  gsap.set(to, { opacity: 1, '--bg-scale': 1, '--bg-x': 0, '--bg-y': 0, '--shade': 0 })
}

// Angka acak tetap per layar agar bentuk efek selalu sama.
function seeded(seed) {
  let t = seed * 2654435761 >>> 0
  return () => {
    t = t + 0x6d2b79f5 >>> 0
    let r = Math.imul(t ^ t >>> 15, 1 | t)
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r
    return ((r ^ r >>> 14) >>> 0) / 4294967296
  }
}

// Jarak titik ke sudut layar terjauh (px).
function farthestCorner(x, y) {
  const w = window.innerWidth
  const h = window.innerHeight
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}

// Titik dekat teks scene (asal rembesan tinta).
function textPoint(el) {
  const box = el.querySelector('.scene-text')
  const rect = box?.getBoundingClientRect()
  if (!rect || !rect.width) return { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }
  return { x: rect.left + rect.width * 0.35, y: rect.top + Math.min(rect.height * 0.5, 120) }
}

// Titik fokus gambar: data-focus, atau sisi berlawanan dari teks.
function focusPoint(el) {
  const w = window.innerWidth
  const h = window.innerHeight
  const pct = (value, size) => parseFloat(value) / 100 * size

  if (el.dataset.focus) {
    const [fx, fy] = el.dataset.focus.split(' ')
    return { x: pct(fx, w), y: pct(fy, h) }
  }
  if (!el.classList.contains('screen-scene')) return { x: w / 2, y: h * 0.46 }
  if (isNarrow()) return { x: w / 2, y: h * 0.62 }

  const text = textPoint(el)
  const x = text.x < w * 0.4 ? w * 0.66 : text.x > w * 0.6 ? w * 0.34 : w / 2
  return { x, y: h * 0.56 }
}

// Kerangka efek mask: lapisan atas dibuka lewat --p (0 → 1).
// closing: mundur, layar asal menutup kembali ke titiknya (kebalikan persis).
function maskTransition(from, to, done, isForward, { mask, closing = false, duration = TURN_DURATION, ease = 'power2.inOut', text, textAt = REVEAL_AT }) {
  const dir = isForward ? 1 : -1
  const top = closing ? from : to
  const bottom = closing ? to : from
  const tl = gsap.timeline({ onComplete: done })

  to.classList.add('active')
  from.classList.add('is-leaving')
  // Keadaan awal dipasang langsung agar frame pertama tidak berkedip.
  gsap.set(top, { opacity: 1, zIndex: 3, '--p': closing ? 1 : 0 })
  gsap.set(bottom, { opacity: 1, zIndex: 2 })
  setMask(top, mask(top))
  tl.to(top, { '--p': closing ? 0 : 1, duration, ease }, 0)

  // Bg baru menetap pelan, bg lama menjauh dan meredup.
  tl.fromTo(to,
    { '--bg-scale': 1.07, '--bg-x': 0, '--bg-y': 0 },
    { '--bg-scale': 1, duration: duration + 0.25, ease: 'power3.out' },
    0
  )
  tl.to(from, { '--bg-scale': 1.06, '--shade': 0.3, duration, ease: 'power2.in' }, 0)

  hideContent(tl, from, 0)
  revealContent(tl, to, textAt, text, dir)

  tl.add(() => {
    finishLeave(from)
    finishEnter(to)
  }, duration)

  return tl
}

const transitions = {
  // Pergantian halaman: wipe lembut searah baca, bg baru menetap, bg lama menjauh dan meredup.
  pageTurn(from, to, done, isForward) {
    const dir = isForward ? 1 : -1
    const tl = gsap.timeline({ onComplete: done })

    to.classList.add('active', 'is-turning')
    to.dataset.turn = isForward ? 'forward' : 'backward'
    from.classList.add('is-leaving')

    gsap.set(to, { opacity: 1, zIndex: 3, '--wipe': 0 })
    gsap.set(from, { opacity: 1, zIndex: 2 })

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
      clearFx(to)
    }, TURN_DURATION)

    return tl
  },

  // Rembesan cat air: beberapa noda bulat tumbuh dari dekat teks dan menyatu.
  // Mundur: noda menyusut kembali ke titik asalnya.
  ink(from, to, done, isForward) {
    return maskTransition(from, to, done, isForward, {
      closing: !isForward,
      duration: 1.2,
      ease: 'sine.inOut',
      text: 'bleed',
      mask(el) {
        const { x, y } = textPoint(el)
        const rand = seeded(parseInt(el.dataset.index) + 1)
        const vmax = Math.max(window.innerWidth, window.innerHeight)
        const feather = vmax * 0.12
        const radius = farthestCorner(x, y) + feather + 2
        const blob = (bx, by, r) => `radial-gradient(circle at ${Math.round(bx)}px ${Math.round(by)}px, #000 calc(var(--p) * ${Math.round(r)}px - ${Math.round(feather)}px), transparent calc(var(--p) * ${Math.round(r)}px))`

        // Noda utama di titik asal, noda kecil acak di sekitarnya.
        const blobs = [blob(x, y, radius)]
        for (let i = 0; i < 4; i++) {
          const angle = rand() * Math.PI * 2
          const dist = vmax * (0.1 + rand() * 0.14)
          blobs.push(blob(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, radius * (0.62 + rand() * 0.22)))
        }
        return { image: blobs.join(', '), size: '100% 100%' }
      }
    })
  },

  // Iris: lingkaran lembut terbuka dari titik fokus gambar.
  // Mundur: lingkaran menutup kembali ke titik itu.
  iris(from, to, done, isForward) {
    return maskTransition(from, to, done, isForward, {
      closing: !isForward,
      duration: 1.15,
      ease: 'power3.inOut',
      text: 'focus',
      mask(el) {
        const { x, y } = focusPoint(el)
        const feather = Math.max(window.innerWidth, window.innerHeight) * 0.05
        const radius = farthestCorner(x, y) + feather + 2
        return {
          image: `radial-gradient(circle at ${Math.round(x)}px ${Math.round(y)}px, #000 calc(var(--p) * ${Math.round(radius)}px - ${Math.round(feather)}px), transparent calc(var(--p) * ${Math.round(radius)}px))`,
          size: '100% 100%'
        }
      }
    })
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
      clearFx(to)
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
