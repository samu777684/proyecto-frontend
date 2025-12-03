// src/components/PatientPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './PatientPanel.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function PatientPanel({ token, logout, api }) {
  const [citas, setCitas] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medico_id: '', fecha_hora: '', motivo: '' });
  const [loading, setLoading] = useState(true);

  const cargarCitas = async () => {
    try {
      const res = await axios.get(`${api}/api/citas/mis-citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCitas(res.data);
    } catch (err) {
      console.error('Error al cargar citas:', err);
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const cargarMedicos = async () => {
    try {
      const res = await axios.get(`${api}/api/citas/medicos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicos(res.data);
    } catch (err) {
      console.error('Error al cargar médicos:', err);
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarMedicos();
  }, []);

  const handleCrearCita = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${api}/api/citas/crear`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setForm({ medico_id: '', fecha_hora: '', motivo: '' });
      cargarCitas();
      alert('Cita solicitada con éxito');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al crear cita');
    }
  };

  const cancelarCita = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await axios.put(`${api}/api/citas/cancelar/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarCitas();
      alert('Cita cancelada');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al cancelar');
    }
  };

  const getEstadoText = (estado) => {
    const textos = {
      pendiente: 'PENDIENTE',
      confirmada: 'CONFIRMADA',
      atendida: 'ATENDIDA',
      cancelada: 'CANCELADA'
    };
    return textos[estado] || estado.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Cargando tus citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-panel-container">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="panel-card">

          <div className="header-section">
            <h1 className="title">Mis Citas Médicas</h1>
            <button onClick={logout} className="logout-btn">
              Cerrar Sesión
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-new-appointment"
          >
            {showForm ? 'Ocultar formulario' : '+ Solicitar Nueva Cita'}
          </button>

          {showForm && (
            <div className="form-card">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Solicitar Nueva Cita</h2>
              <form onSubmit={handleCrearCita}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Médico</label>
                    <select
                      required
                      value={form.medico_id}
                      onChange={(e) => setForm({ ...form, medico_id: e.target.value })}
                    >
                      <option value="">Seleccionar médico</option>
                      {medicos.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.fecha_hora}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Motivo de la consulta</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Control anual, dolor de cabeza..."
                      value={form.motivo}
                      onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn-submit">
                    Solicitar Cita
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Citas Programadas</h2>

            {citas.length === 0 ? (
              <div className="empty-state">
                <div className="text-6xl mb-4">Calendar</div>
                <p className="text-xl text-gray-600 font-medium">No tienes citas programadas</p>
                <p className="text-gray-500 mt-2">¡Solicita tu primera cita con el botón de arriba!</p>
              </div>
            ) : (
              <div className="appointments-list">
                {citas.map(cita => (
                  <div key={cita.id} className="appointment-card">
                    <div className="appointment-header">
                      <div>
                        <h3 className="doctor-name">{cita.medico_name}</h3>
                        <div className="appointment-details">
                          <p><strong>Motivo:</strong> {cita.motivo}</p>
                          <p><strong>Fecha:</strong> {format(new Date(cita.fecha_hora), "PPP 'a las' p", { locale: es })}</p>
                          {cita.created_at && (
                            <p className="text-sm text-gray-500 mt-2">
                              Solicitada el {format(new Date(cita.created_at), "dd/MM/yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-3">
                        <span className={`status-badge status-${cita.estado}`}>
                          {getEstadoText(cita.estado)}
                        </span>
                        {cita.estado === 'pendiente' && (
                          <button
                            onClick={() => cancelarCita(cita.id)}
                            className="cancel-btn"
                          >
                            Cancelar cita
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="info-box">
          <h3>Información importante</h3>
          <ul>
            <li>Las citas canceladas no pueden ser reactivadas</li>
            <li>Llega 15 minutos antes de tu cita programada</li>
            <li>Puedes cancelar citas pendientes hasta 24 horas antes</li>
          </ul>
        </div>

      </div>
    </div>
  );
}