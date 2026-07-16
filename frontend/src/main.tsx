import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { seedIfNeeded } from './lib/seed'

// Seed demo data once (per browser) before the first render so the app is
// immediately populated. Subsequent loads short-circuit via a localStorage flag.
seedIfNeeded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
