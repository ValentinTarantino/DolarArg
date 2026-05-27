"use client";

import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, LogOut, User, Lock, Mail, Trash2, CheckCircle, Clock } from 'lucide-react';

interface Alert {
  id: number;
  casa: string;
  condition: string;
  value: number;
  isTriggered: boolean;
  createdAt: string;
}

interface AlertSettingsProps {
  rates: { casa: string; nombre: string; venta: number }[];
}

const AlertSettings: React.FC<AlertSettingsProps> = ({ rates }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Alertas
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCasa, setAlertCasa] = useState<string>('blue');
  const [alertCondition, setAlertCondition] = useState<string>('ABOVE');
  const [alertValue, setAlertValue] = useState<string>('');
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al autenticar');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setAuthError('Registro exitoso. Por favor inicia sesión.');
        setPassword('');
      } else {
        setUser(data.user);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setAlerts([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);

    if (!alertValue) {
      setAlertError('Por favor ingresa un precio objetivo');
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casa: alertCasa,
          condition: alertCondition,
          value: alertValue
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear alerta');
      }

      setAlertSuccess('¡Alerta creada con éxito!');
      setAlertValue('');
      fetchAlerts();
    } catch (err: any) {
      setAlertError(err.message);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDolarName = (casa: string) => {
    return rates.find(r => r.casa === casa)?.nombre || casa;
  };

  if (loading) {
    return (
      <div className="panel">
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Cargando configuración de alertas...
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">
        <Bell size={22} />
        <span>Configuración de Alertas</span>
      </div>

      {!user ? (
        <div className="auth-panel">
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px' }}>
            Regístrate o inicia sesión para recibir alertas en tiempo real cuando el dólar alcance tu precio objetivo.
          </p>

          <form onSubmit={handleAuth} className="calculator-form" id="auth-form">
            <div className="input-container">
              <label>Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{ paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>

            <div className="input-container">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>

            {authError && (
              <div style={{ color: authError.includes('exitoso') ? '#10b981' : '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>
                {authError}
              </div>
            )}

            <button type="submit" className="btn-primary" id="auth-submit-btn">
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError(null);
              }}
              style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '0.85rem', color: '#6366f1' }}
              id="auth-toggle-btn"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
              id="logout-btn"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>

          <form onSubmit={handleCreateAlert} className="calculator-form" id="create-alert-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-container">
                <label>Dólar</label>
                <div className="input-wrapper">
                  <select
                    id="alert-casa-select"
                    value={alertCasa}
                    onChange={(e) => setAlertCasa(e.target.value)}
                  >
                    {rates.map(r => (
                      <option key={r.casa} value={r.casa}>
                        Dólar {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-container">
                <label>Condición</label>
                <div className="input-wrapper">
                  <select
                    id="alert-condition-select"
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value)}
                  >
                    <option value="ABOVE">Cuando supere o sea igual a (≥)</option>
                    <option value="BELOW">Cuando caiga o sea igual a (≤)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="input-container">
              <label>Precio Objetivo (Venta)</label>
              <div className="input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  id="alert-value-input"
                  type="number"
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                  placeholder="Precio a alertar"
                  min="0"
                />
              </div>
            </div>

            {alertError && <div style={{ color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>{alertError}</div>}
            {alertSuccess && <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{alertSuccess}</div>}

            <button type="submit" className="btn-primary" id="create-alert-btn">Crear Alerta</button>
          </form>

          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>Tus Alertas</h4>
            {alerts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '15px' }}>
                Aún no tienes alertas configuradas.
              </p>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`alert-item ${alert.isTriggered ? 'triggered' : ''}`}>
                    <div className="alert-info">
                      <span className="config">
                        {getDolarName(alert.casa)} {alert.condition === 'ABOVE' ? '≥' : '≤'} ${alert.value}
                      </span>
                      <span className="status">
                        {alert.isTriggered ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e' }}>
                            <CheckCircle size={12} /> Disparada
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                            <Clock size={12} /> Activa
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="delete-btn"
                      title="Eliminar alerta"
                      id={`delete-alert-${alert.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;
