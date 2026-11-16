// src/componentes/login/index.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
    setEnviando(false)
    if (error) setError('Correo o contraseña no válidos')
    else navigate('/')
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="text-center mb-3">
            <span className="rd-logo" style={{ width: 56, height: 56 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M12 4l7 8h-4.5v8h-5v-8H5z" /></svg>
            </span>
            <h1 className="rd-marca mt-2 mb-0">redito</h1>
            <p className="text-muted">Todo en un solo lugar</p>
          </div>
          <div className="rd-card p-4">
            <h2 className="h5 mb-3">Iniciar sesión</h2>
            <form onSubmit={handleLogin} className="d-grid gap-2">
              <input className="form-control" type="email" placeholder="Correo"
                value={correo} onChange={(e) => setCorreo(e.target.value)} required />
              <input className="form-control" type="password" placeholder="Contraseña"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            <button className="btn btn-link px-0 mt-2" onClick={() => navigate('/registro')}>
              ¿Primera vez en Redito? Regístrate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
