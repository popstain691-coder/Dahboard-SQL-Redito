// src/componentes/admin/index.jsx — CRUD administrativo (solo rol admin)
import { useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'

const PESTANAS = [['resumen', 'Resumen'], ['usuarios', 'Usuarios'], ['comunidades', 'Comunidades'], ['posts', 'Publicaciones']]

function Admin() {
  const { perfil } = useContext(Sesion)
  const [pestana, setPestana] = useState('resumen')
  const [usuarios, setUsuarios] = useState([])
  const [comunidades, setComunidades] = useState([])
  const [posts, setPosts] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [nueva, setNueva] = useState({ nombre: '', descripcion: '' })
  const [aviso, setAviso] = useState(null)

  const esAdmin = perfil?.rol === 'admin'

  // Las tres tablas llegan de una vez; RLS deja pasar todo porque somos admin
  const cargar = async () => {
    const [u, c, p] = await Promise.all([
      supabase.from('usuario').select('*').order('creado_en', { ascending: false }),
      supabase.from('comunidad').select('*').order('creado_en', { ascending: false }),
      supabase.from('v_publicacion').select('*').order('creado_en', { ascending: false }),
    ])
    setUsuarios(u.data ?? [])
    setComunidades(c.data ?? [])
    setPosts(p.data ?? [])
  }
  useEffect(() => { if (esAdmin) cargar() }, [esAdmin])

  if (!esAdmin) return <Navigate to="/" />

  const avisar = (texto) => { setAviso(texto); setTimeout(() => setAviso(null), 2500) }

  // ---- Indicadores (se calculan con los datos que ya llegaron) ----
  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000
  const indicadores = [
    ['Usuarios', usuarios.length],
    ['Admins', usuarios.filter((u) => u.rol === 'admin').length],
    ['Comunidades', comunidades.length],
    ['Publicaciones', posts.length],
    ['Votos totales', posts.reduce((s, p) => s + p.votos, 0)],
    ['Nuevos (7 días)', usuarios.filter((u) => new Date(u.creado_en) > haceUnaSemana).length],
  ]
  const porComunidad = comunidades.map((c) => ({
    nombre: c.nombre, total: posts.filter((p) => p.comunidad_id === c.id).length,
  }))
  const maxPosts = Math.max(1, ...porComunidad.map((c) => c.total))

  // ---- Usuarios: editar y eliminar ----
  const cambiar = (lista, setLista, id, campo, valor) =>
    setLista(lista.map((x) => (x.id === id ? { ...x, [campo]: valor } : x)))

  const guardarUsuario = async (u) => {
    const { error } = await supabase.from('usuario')
      .update({ nombre: u.nombre, telefono: u.telefono, rol: u.rol }).eq('id', u.id)
    avisar(error ? 'No se pudo guardar' : `Guardado: u/${u.nombre}`)
  }
  const eliminarUsuario = async (u) => {
    if (!window.confirm(`¿Eliminar la cuenta de u/${u.nombre} y todo lo que publicó?`)) return
    const { error } = await supabase.rpc('admin_eliminar_usuario', { p_id: u.id })
    if (error) avisar(error.message)
    else { avisar('Usuario eliminado'); cargar() }
  }

  // ---- Comunidades: crear, editar, eliminar ----
  const crearComunidad = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('comunidad').insert({
      nombre: nueva.nombre.trim().toLowerCase(), descripcion: nueva.descripcion, creador_id: perfil.id,
    })
    if (error) avisar('Nombre inválido o repetido (3-21 letras minúsculas, números o _)')
    else { setNueva({ nombre: '', descripcion: '' }); cargar() }
  }
  const guardarComunidad = async (c) => {
    const { error } = await supabase.from('comunidad')
      .update({ nombre: c.nombre, descripcion: c.descripcion }).eq('id', c.id)
    avisar(error ? 'No se pudo guardar' : `Guardado: c/${c.nombre}`)
  }
  const eliminarComunidad = async (c) => {
    if (!window.confirm(`¿Eliminar c/${c.nombre} con todas sus publicaciones?`)) return
    const { error } = await supabase.from('comunidad').delete().eq('id', c.id)
    if (!error) cargar()
  }

  // ---- Publicaciones: moderar ----
  const guardarPost = async (p) => {
    const { error } = await supabase.from('publicacion').update({ titulo: p.titulo }).eq('id', p.id)
    avisar(error ? 'No se pudo guardar' : 'Título actualizado')
  }
  const eliminarPost = async (p) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    const { error } = await supabase.from('publicacion').delete().eq('id', p.id)
    if (!error) setPosts(posts.filter((x) => x.id !== p.id))
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <>
      <h1 className="h4 mb-3">Panel de administración</h1>
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      <ul className="nav nav-pills mb-3 flex-nowrap overflow-auto">
        {PESTANAS.map(([clave, texto]) => (
          <li className="nav-item" key={clave}>
            <button className={`nav-link text-nowrap ${pestana === clave ? 'active' : ''}`}
              onClick={() => setPestana(clave)}>{texto}</button>
          </li>
        ))}
      </ul>

      {pestana === 'resumen' && (
        <>
          <div className="row g-2 mb-3">
            {indicadores.map(([titulo, valor]) => (
              <div className="col-6 col-md-4" key={titulo}>
                <div className="rd-card text-center p-3 h-100">
                  <div className="text-muted small">{titulo}</div>
                  <div className="fs-2 fw-bold">{valor}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rd-card p-3">
            <h2 className="h6">Publicaciones por comunidad</h2>
            {porComunidad.map((c) => (
              <div className="d-flex align-items-center gap-2 mb-2" key={c.nombre}>
                <span className="w-25 text-truncate">c/{c.nombre}</span>
                <div className="progress flex-grow-1">
                  <div className="progress-bar" style={{ width: `${(c.total / maxPosts) * 100}%` }}>
                    {c.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pestana === 'usuarios' && (
        <div className="rd-card p-3">
          <input className="form-control mb-2" placeholder="Buscar por nombre o correo"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Usuario</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th></th></tr></thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td><input className="form-control form-control-sm" value={u.nombre}
                      onChange={(e) => cambiar(usuarios, setUsuarios, u.id, 'nombre', e.target.value)} /></td>
                    <td className="small">{u.correo}</td>
                    <td><input className="form-control form-control-sm" value={u.telefono ?? ''}
                      onChange={(e) => cambiar(usuarios, setUsuarios, u.id, 'telefono', e.target.value)} /></td>
                    <td>
                      <select className="form-select form-select-sm" value={u.rol}
                        onChange={(e) => cambiar(usuarios, setUsuarios, u.id, 'rol', e.target.value)}>
                        <option value="usuario">usuario</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-primary me-1" onClick={() => guardarUsuario(u)}>Guardar</button>
                      {u.id !== perfil.id && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarUsuario(u)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'comunidades' && (
        <div className="rd-card p-3">
          <form onSubmit={crearComunidad} className="row g-2 mb-3">
            <div className="col-md-4"><input className="form-control" placeholder="nombre" value={nueva.nombre}
              onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} required /></div>
            <div className="col-md-5"><input className="form-control" placeholder="descripción" value={nueva.descripcion}
              onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} /></div>
            <div className="col-md-3 d-grid"><button className="btn btn-primary">Crear</button></div>
          </form>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Nombre</th><th>Descripción</th><th></th></tr></thead>
              <tbody>
                {comunidades.map((c) => (
                  <tr key={c.id}>
                    <td><input className="form-control form-control-sm" value={c.nombre}
                      onChange={(e) => cambiar(comunidades, setComunidades, c.id, 'nombre', e.target.value)} /></td>
                    <td><input className="form-control form-control-sm" value={c.descripcion ?? ''}
                      onChange={(e) => cambiar(comunidades, setComunidades, c.id, 'descripcion', e.target.value)} /></td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-primary me-1" onClick={() => guardarComunidad(c)}>Guardar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarComunidad(c)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'posts' && (
        <div className="rd-card p-3">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Título</th><th>Comunidad</th><th>Autor</th><th>Votos</th><th></th></tr></thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td><input className="form-control form-control-sm" value={p.titulo}
                      onChange={(e) => cambiar(posts, setPosts, p.id, 'titulo', e.target.value)} /></td>
                    <td className="small">c/{p.comunidad_nombre}</td>
                    <td className="small">u/{p.autor_nombre}</td>
                    <td>{p.votos}</td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-primary me-1" onClick={() => guardarPost(p)}>Guardar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarPost(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

export default Admin
