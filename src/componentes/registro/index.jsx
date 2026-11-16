// src/componentes/registro/index.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

function Registro() {
  const [form, setForm] = useState({
    nombre: '', correo: '', password: '', fecha_nacimiento: '', telefono: '',
  })
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegistro = async (e) => {
    e.preventDefault()
    // El nombre de usuario va en minúsculas, sin espacios (como en Reddit: u/nombre)
    const nombre = form.nombre.trim().toLowerCase().replace(/\s+/g, '_')
    const { data, error } = await supabase.auth.signUp({
      email: form.correo,
      password: form.password,
      // Estos datos los lee el trigger y crea la fila en "usuario"
      options: {
        data: {
          nombre,
          fecha_nacimiento: form.fecha_nacimiento,
          telefono: form.telefono,
        },
      },
    })
    if (error) {
      setError(true)
      setMensaje(error.message)
    } else if (data.session) {
      navigate('/') // el proyecto no pide confirmar correo: ya hay sesión
    } else {
      setError(false)
      setMensaje('Cuenta creada. Confirma tu correo y luego inicia sesión.')
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="rd-card p-4">
            <h2 className="h5 mb-3">Crear cuenta en Redito</h2>
            <form onSubmit={handleRegistro} className="d-grid gap-2">
              <div className="input-group">
                <span className="input-group-text">u/</span>
                <input className="form-control" name="nombre" placeholder="nombre_de_usuario"
                  value={form.nombre} onChange={handleChange} required />
              </div>
              <input className="form-control" name="correo" type="email" placeholder="Correo"
                value={form.correo} onChange={handleChange} required />
              <input className="form-control" name="password" type="password" minLength={6}
                placeholder="Contraseña (mínimo 6)" value={form.password}
                onChange={handleChange} required />
              <label className="small text-muted mb-0">Fecha de nacimiento</label>
              <input className="form-control" name="fecha_nacimiento" type="date"
                value={form.fecha_nacimiento} onChange={handleChange} />
              <input className="form-control" name="telefono" placeholder="Teléfono"
                value={form.telefono} onChange={handleChange} />
              <button className="btn btn-primary">Registrarme</button>
            </form>
            {mensaje && (
              <div className={`alert ${error ? 'alert-danger' : 'alert-info'} mt-3 mb-0`}>{mensaje}</div>
            )}
            <button className="btn btn-link px-0 mt-2" onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Registro
