// src/componentes/publicar/index.jsx — crear o editar una publicación
import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'

function Publicar() {
  const { id } = useParams() // si viene, estamos editando
  const [params] = useSearchParams()
  const { perfil } = useContext(Sesion)
  const navigate = useNavigate()
  const [comunidades, setComunidades] = useState([])
  const [form, setForm] = useState({
    comunidad_id: params.get('c') ?? '', titulo: '', contenido: '', imagen_url: '',
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('comunidad').select('id, nombre').order('nombre')
      setComunidades(data ?? [])
      if (id) {
        const { data: p } = await supabase.from('publicacion').select('*').eq('id', id).single()
        if (p) setForm({
          comunidad_id: String(p.comunidad_id), titulo: p.titulo,
          contenido: p.contenido ?? '', imagen_url: p.imagen_url ?? '',
        })
      }
    }
    cargar()
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)
    const datos = {
      comunidad_id: Number(form.comunidad_id),
      titulo: form.titulo.trim(),
      contenido: form.contenido.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
    }
    const { error } = id
      ? await supabase.from('publicacion').update(datos).eq('id', id)
      : await supabase.from('publicacion').insert({ ...datos, autor_id: perfil.id })
    if (error) setError('No se pudo guardar la publicación')
    else navigate('/')
  }

  return (
    <div className="rd-card p-3">
      <h2 className="h5 mb-3">{id ? 'Editar publicación' : 'Crear publicación'}</h2>
      <form onSubmit={guardar} className="d-grid gap-2">
        <select className="form-select" name="comunidad_id" value={form.comunidad_id}
          onChange={handleChange} required>
          <option value="">Elige una comunidad</option>
          {comunidades.map((c) => <option key={c.id} value={c.id}>c/{c.nombre}</option>)}
        </select>
        <input className="form-control" name="titulo" placeholder="Título" maxLength={300}
          value={form.titulo} onChange={handleChange} required />
        <textarea className="form-control" name="contenido" rows={5} placeholder="Texto (opcional)"
          value={form.contenido} onChange={handleChange} />
        <input className="form-control" name="imagen_url" placeholder="URL de una imagen (opcional)"
          value={form.imagen_url} onChange={handleChange} />
        {form.imagen_url && <img src={form.imagen_url} alt="" className="rd-img" />}
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-grow-1">{id ? 'Guardar cambios' : 'Publicar'}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
    </div>
  )
}

export default Publicar
