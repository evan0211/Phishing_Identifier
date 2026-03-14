# Project Structure

```
/
├── Backend/
│   └── server.js          # Mock API server (Node.js, port 3001)
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.js            # App entry — mounts Vue, registers router
        ├── App.vue            # Root component — renders <router-view> + <TTSToggle>
        ├── style.css          # Global CSS variables (light/dark themes, risk level colors)
        ├── router/            # Vue Router config
        ├── views/
        │   ├── HomeView.vue   # Main input page + stats scroll section
        │   ├── ResultView.vue # Two-column analysis result page
        │   └── VisitedView.vue# Warning page shown when user proceeds to a scam site
        ├── components/
        │   └── TTSToggle.vue  # Floating TTS toggle button (fixed bottom-right)
        └── composables/
            ├── useTheme.js    # Dark/light theme — persisted to localStorage
            ├── useElder.js    # Elder mode toggle — persisted to localStorage
            ├── useVoice.js    # TTS logic — hover-to-read via Web Speech API
            └── useResult.js   # Shared reactive state for passing API result to ResultView
```

## Key Conventions

- State shared between views goes in `composables/useResult.js` (reactive singleton)
- Theme and elder mode are module-level singletons in their composables — safe to call `useTheme()` / `useElder()` from any component
- All styles are scoped (`<style scoped>`) and use CSS custom properties defined in `style.css`
- The API base URL `http://localhost:3001` is hardcoded as `const API` at the top of each view
- Risk level CSS classes (`safe`, `promo`, `warn`, `scam`) are applied directly to elements for color theming
- Elder mode is applied via `data-elder="true"` on `<html>` and `.elder` class on the page root
- Dark mode is applied via `data-theme="dark"` on `<html>`
