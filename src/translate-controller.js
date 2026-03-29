const STORAGE_KEY = 'kenara-language'
const DEFAULT_LANGUAGE = 'en'
const TARGET_LANGUAGE = 'id'
const GOOGLE_COOKIE_NAME = 'googtrans'
let translateScriptPromise = null

function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

function clearCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function getSavedLanguage() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE
}

function saveLanguage(language) {
  localStorage.setItem(STORAGE_KEY, language)
}

function setDocumentLanguage(language) {
  document.documentElement.lang = language
  document.body.dataset.language = language
}

function updateLanguageButton(language) {
  const button = document.getElementById('lang-btn')
  if (!button) return

  button.textContent = language.toUpperCase()
  button.setAttribute(
    'aria-label',
    language === TARGET_LANGUAGE ? 'Switch language to English' : 'Switch language to Indonesian'
  )
}

function applyGoogleTranslateCookie(language) {
  if (language === TARGET_LANGUAGE) {
    const value = `/${DEFAULT_LANGUAGE}/${TARGET_LANGUAGE}`
    setCookie(GOOGLE_COOKIE_NAME, value)
    return
  }

  clearCookie(GOOGLE_COOKIE_NAME)
}

function loadGoogleTranslateScript() {
  if (translateScriptPromise) return translateScriptPromise

  translateScriptPromise = new Promise((resolve) => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: DEFAULT_LANGUAGE,
            includedLanguages: TARGET_LANGUAGE,
            autoDisplay: false
          },
          'google_translate_element'
        )
      }

      resolve()
    }

    const existingScript = document.getElementById('google-translate-script')
    if (existingScript) return

    const script = document.createElement('script')
    script.id = 'google-translate-script'
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
  })

  return translateScriptPromise
}

function waitForTranslateSelect() {
  return new Promise((resolve) => {
    const maxAttempts = 40
    let attempt = 0

    const check = () => {
      const select = document.querySelector('.goog-te-combo')
      if (select || attempt >= maxAttempts) {
        resolve(select)
        return
      }

      attempt += 1
      window.setTimeout(check, 150)
    }

    check()
  })
}

async function translateToIndonesian() {
  document.body.dataset.translatePending = 'true'
  applyGoogleTranslateCookie(TARGET_LANGUAGE)
  await loadGoogleTranslateScript()

  const select = await waitForTranslateSelect()
  if (select) {
    select.value = TARGET_LANGUAGE
    select.dispatchEvent(new Event('change'))
  }

  document.body.dataset.translatePending = 'false'
}

function applyInitialLanguage() {
  const language = getSavedLanguage()
  setDocumentLanguage(language)
  updateLanguageButton(language)

  if (language === TARGET_LANGUAGE) {
    translateToIndonesian()
  } else {
    document.body.dataset.translatePending = 'false'
  }
}

export function initTranslate() {
  applyInitialLanguage()

  const button = document.getElementById('lang-btn')
  if (!button) return

  button.addEventListener('click', () => {
    const currentLanguage = getSavedLanguage()
    const nextLanguage = currentLanguage === TARGET_LANGUAGE ? DEFAULT_LANGUAGE : TARGET_LANGUAGE

    saveLanguage(nextLanguage)
    setDocumentLanguage(nextLanguage)
    updateLanguageButton(nextLanguage)

    if (nextLanguage === TARGET_LANGUAGE) {
      translateToIndonesian()
      return
    }

    applyGoogleTranslateCookie(nextLanguage)
    // Simpan layar aktif sebelum reload.
    const currentScreen = document.querySelector('.screen.active')
    if (currentScreen) {
      const screenIndex = Array.from(document.querySelectorAll('.screen')).indexOf(currentScreen)
      localStorage.setItem('kenara-screen-index', String(screenIndex))
    }
    window.location.reload()
  })
}
