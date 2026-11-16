// src/componentes/comunidades/index.jsx — lista de comunidades y crear una nueva
import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'

function Comunidades() {
  const { perfil } = useContext(Sesion)
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [error, setError] = useState(null)

  const cargar = async () => {
    // Una consulta con join: cada comunidad con sus publicaciones (para contarlas)
    const { data } = await supabase
      .from('comunidad')
      .select('id, nombre, descripcion, creador_id, publicacion(id)')
      .order('creado_en', { ascending: false })
    setLista(data ?? [])
  }
  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setError(null)
    const nombre = form.nombre.trim().toLowerCase().replace(/^c\//, '')
    const { error } = await supabase.from('comunidad').insert({
      nombre, descripcion: form.descripcion, creador_id: perfil.id,
    })
    if (error) {
      setError(error.code === '23505' ? 'Ya existe una comunidad con ese nombre'
        : 'Usa de 3 a 21 letras minúsculas, números o guion bajo')
    } else {
      setForm({ nombre: '', descripcion: '' })
      cargar()
    }
  }

  const borrar = async (c) => {
    if (!window.confirm(`¿Eliminar c/${c.nombre} y todas sus publicaciones?`)) return
    const { error } = await supabase.from('comunidad').delete().eq('id', c.id)
    if (!error) cargar()
  }

  return (
    <>
      <div className="rd-card p-3 mb-3">
        <h2 className="h6">Crear comunidad</h2>
        <form onSubmit={crear} className="d-grid gap-2">
          <div className="input-group">
            <span className="input-group-text">c/</span>
            <input className="form-control" placeholder="nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <input className="form-control" placeholder="Descripción" value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <button className="btn btn-primary">Crear</button>
        </form>
        {error && <div className="alert alert-danger mt-2 mb-0 py-2">{error}</div>}
      </div>

      <h2 className="h6 text-muted">Explorar comunidades</h2>
      <div className="d-grid gap-2">
        {lista.map((c) => (
          <div className="rd-card p-3 d-flex align-items-center gap-3" key={c.id}>
            <span className="rd-avatar" style={{ width: 36, height: 36 }}>c/</span>
            <Link to={`/c/${c.nombre}`} className="flex-grow-1 text-decoration-none text-body">
              <div className="fw-bold">c/{c.nombre}</div>
              <div className="small text-muted">
                {c.publicacion.length} publicaciones · {c.descripcion || 'Sin descripción'}
              </div>
            </Link>
            {(c.creador_id === perfil.id || perfil.rol === 'admin') && (
              <button className="btn btn-sm btn-outline-danger" onClick={() => borrar(c)}>Eliminar</button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default Comunidades
