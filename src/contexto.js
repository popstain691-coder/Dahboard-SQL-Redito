// src/contexto.js — guarda la sesión y el perfil para todas las pantallas
import { createContext } from 'react'

export const Sesion = createContext({ perfil: null, recargarPerfil: () => {} })
