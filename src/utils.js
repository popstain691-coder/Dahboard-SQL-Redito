// src/utils.js — funciones pequeñas que usan varias pantallas

// "hace 5 min", "hace 2 h", "hace 3 d"
export function hace(fecha) {
  const seg = Math.max(1, Math.floor((Date.now() - new Date(fecha).getTime()) / 1000))
  if (seg < 60) return 'hace un momento'
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`
  if (seg < 2592000) return `hace ${Math.floor(seg / 86400)} d`
  return new Date(fecha).toLocaleDateString()
}

// Algoritmo "Popular" simplificado: más votos y más reciente = más arriba
export function puntajePopular(p) {
  const horas = (Date.now() - new Date(p.creado_en).getTime()) / 3600000
  return (p.votos + 1) / Math.pow(horas + 2, 1.5)
}

// La app no guarda quién votó qué (solo 3 tablas); recordamos el voto de
// cada quien en el dispositivo para poder quitar o cambiar el voto.
const CLAVE = 'redito_votos'
export function leerVotos() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || {} } catch { return {} }
}
export function guardarVotos(mapa) {
  try { localStorage.setItem(CLAVE, JSON.stringify(mapa)) } catch { /* sin almacenamiento */ }
}
