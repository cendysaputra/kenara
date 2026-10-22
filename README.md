# The Golden Shell

"The Golden Shell" is an interactive, animated web-based narrative experience telling a classic Indonesian fairy tale. 

## Features
- **GSAP Narrative Page Transitions:** Smooth, thematic transitions such as crossfades, zooming, and text disintegration for an immersive reading experience.
- **Background Video Support:** Native MP4 autoplay backgrounds for the cinematic hero screen.
- **Audio Soundscapes:** Interactive ambient background audio that can be toggled by the reader.
- **Responsive Design:** Fully responsive CSS designed for both large monitors and mobile reading contexts.

## Tech Stack
- HTML5, CSS3
- Vanilla JavaScript (ES6 Modules)
- GSAP (GreenSock Animation Platform)
- Vite (Build and Development tool)

## Getting Started

1. Clone or download the repository.
2. Install the necessary dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. The server will run, usually on `http://localhost:5173`. Open it in your browser to read the story!

## Note on Media
Media files (`public/assets/img/`, `*.mp4`, `*.mp3`) are excluded from git (`.gitignore`) to keep the repository lightweight. Place them locally before running or building:

- `public/assets/img/` (`misc/`, `chapter-1/` … `chapter-7/`)
- `public/assets/kenara-hero.mp4`
- `public/assets/kenara-sound.mp3`

Everything in `public/` is copied as-is into `dist/` by `npm run build`.

## Deploy (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy dist --project-name kenara
```
