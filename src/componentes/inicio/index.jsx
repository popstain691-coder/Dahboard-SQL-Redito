// src/componentes/inicio/index.jsx — el feed (MVP): ver, ordenar, buscar y votar
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase'
import { Sesion } from '../../contexto'
import { guardarVotos, leerVotos, puntajePopular } from '../../utils'
import Tarjeta from '../tarjeta'

const ORDENES = [['popular', 'Popular'], ['nuevo', 'Nuevo'], ['top', 'Top']]

function Inicio() {
  const { nombre } = useParams() // si viene, es el feed de una comunidad (c/nombre)
  const { perfil } = useContext(Sesion)
  const [posts, setPosts] = useState([])
  const [comunidad, setComunidad] = useState(null)
  const [orden, setOrden] = useState('popular')
  const [params] = useSearchParams()
  const busqueda = params.get('q') ?? '' // viene del buscador de la barra superior
  const [misVotos, setMisVotos] = useState(leerVotos())
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    let consulta = supabase.from('v_publicacion').select('*').limit(200)
    if (nombre) consulta = consulta.eq('comunidad_nombre', nombre)
    const { data } = await consulta
    setPosts(data ?? [])

    if (nombre) {
      const { data: c } = await supabase.from('comunidad').select('*').eq('nombre', nombre).maybeSingle()
      setComunidad(c)
    } else {
      setComunidad(null)
    }
    setCargando(false)
  }, [nombre])

  useEffect(() => { cargar() }, [cargar])

  // Votar: actualiza la pantalla al instante y avisa a la base de datos
  const votar = async (post, direccion) => {
    const antes = misVotos[post.id] ?? 0
    const ahora = antes === direccion ? 0 : direccion // tocar dos veces quita el voto
    const delta = ahora - antes
    const nuevos = { ...misVotos, [post.id]: ahora }
    setMisVotos(nuevos)
    guardarVotos(nuevos)
    setPosts(posts.map((p) => (p.id === post.id ? { ...p, votos: p.votos + delta } : p)))
    const { error } = await supabase.rpc('votar', { p_id: post.id, delta })
    if (error) cargar()
  }

  const borrar = async (post) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    const { error } = await supabase.from('publicacion').delete().eq('id', post.id)
    if (!error) setPosts(posts.filter((p) => p.id !== post.id))
  }

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const filtrados = posts.filter((p) =>
      `${p.titulo} ${p.contenido ?? ''} ${p.autor_nombre} ${p.comunidad_nombre}`.toLowerCase().includes(q))
    const copia = [...filtrados]
    if (orden === 'nuevo') copia.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    else if (orden === 'top') copia.sort((a, b) => b.votos - a.votos)
    else copia.sort((a, b) => puntajePopular(b) - puntajePopular(a))
    return copia
  }, [posts, orden, busqueda])

  return (
    <>
      {nombre && (
        <div className="rd-card mb-3 overflow-hidden">
          <div className="rd-banner" />
          <div className="px-3 pb-3 d-flex align-items-start gap-3">
            <span className="rd-grande">c/</span>
            <div className="flex-grow-1 pt-2">
              <h1 className="h4 mb-0">c/{nombre}</h1>
              <div className="small text-muted">{comunidad?.descripcion ?? 'Comunidad'}</div>
            </div>
            <Link to={`/publicar?c=${comunidad?.id ?? ''}`} className="btn btn-primary btn-sm mt-2">
              Crear publicación
            </Link>
          </div>
        </div>
      )}

      <div className="d-flex align-items-center gap-1 mb-2 overflow-auto">
        {ORDENES.map(([clave, texto]) => (
          <button key={clave} onClick={() => setOrden(clave)}
            className={`rd-chip ${orden === clave ? 'on' : ''}`}>
            {texto}
          </button>
        ))}
        {busqueda && (
          <span className="ms-2 small text-muted text-nowrap">
            Resultados para “{busqueda}” · <Link to="/">limpiar</Link>
          </span>
        )}
      </div>

      {cargando && <p className="text-center text-muted">Cargando...</p>}
      {!cargando && lista.length === 0 && (
        <div className="rd-card p-4 text-center">
          <p className="mb-2">No hay publicaciones todavía.</p>
          <Link to="/publicar" className="btn btn-primary btn-sm">Crear la primera</Link>
        </div>
      )}

      <div>
        {lista.map((p) => (
          <Tarjeta key={p.id} post={p} miVoto={misVotos[p.id] ?? 0} onVotar={votar}
            puedeEditar={p.autor_id === perfil?.id}
            puedeBorrar={p.autor_id === perfil?.id || perfil?.rol === 'admin'}
            onBorrar={borrar} />
        ))}
      </div>
    </>
  )
}

export default Inicio
