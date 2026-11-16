// src/componentes/tarjeta/index.jsx — una publicación con votos en píldora (estilo Reddit)
import { Link } from 'react-router-dom'
import { hace } from '../../utils'

const Flecha = ({ abajo }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
    style={abajo ? { transform: 'rotate(180deg)' } : undefined}>
    <path d="M12 4l8 9h-5v7H9v-7H4z" />
  </svg>
)

function Tarjeta({ post, miVoto = 0, onVotar, puedeEditar, puedeBorrar, onBorrar }) {
  const claseVoto = miVoto === 1 ? 'up-on' : miVoto === -1 ? 'down-on' : ''

  return (
    <article className="rd-post">
      <div className="rd-meta d-flex align-items-center gap-2">
        <span className="rd-mini">c/</span>
        <Link to={`/c/${post.comunidad_nombre}`}>c/{post.comunidad_nombre}</Link>
        <span>• {hace(post.creado_en)}</span>
        <span className="ms-auto text-truncate">u/{post.autor_nombre}</span>
      </div>

      <h3 className="rd-titulo">{post.titulo}</h3>
      {post.contenido && <p className="rd-texto mb-2">{post.contenido}</p>}
      {post.imagen_url && (
        <img src={post.imagen_url} alt="" className="rd-img mb-2" loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }} />
      )}

      <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className={`rd-pill rd-voto ${claseVoto}`}>
          <button onClick={() => onVotar(post, 1)} aria-label="Votar a favor"><Flecha /></button>
          <span>{post.votos}</span>
          <button onClick={() => onVotar(post, -1)} aria-label="Votar en contra"><Flecha abajo /></button>
        </div>
        {puedeEditar && <Link to={`/publicar/${post.id}`} className="rd-pill">Editar</Link>}
        {puedeBorrar && (
          <button className="rd-pill peligro" onClick={() => onBorrar(post)}>Eliminar</button>
        )}
      </div>
    </article>
  )
}

export default Tarjeta
