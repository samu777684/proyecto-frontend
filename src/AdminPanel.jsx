// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './AdminPanel.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminPanel({ token, logout, api }) {
  const [activeTab, setActiveTab] = useState('citas');
  const [citas, setCitas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros para citas
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  const cargarDatos = async () => {
    try {
      const [resCitas, resUsers] = await Promise.all([
        axios.get(`${api}/api/admin/citas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${api}/api/admin/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCitas(resCitas.data);
      setUsuarios(resUsers.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
      else alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // CORREGIDO: Función para actualizar estado de cita usando ruta correcta
  const cambiarEstadoCita = async (id, nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    
    try {
      // Usamos el endpoint correcto basado en las rutas del backend
      let endpoint;
      let data = {};
      
      if (nuevoEstado === 'cancelada') {
        endpoint = `${api}/api/citas/cancelar/${id}`;
        // Para cancelar, no necesitamos enviar datos adicionales
        await axios.put(endpoint, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Para otros estados, necesitamos crear una ruta nueva o usar diferente enfoque
        // Como el backend solo tiene /cancelar/:id, necesitamos implementar una nueva ruta
        // Por ahora, usaremos un método alternativo:
        endpoint = `${api}/api/admin/citas/${id}/estado`;
        data = { estado: nuevoEstado };
        
        await axios.put(endpoint, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      cargarDatos();
      alert('Cita actualizada');
    } catch (err) {
      console.error('Error actualizando cita:', err);
      alert(err.response?.data?.msg || 'Error al actualizar la cita');
    }
  };

  // Cambiar rol de usuario
  const cambiarRol = async (userId, nuevoRol) => {
    if (!confirm('¿Cambiar rol de este usuario?')) return;
    try {
      await axios.put(`${api}/api/admin/usuario/${userId}/rol`, { role: nuevoRol }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarDatos();
    } catch (err) {
      alert('Error al cambiar rol');
    }
  };

  // Eliminar usuario (con precaución)
  const eliminarUsuario = async (userId) => {
    if (!confirm('¡PELIGRO! Esto eliminará al usuario y todas sus citas. ¿Continuar?')) return;
    try {
      await axios.delete(`${api}/api/admin/usuario/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarDatos();
      alert('Usuario eliminado');
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const citasFiltradas = citas.filter(cita => {
    if (filtroEstado !== 'todas' && cita.estado !== filtroEstado) return false;
    if (filtroMedico && !cita.medico_name.toLowerCase().includes(filtroMedico.toLowerCase())) return false;
    if (filtroPaciente && !cita.paciente_name.toLowerCase().includes(filtroPaciente.toLowerCase())) return false;
    return true;
  });

  const getEstadoBadge = (estado) => {
    const claseEstado = `status-badge-admin status-${estado}`;
    const textoEstado = estado.charAt(0).toUpperCase() + estado.slice(1);
    return <span className={claseEstado}>{textoEstado}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      {/* Header */}
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

      {/* Tabs */}
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

        {/* Contenido */}
        <div className="tab-content">
          {activeTab === 'citas' && (
            <div>
              {/* Filtros */}
              <div className="filters-container">
                <div className="filter-group">
                  <label htmlFor="estado">Estado</label>
                  <select
                    id="estado"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="todas">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="atendida">Atendida</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="medico">Buscar médico</label>
                  <input
                    id="medico"
                    type="text"
                    placeholder="Nombre del médico..."
                    value={filtroMedico}
                    onChange={(e) => setFiltroMedico(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="paciente">Buscar paciente</label>
                  <input
                    id="paciente"
                    type="text"
                    placeholder="Nombre del paciente..."
                    value={filtroPaciente}
                    onChange={(e) => setFiltroPaciente(e.target.value)}
                  />
                </div>
              </div>

              {/* Tabla de citas */}
              <div className="overflow-x-auto">
                {citasFiltradas.length === 0 ? (
                  <div className="empty-state-admin">
                    <p>No se encontraron citas con los filtros aplicados</p>
                  </div>
                ) : (
                  <table className="citas-table">
                    <thead className="table-header">
                      <tr>
                        <th>Paciente</th>
                        <th>Médico</th>
                        <th>Fecha y Hora</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {citasFiltradas.map((cita) => (
                        <tr key={cita.id}>
                          <td className="font-medium">{cita.paciente_name}</td>
                          <td>{cita.medico_name}</td>
                          <td>
                            {format(new Date(cita.fecha_hora), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                          </td>
                          <td className="max-w-xs truncate">{cita.motivo}</td>
                          <td>
                            {getEstadoBadge(cita.estado)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {cita.estado === 'pendiente' && (
                                <>
                                  <button 
                                    onClick={() => cambiarEstadoCita(cita.id, 'confirmada')} 
                                    className="btn-action btn-confirm"
                                  >
                                    Confirmar
                                  </button>
                                  <button 
                                    onClick={() => cambiarEstadoCita(cita.id, 'cancelada')} 
                                    className="btn-action btn-cancel"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {cita.estado === 'confirmada' && (
                                <button 
                                  onClick={() => cambiarEstadoCita(cita.id, 'atendida')} 
                                  className="btn-action btn-attend"
                                >
                                  Marcar atendida
                                </button>
                              )}
                              {/* Para citas canceladas, permitir restaurar a pendiente */}
                              {cita.estado === 'cancelada' && (
                                <button 
                                  onClick={() => cambiarEstadoCita(cita.id, 'pendiente')} 
                                  className="btn-action btn-confirm"
                                >
                                  Restaurar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="overflow-x-auto">
              {usuarios.length === 0 ? (
                <div className="empty-state-admin">
                  <p>No hay usuarios registrados</p>
                </div>
              ) : (
                <table className="usuarios-table">
                  <thead className="table-header">
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {usuarios.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium">{user.fullName}</td>
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
                            <button
                              onClick={() => eliminarUsuario(user.id)}
                              className="btn-delete-user"
                            >
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