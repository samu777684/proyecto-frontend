// src/components/Auth.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const login = async () => {
    const username = form.username.trim();
    const password = form.password.trim();

    if (!username || !password) {
      setMessage('Completa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      console.log('Intentando login en:', `${API_BASE}/api/auth/login`);

      const res = await axios.post(`${API_BASE}/api/auth/login`, { 
        username, 
        password 
      }, { withCredentials: true }); // importante para cookies si usas sesiones

      console.log('Login exitoso:', res.data);
      
      onLogin({
        token: res.data.token,
        role: res.data.role,
        username: res.data.username || username,
        fullName: res.data.fullName
      });
      
      setMessage('¡Bienvenido!');
      
    } catch (err) {
      console.error('Error en login:', err);
      setMessage(err.response?.data?.msg || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (form.password !== form.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (!form.username.trim() || !form.password.trim() || !form.fullName.trim() || !form.email.trim()) {
      setMessage('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      console.log('Intentando registro en:', `${API_BASE}/api/auth/register`);
      
      await axios.post(`${API_BASE}/api/auth/register`, {
        username: form.username.trim(),
        password: form.password.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim()
      });

      setMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión');
      setTimeout(() => {
        setMode('login');
        setForm({ ...form, username: '', password: '', confirmPassword: '', fullName: '', email: '' });
      }, 2000);
      
    } catch (err) {
      console.error('Error en registro:', err);
      setMessage(err.response?.data?.msg || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const username = form.username.trim();
    const password = form.password.trim();
    
    if (!username || !password) {
      setMessage('Completa ambos campos');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Intentando cambiar contraseña en:', `${API_BASE}/api/auth/forgot-password`);
      
      await axios.post(`${API_BASE}/api/auth/forgot-password`, { 
        username, 
        newPassword: password 
      });

      setMessage('Contraseña cambiada con éxito. Inicia sesión');
      setTimeout(() => setMode('login'), 2000);
      
    } catch (err) {
      console.error('Error:', err);
      setMessage(err.response?.data?.msg || 'Usuario no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    
    if (mode === 'login') login();
    if (mode === 'register') register();
    if (mode === 'forgot') resetPassword();
  };

  // Botones rápidos para probar (puedes borrarlos después)
  const testLogin = (user, pass) => {
    setForm({ ...form, username: user, password: pass });
    setTimeout(login, 100);
  };

  return (
    <div className="auth-container">
      <div className="background-decoration" />

      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
        <div className="logo">
          <span role="img" aria-label="médico" style={{ fontSize: '3rem' }}>Hospital</span>
          <h1>Consultorio Médico</h1>
          <p className="subtitle">Sistema de gestión interno</p>
        </div>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Iniciar Sesión
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Registrarse
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {(mode === 'login' || mode === 'forgot') && (
              <input
                name="username"
                placeholder="Usuario"
                value={form.username}
                onChange={handleChange}
                required
              />
            )}

            {mode === 'register' && (
              <>
                <input name="username" placeholder="Usuario" value={form.username} onChange={handleChange} required />
                <input name="fullName" placeholder="Nombre completo" value={form.fullName} onChange={handleChange} required />
                <input name="email" type="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} required />
              </>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <input
                name="password"
                type="password"
                placeholder={mode === 'forgot' ? 'Nueva contraseña' : 'Contraseña'}
                value={form.password}
                onChange={handleChange}
                required
              />
            )}

            {mode === 'register' && (
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repetir contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            )}

            {message && (
              <p className={`message ${message.includes('éxito') || message.includes('creada') || message.includes('Bienvenido') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Procesando...' : 
                mode === 'login' ? 'Entrar' : 
                mode === 'register' ? 'Crear cuenta' : 
                'Cambiar contraseña'}
            </motion.button>

            {mode === 'login' && (
              <p className="link" onClick={() => setMode('forgot')}>
                ¿Olvidaste tu contraseña?
              </p>
            )}

            {(mode === 'register' || mode === 'forgot') && (
              <p className="link" onClick={() => setMode('login')}>
                ← Volver al inicio de sesión
              </p>
            )}

            {/* Botones de prueba rápidos (borrar en producción) */}
            {import.meta.env.DEV && (
              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
                <button type="button" onClick={() => testLogin('admin', '123456')} style={{ margin: '0 5px' }}>
                  Admin
                </button>
                <button type="button" onClick={() => testLogin('doctor1', '123456')} style={{ margin: '0 5px' }}>
                  Doctor
                </button>
                <button type="button" onClick={() => testLogin('paciente1', '123456')} style={{ margin: '0 5px' }}>
                  Paciente
                </button>
              </div>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}