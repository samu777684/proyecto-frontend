// src/components/PatientPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './PatientPanel.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function PatientPanel({ token, logout }) {
  const [citas, setCitas] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    medico_id: '',
    fecha_hora: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(true);

  const cargarCitas = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/citas/mis-citas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCitas(res.data || []);
    } catch (err) {
      console.error('Error al cargar citas:', err);
      if (err.response?.status === 401) {
        alert('Sesión expirada');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarMedicos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/citas/medicos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicos(res.data || []);
    } catch (err) {
      console.error('Error al cargar médicos:', err);
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarMedicos();
    // eslint-disable-next-line
  }, []);

  const handleCrearCita = async (e) => {
    e.preventDefault();
    
    if (!form.medico_id || !form.fecha_hora || !form.motivo.trim()) {
      alert('Completa todos los campos');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/citas/crear`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowForm(false);
      setForm({ medico_id: '', fecha_hora: '', motivo: '' });
      cargarCitas();
      alert('¡Cita solicitada con éxito! El médico la confirmará pronto.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error al solicitar la cita');
    }
  };

  const cancelarCita = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta cita?')) return;

    try {
      await axios.put(`${API_BASE}/api/citas/cancelar/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarCitas();
      alert('Cita cancelada correctamente');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al cancelar la cita');
    }
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      pendiente: 'status-pendiente',
      confirmada: 'status-confirmada',
      atendida: 'status-atendida',
      cancelada: 'status-cancelada'
    };
    const textos = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      atendida: 'Atendida',
      cancelada: 'Cancelada'
    };

    return (
      <span className={`status-badge ${clases[estado] || ''}`}>
        {textos[estado] || estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
          <p className="text-2xl font-semibold text-gray-700">Cargando tus citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-panel-container">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="panel-card">
          <div className="header-section">
            <div>
              <h1 className="title">Mis Citas Médicas</h1>
              <p className="subtitle">Gestiona tus turnos con el consultorio</p>
            </div>
            <button onClick={logout} className="logout-btn">
              Cerrar Sesión
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-new-appointment"
          >
            {showForm ? 'Ocultar Formulario' : '+ Solicitar Nueva Cita'}
          </button>

          {/* Formulario para nueva cita */}
          {showForm && (
            <div className="form-card">
              <h2 className="form-title">Solicitar Nueva Cita</h2>
              <form onSubmit={handleCrearCita} className="appointment-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Médico</label>
                    <select
                      required
                      value={form.medico_id}
                      onChange={(e) => setForm({ ...form, medico_id: e.target.value })}
                    >
                      <option value="">Seleccionar médico</option>
                      {medicos.length === 0 ? (
                        <option disabled>Cargando médicos...</option>
                      ) : (
                        medicos.map(medico => (
                          <option key={medico.id} value={medico.id}>
                            Dr/a. {medico.fullName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      value={form.fecha_hora}
                      onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Motivo de la consulta</label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Ej: Control anual, dolor de espalda, chequeo general..."
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

          {/* Lista de citas */}
          <div className="appointments-section">
            <h2 className="section-title">Mis Citas Programadas</h2>

            {citas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">Calendar</div>
                <h3>No tienes citas programadas</h3>
                <p>¡Solicita tu primera cita con el botón de arriba!</p>
              </div>
            ) : (
              <div className="appointments-list">
                {citas.map(cita => (
                  <div key={cita.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="doctor-info">
                        <h3>Dr/a. {cita.medico_name}</h3>
                        <p className="motivo"><strong>Motivo:</strong> {cita.motivo}</p>
                      </div>
                      <div className="appointment-meta">
                        <div className="date-time">
                          {format(new Date(cita.fecha_hora), "EEEE dd 'de' MMMM yyyy", { locale: es })}
                          <strong> a las {format(new Date(cita.fecha_hora), "HH:mm", { locale: es })}</strong>
                        </div>
                        {getEstadoBadge(cita.estado)}
                      </div>
                    </div>

                    <div className="appointment-footer">
                      {cita.estado === 'pendiente' && (
                        <button
                          onClick={() => cancelarCita(cita.id)}
                          className="cancel-btn"
                        >
                          Cancelar Cita
                        </button>
                      )}
                      {cita.estado === 'confirmada' && (
                        <p className="confirmed-note">Tu cita está confirmada</p>
                      )}
                      {cita.estado === 'atendida' && (
                        <p className="attended-note">Cita atendida</p>
                      )}
                      {cita.estado === 'cancelada' && (
                        <p className="cancelled-note">Cita cancelada</p>
                      )}
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
            <li>Las citas se confirman por el personal médico</li>
            <li>Puedes cancelar citas pendientes hasta 24 horas antes</li>
            <li>Llega 15 minutos antes de tu turno</li>
            <li>En caso de emergencia, comunicate directamente al consultorio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}