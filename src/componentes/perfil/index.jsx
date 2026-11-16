// src/componentes/perfil/index.jsx — CRUD del usuario: ver/editar perfil, sus posts y borrar cuenta
import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'
import Tarjeta from '../tarjeta'

function Perfil() {
  const { perfil: miPerfil, recargarPerfil } = useContext(Sesion)
  const [perfil, setPerfil] = useState(miPerfil)
  const [posts, setPosts] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const navigate = useNavigate()

  const cargarPosts = async () => {
    const { data } = await supabase.from('v_publicacion').select('*')
      .eq('autor_id', miPerfil.id).order('creado_en', { ascending: false })
    setPosts(data ?? [])
  }
  useEffect(() => { cargarPosts() }, [])

  const handleChange = (e) => setPerfil({ ...perfil, [e.target.name]: e.target.value })

  const guardar = async () => {
    // Fíjate: no se envía el rol. Aunque se enviara, el trigger proteger_rol lo rechaza.
    const { error } = await supabase.from('usuario').update({
      nombre: perfil.nombre.trim().toLowerCase().replace(/\s+/g, '_'),
      fecha_nacimiento: perfil.fecha_nacimiento || null,
      telefono: perfil.telefono,
      bio: perfil.bio,
    }).eq('id', perfil.id)
    setMensaje(error ? 'No se pudo guardar' : 'Datos actualizados')
    if (!error) recargarPerfil()
  }

  const borrarPost = async (post) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    const { error } = await supabase.from('publicacion').delete().eq('id', post.id)
    if (!error) setPosts(posts.filter((p) => p.id !== post.id))
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const eliminarCuenta = async () => {
    if (!window.confirm('Se borrará tu cuenta y todas tus publicaciones. ¿Seguro?')) return
    const { error } = await supabase.rpc('eliminar_mi_cuenta')
    if (error) { setMensaje('No se pudo eliminar la cuenta'); return }
    await supabase.auth.signOut()
    navigate('/login')
  }

  const karma = posts.reduce((s, p) => s + p.votos, 0)

  return (
    <>
      <div className="rd-card mb-3 overflow-hidden">
        <div className="rd-banner" />
        <div className="px-3 pb-3 d-flex align-items-start gap-3">
          <span className="rd-grande">
            {perfil.nombre[0]?.toUpperCase()}
          </span>
          <div className="flex-grow-1 pt-2">
            <h1 className="h5 mb-0">u/{perfil.nombre}</h1>
            <div className="small text-muted">{posts.length} publicaciones · {karma} karma</div>
          </div>
          <button className="btn btn-outline-secondary btn-sm mt-2" onClick={cerrarSesion}>Salir</button>
        </div>
      </div>

      <div className="rd-card p-3 mb-3">
        <h2 className="h6">Mis datos</h2>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small mb-0">Nombre de usuario</label>
            <input className="form-control" name="nombre" value={perfil.nombre} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0">Correo</label>
            <input className="form-control" value={perfil.correo} disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0">Fecha de nacimiento</label>
            <input className="form-control" type="date" name="fecha_nacimiento"
              value={perfil.fecha_nacimiento ?? ''} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0">Teléfono</label>
            <input className="form-control" name="telefono" value={perfil.telefono ?? ''} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0">Sobre mí</label>
            <textarea className="form-control" rows={2} name="bio" value={perfil.bio ?? ''} onChange={handleChange} />
          </div>
          <div className="col-12 d-flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={guardar}>Guardar cambios</button>
            {perfil.rol === 'admin' && <Link to="/admin" className="btn btn-outline-primary">Panel admin</Link>}
            <button className="btn btn-outline-danger ms-auto" onClick={eliminarCuenta}>Eliminar mi cuenta</button>
          </div>
        </div>
        {mensaje && <div className="alert alert-info mt-3 mb-0 py-2">{mensaje}</div>}
      </div>

      <h2 className="h6 text-muted">Mis publicaciones</h2>
      {posts.length === 0 && <p className="text-muted small">Aún no has publicado nada.</p>}
      <div>
        {posts.map((p) => (
          <Tarjeta key={p.id} post={p} onVotar={() => {}} puedeEditar puedeBorrar onBorrar={borrarPost} />
        ))}
      </div>
    </>
  )
}

export default Perfil
