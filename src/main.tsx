import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/tokens.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production build ships prerendered markup; dev serves an empty root.
if (root.firstChild) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
