// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './AdminPanel.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminPanel({ token, logout }) {
  const [activeTab, setActiveTab] = useState('citas');
  const [citas, setCitas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCitas, resUsers] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/citas`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/admin/usuarios`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCitas(resCitas.data || []);
      setUsuarios(resUsers.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      if (err.response?.status === 401) {
        alert('Sesión expirada');
        logout();
      } else {
        alert('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line
  }, []);

  // Cambiar estado de cita (pendiente → confirmada → atendida | cancelada)
  const cambiarEstadoCita = async (id, nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;

    try {
      let endpoint = '';
      let method = 'put';
      let data = {};

      if (nuevoEstado === 'cancelada') {
        endpoint = `${API_BASE}/api/citas/cancelar/${id}`;
      } else if (nuevoEstado === 'confirmada' || nuevoEstado === 'atendida') {
        endpoint = `${API_BASE}/api/admin/citas/${id}/estado`;
        data = { estado: nuevoEstado };
      } else if (nuevoEstado === 'pendiente') {
        // Restaurar cita cancelada
        endpoint = `${API_BASE}/api/admin/citas/${id}/estado`;
        data = { estado: 'pendiente' };
      }

      await axios({ method, url: endpoint, data, headers: { Authorization: `Bearer ${token}` } });
      
      cargarDatos();
      alert('Estado actualizado correctamente');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error al actualizar la cita');
    }
  };

  // Cambiar rol de usuario
  const cambiarRol = async (userId, nuevoRol) => {
    if (!window.confirm('¿Estás seguro de cambiar el rol?')) return;

    try {
      await axios.put(
        `${API_BASE}/api/admin/usuario/${userId}/rol`,
        { role: nuevoRol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cargarDatos();
      alert('Rol actualizado');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al cambiar rol');
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (userId) => {
    if (!window.confirm('¡PELIGRO! Esto eliminará al usuario y TODAS sus citas. ¿Continuar?')) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/usuario/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarDatos();
      alert('Usuario eliminado');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al eliminar');
    }
  };

  // Filtrar citas
  const citasFiltradas = citas.filter(cita => {
    if (filtroEstado !== 'todas' && cita.estado !== filtroEstado) return false;
    if (filtroMedico && !cita.medico_name?.toLowerCase().includes(filtroMedico.toLowerCase())) return false;
    if (filtroPaciente && !cita.paciente_name?.toLowerCase().includes(filtroPaciente.toLowerCase())) return false;
    return true;
  });

  const getEstadoBadge = (estado) => {
    const clases = {
      pendiente: 'status-pendiente',
      confirmada: 'status-confirmada',
      atendida: 'status-atendida',
      cancelada: 'status-cancelada'
    };
    const texto = estado.charAt(0).toUpperCase() + estado.slice(1);
    return <span className={`status-badge-admin ${clases[estado] || ''}`}>{texto}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-title-section">
          <div>
            <h1 className="admin-title">Panel de Administración</h1>
            <p className="admin-subtitle">Gestión completa del consultorio médico</p>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="admin-tabs-container">
        <div className="tabs-navigation">
          <button
            onClick={() => setActiveTab('citas')}
            className={`tab-button ${activeTab === 'citas' ? 'active' : ''}`}
          >
            Citas ({citas.length})
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
          >
            Usuarios ({usuarios.length})
          </button>
        </div>

        <div className="tab-content">
          {/* Pestaña Citas */}
          {activeTab === 'citas' && (
            <div>
              <div className="filters-container">
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  <option value="todas">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="atendida">Atendida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <input
                  type="text"
                  placeholder="Buscar médico..."
                  value={filtroMedico}
                  onChange={(e) => setFiltroMedico(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={filtroPaciente}
                  onChange={(e) => setFiltroPaciente(e.target.value)}
                />
              </div>

              {citasFiltradas.length === 0 ? (
                <p className="empty-state-admin">No hay citas con estos filtros</p>
              ) : (
                <div className="table-responsive">
                  <table className="citas-table">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Médico</th>
                        <th>Fecha y Hora</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasFiltradas.map((cita) => (
                        <tr key={cita.id}>
                          <td><strong>{cita.paciente_name}</strong></td>
                          <td>{cita.medico_name}</td>
                          <td>{format(new Date(cita.fecha_hora), "dd MMM yyyy 'a las' HH:mm", { locale: es })}</td>
                          <td>{cita.motivo}</td>
                          <td>{getEstadoBadge(cita.estado)}</td>
                          <td>
                            <div className="action-buttons">
                              {cita.estado === 'pendiente' && (
                                <>
                                  <button onClick={() => cambiarEstadoCita(cita.id, 'confirmada')} className="btn-small btn-confirm">
                                    Confirmar
                                  </button>
                                  <button onClick={() => cambiarEstadoCita(cita.id, 'cancelada')} className="btn-small btn-cancel">
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {cita.estado === 'confirmada' && (
                                <button onClick={() => cambiarEstadoCita(cita.id, 'atendida')} className="btn-small btn-attend">
                                  Atendida
                                </button>
                              )}
                              {cita.estado === 'cancelada' && (
                                <button onClick={() => cambiarEstadoCita(cita.id, 'pendiente')} className="btn-small btn-confirm">
                                  Restaurar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pestaña Usuarios */}
          {activeTab === 'usuarios' && (
            <div className="table-responsive">
              {usuarios.length === 0 ? (
                <p className="empty-state-admin">No hay usuarios</p>
              ) : (
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user) => (
                      <tr key={user.id}>
                        <td><strong>{user.fullName}</strong></td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => cambiarRol(user.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="user">Paciente</option>
                            <option value="doctor">Médico</option>
                            <option value="recepcion">Recepción</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td>
                          {user.role !== 'admin' && (
                            <button onClick={() => eliminarUsuario(user.id)} className="btn-delete-user">
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}