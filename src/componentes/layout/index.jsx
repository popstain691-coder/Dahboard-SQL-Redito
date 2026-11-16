// src/componentes/layout/index.jsx — barra superior, menú lateral, feed al centro y panel derecho
import { useContext, useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'

const Icono = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const ICONOS = {
  inicio: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  comunidades: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  crear: 'M12 5v14M5 12h14',
  perfil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  admin: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  buscar: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
}

function Layout() {
  const { perfil } = useContext(Sesion)
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const [comunidades, setComunidades] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [menu, setMenu] = useState(false)
  const [tema, setTema] = useState(() => {
    try { return localStorage.getItem('redito_tema') || 'light' } catch { return 'light' }
  })

  // Comunidades con su número de publicaciones (para el menú y el panel derecho)
  useEffect(() => {
    supabase.from('comunidad').select('id, nombre, publicacion(id)')
      .then(({ data }) => setComunidades(data ?? []))
  }, [ubicacion.pathname])

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
    try { localStorage.setItem('redito_tema', tema) } catch { /* sin almacenamiento */ }
  }, [tema])

  const buscar = (e) => {
    e.preventDefault()
    navigate(busqueda.trim() ? `/?q=${encodeURIComponent(busqueda.trim())}` : '/')
  }

  const cerrarSesion = async () => {
    setMenu(false)
    await supabase.auth.signOut()
  }

  const esAdmin = perfil?.rol === 'admin'
  const populares = [...comunidades].sort((a, b) => b.publicacion.length - a.publicacion.length).slice(0, 5)

  const inferiores = [
    ['/', 'Inicio', ICONOS.inicio],
    ['/comunidades', 'Comunidades', ICONOS.comunidades],
    ['/publicar', 'Crear', ICONOS.crear],
    ['/perfil', 'Perfil', ICONOS.perfil],
  ]
  if (esAdmin) inferiores.push(['/admin', 'Admin', ICONOS.admin])

  return (
    <>
      <header className="rd-top">
        <div className="rd-top-in">
          <Link to="/" className="d-flex align-items-center gap-2">
            <span className="rd-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 4l7 8h-4.5v8h-5v-8H5z" /></svg>
            </span>
            <span className="rd-marca d-none d-sm-inline">redito</span>
          </Link>

          <form className="rd-search" onSubmit={buscar}>
            <Icono d={ICONOS.buscar} size={18} />
            <input placeholder="Buscar en Redito" value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} />
          </form>

          <Link to="/publicar" className="rd-pill d-none d-md-inline-flex gap-1">
            <Icono d={ICONOS.crear} size={18} /> Crear
          </Link>

          <div className="position-relative">
            <button className="rd-avatar" onClick={() => setMenu(!menu)} aria-label="Menú de usuario">
              {perfil?.nombre?.[0]?.toUpperCase()}
            </button>
            {menu && (
              <>
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 25 }}
                  onClick={() => setMenu(false)} />
                <div className="rd-menu">
                  <div className="px-3 py-2 small text-muted">u/{perfil?.nombre}</div>
                  <Link to="/perfil" onClick={() => setMenu(false)}>Mi perfil</Link>
                  {esAdmin && <Link to="/admin" onClick={() => setMenu(false)}>Panel de administración</Link>}
                  <button onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
                    {tema === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro'}
                  </button>
                  <button onClick={cerrarSesion}>Cerrar sesión</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="rd-grid">
        {/* Menú izquierdo (escritorio) */}
        <aside className="rd-izq">
          <NavLink to="/" end className="rd-link"><Icono d={ICONOS.inicio} size={20} /> Inicio</NavLink>
          <NavLink to="/comunidades" className="rd-link"><Icono d={ICONOS.comunidades} size={20} /> Explorar</NavLink>
          <NavLink to="/publicar" className="rd-link"><Icono d={ICONOS.crear} size={20} /> Crear publicación</NavLink>
          {esAdmin && <NavLink to="/admin" className="rd-link"><Icono d={ICONOS.admin} size={20} /> Administración</NavLink>}
          <div className="rd-etiqueta">COMUNIDADES</div>
          {comunidades.map((c) => (
            <NavLink key={c.id} to={`/c/${c.nombre}`} className="rd-link">
              <span className="rd-mini">c/</span> {c.nombre}
            </NavLink>
          ))}
        </aside>

        <main className="rd-centro">
          <Outlet />
        </main>

        {/* Panel derecho (pantallas grandes) */}
        <aside className="rd-der">
          <div className="rd-lado">
            <div className="rd-etiqueta p-0 mb-2">COMUNIDADES POPULARES</div>
            {populares.map((c) => (
              <Link key={c.id} to={`/c/${c.nombre}`} className="rd-link px-0">
                <span className="rd-mini">c/</span>
                <span className="flex-grow-1">
                  c/{c.nombre}
                  <span className="d-block small text-muted">{c.publicacion.length} publicaciones</span>
                </span>
              </Link>
            ))}
            <Link to="/comunidades" className="btn btn-sm btn-outline-secondary w-100 mt-2">Ver todas</Link>
          </div>
          <p className="small text-muted mt-3 px-2">
            Redito · réplica educativa de una red social tipo foro. Hecha con React y Supabase.
          </p>
        </aside>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="rd-bottom d-flex">
        {inferiores.map(([ruta, texto, d]) => (
          <NavLink key={ruta} to={ruta} end={ruta === '/'}>
            <Icono d={d} />
            {texto}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Layout
