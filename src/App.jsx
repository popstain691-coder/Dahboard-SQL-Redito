// src/App.jsx
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Sesion } from './contexto'
import Layout from './componentes/layout'
import Login from './componentes/login'
import Registro from './componentes/registro'
import Inicio from './componentes/inicio'
import Comunidades from './componentes/comunidades'
import Publicar from './componentes/publicar'
import Perfil from './componentes/perfil'
import Admin from './componentes/admin'

function App() {
  const [usuario, setUsuario] = useState(null)       // cuenta de Authentication
  const [perfil, setPerfil] = useState(null)         // fila de la tabla usuario
  const [errorPerfil, setErrorPerfil] = useState(null)
  const [iniciando, setIniciando] = useState(true)   // ¿ya sabemos si hay sesión?

  // 1. ¿Hay sesión abierta? y escuchar cuando alguien entra o sale
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setIniciando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_evento, session) => setUsuario(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  // 2. Con sesión, traer el perfil (nombre y rol)
  const usuarioId = usuario?.id

  const recargarPerfil = useCallback(async () => {
    if (!usuarioId) { setPerfil(null); setErrorPerfil(null); return }
    setErrorPerfil(null)
    const { data, error } = await supabase
      .from('usuario').select('*').eq('id', usuarioId).maybeSingle()
    setPerfil(data ?? null)
    if (!data) setErrorPerfil(error?.message ?? 'No existe tu fila en la tabla usuario')
  }, [usuarioId])

  useEffect(() => { recargarPerfil() }, [recargarPerfil])

  const cargando = <p className="p-4 text-center">Cargando...</p>

  if (iniciando) return cargando
  if (usuario && !perfil && !errorPerfil) return cargando

  if (usuario && !perfil) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">No se pudo cargar tu perfil: {errorPerfil}</div>
        <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    )
  }

  const privada = (componente) => (usuario ? componente : <Navigate to="/login" />)

  return (
    <Sesion.Provider value={{ perfil, recargarPerfil }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login />} />
          <Route path="/registro" element={usuario ? <Navigate to="/" /> : <Registro />} />
          <Route element={privada(<Layout />)}>
            <Route path="/" element={<Inicio />} />
            <Route path="/c/:nombre" element={<Inicio />} />
            <Route path="/comunidades" element={<Comunidades />} />
            <Route path="/publicar" element={<Publicar />} />
            <Route path="/publicar/:id" element={<Publicar />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </Sesion.Provider>
  )
}

export default App
