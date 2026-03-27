import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) {
            return 'gsap'
          }
        }
      }
    }
  }
};
