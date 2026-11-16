// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './estilo.css'
import App from './App.jsx'

// Tema claro/oscuro guardado en el dispositivo (antes de pintar, para evitar parpadeo)
try {
  document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('redito_tema') || 'light')
} catch { /* sin almacenamiento */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
