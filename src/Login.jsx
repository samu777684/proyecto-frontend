// src/components/Auth.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Login.css';

// IMPORTANTE: Verifica que esta variable de entorno esté configurada
const API_BASE = import.meta.env.VITE_API_URL || 'https://proyecto-production-fc30.up.railway.app/';

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
      // CORRECCIÓN: Verifica la URL completa
      console.log('Intentando login en:', `${API_BASE}/auth/login`);
      
      const res = await axios.post(`${API_BASE}/auth/login`, { 
        username, 
        password 
      });
      
      console.log('Login exitoso:', res.data);
      
      onLogin({
        token: res.data.token,
        role: res.data.role,
        username: res.data.username,
        fullName: res.data.fullName
      });
      
    } catch (err) {
      console.error('Error en login:', err);
      if (err.code === 'ERR_NETWORK') {
        setMessage('Error de conexión con el servidor');
      } else {
        setMessage(err.response?.data?.msg || 'Error al iniciar sesión');
      }
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
      console.log('Intentando registro en:', `${API_BASE}/auth/register`);
      
      await axios.post(`${API_BASE}/auth/register`, {
        username: form.username.trim(),
        password: form.password.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim()
      });
      
      setMessage('¡Cuenta creada! Ya puedes iniciar sesión');
      setTimeout(() => setMode('login'), 1500);
      
    } catch (err) {
      console.error('Error en registro:', err);
      setMessage(err.response?.data?.msg || 'Error al registrarse');
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
      console.log('Intentando reset en:', `${API_BASE}/auth/forgot-password`);
      
      await axios.post(`${API_BASE}/auth/forgot-password`, { 
        username, 
        newPassword: password 
      });
      
      setMessage('Contraseña cambiada con éxito');
      setTimeout(() => setMode('login'), 2000);
      
    } catch (err) {
      console.error('Error en reset:', err);
      setMessage(err.response?.data?.msg || 'Error');
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

  const testLogin = (user, pass) => {
    setForm({ ...form, username: user, password: pass });
    setTimeout(() => login(), 100);
  };

  return (
    <div className="auth-container">
      <div className="background-decoration" />

      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
        <div className="logo">
          <span role="img" aria-label="médico" style={{ fontSize: '3rem' }}>🩺</span>
          <h1>Consultorio Médico</h1>
          <p className="subtitle">Sistema de gestión interno</p>
        </div>

        <div className="tabs">
          <button 
            className={mode === 'login' ? 'active' : ''} 
            onClick={() => setMode('login')}
            type="button"
          >
            Iniciar Sesión
          </button>
          <button 
            className={mode === 'register' ? 'active' : ''} 
            onClick={() => setMode('register')}
            type="button"
          >
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
                placeholder="Usuario o email"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            )}

            {mode === 'register' && (
              <>
                <input 
                  name="username" 
                  placeholder="Usuario" 
                  value={form.username} 
                  onChange={handleChange} 
                  required 
                />
                <input 
                  name="fullName" 
                  placeholder="Nombre completo" 
                  value={form.fullName} 
                  onChange={handleChange} 
                  required 
                />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Correo electrónico" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              <p className={`message ${message.includes('éxito') || message.includes('creada') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="submit" 
              disabled={loading} 
              className="btn-primary"
            >
              {loading ? 'Procesando...' : 
                mode === 'login' ? 'Entrar' : 
                mode === 'register' ? 'Crear cuenta' : 
                'Cambiar contraseña'}
            </motion.button>

            {mode === 'login' && (
              <>
                <p className="link" onClick={() => setMode('forgot')}>
                  ¿Olvidaste tu contraseña?
                </p>
                
              </>
            )}

            {(mode === 'register' || mode === 'forgot') && (
              <p className="link" onClick={() => setMode('login')}>
                ← Volver al inicio de sesión
              </p>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}