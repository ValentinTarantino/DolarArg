"use client";

import React, { useState, useEffect } from 'react';
import { Bell, LogOut, User, Lock, Mail, Trash2, CheckCircle, Clock, ArrowLeft, KeyRound } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

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
  const { t } = useLanguage();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [view, setView] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCasa, setAlertCasa] = useState<string>('blue');
  const [alertCondition, setAlertCondition] = useState<string>('ABOVE');
  const [alertValue, setAlertValue] = useState<string>('');
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('reset_token');
      if (token) {
        setResetToken(token);
        setView('reset');
      }
    }
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
        setAuthError(t('Registro exitoso. Por favor inicia sesión.'));
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMsg(null);
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotMsg(data.message);
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMsg(null);
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetMsg(data.message);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setView('auth');
        setResetToken(null);
        setNewPassword('');
      }, 2500);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
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
          value: alertValue.includes(',')
            ? alertValue.replace(/\./g, '').replace(',', '.')
            : alertValue
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear alerta');
      }

      setAlertSuccess(t('¡Alerta creada con éxito!'));
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
          {t('Cargando configuración de alertas...')}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">
        <span>{t('Configuración de Alertas')}</span>
      </div>

      {!user ? (
        <div className="auth-panel">
          {view === 'forgot' ? (
            <>
              <button onClick={() => { setView('auth'); setForgotMsg(null); setForgotError(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                <ArrowLeft size={14} /> Volver
              </button>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <KeyRound size={32} style={{ color: '#6366f1', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#f1f5f9' }}>{t('¿Olvidaste tu contraseña?')}</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{t('Ingresá tu email y te enviamos un enlace para restablecerla.')}</p>
              </div>
              {!forgotMsg ? (
                <form onSubmit={handleForgotPassword} className="calculator-form">
                  <div className="input-container">
                    <label>Correo Electrónico</label>
                    <div className="input-wrapper">
                      <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder={t('ejemplo@correo.com')} style={{ paddingLeft: '38px' }} required />
                    </div>
                  </div>
                  {forgotError && <div style={{ color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>{forgotError}</div>}
                  <button type="submit" className="btn-primary" disabled={forgotLoading}>{forgotLoading ? 'Enviando...' : 'Enviar enlace'}</button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{t(forgotMsg)}</div>
              )}
            </>
          ) : view === 'reset' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <KeyRound size={32} style={{ color: '#6366f1', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#f1f5f9' }}>{t('Nueva contraseña')}</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{t('Ingresá tu nueva contraseña.')}</p>
              </div>
              {!resetMsg ? (
                <form onSubmit={handleResetPassword} className="calculator-form">
                  <div className="input-container">
                    <label>{t('Nueva contraseña')}</label>
                    <div className="input-wrapper">
                      <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: '38px' }} required minLength={6} />
                    </div>
                  </div>
                  {resetError && <div style={{ color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>{resetError}</div>}
                  <button type="submit" className="btn-primary" disabled={resetLoading}>{resetLoading ? t('Guardando...') : t('Guardar contraseña')}</button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{resetMsg}</div>
              )}
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#f1f5f9' }}>
                {isRegistering ? t('Crear cuenta') : t('Iniciar Sesión')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px' }}>
                {t('Regístrate o inicia sesión para recibir alertas en tiempo real cuando el dólar alcance tu precio objetivo.')}
              </p>
              <form onSubmit={handleAuth} className="calculator-form" id="auth-form">
                <div className="input-container">
                  <label>{t('Correo Electrónico')}</label>
                  <div className="input-wrapper">
                    <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                    <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('ejemplo@correo.com')} style={{ paddingLeft: '38px' }} required />
                  </div>
                </div>
                <div className="input-container">
                  <label>{t('Contraseña')}</label>
                  <div className="input-wrapper">
                    <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                    <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: '38px' }} required />
                  </div>
                </div>
                {authError && (
                  <div style={{ color: authError.includes('exitoso') ? '#10b981' : '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>{authError}</div>
                )}
                <button type="submit" className="btn-primary" id="auth-submit-btn">{isRegistering ? t('Registrarse') : t('Iniciar Sesión')}</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '0.82rem', color: '#6366f1', cursor: 'pointer' }} id="auth-toggle-btn">
                    {isRegistering ? t('¿Ya tenés cuenta? Iniciá sesión') : t('¿No tenés cuenta? Registrate')}
                  </button>
                  {!isRegistering && (
                    <button type="button" onClick={() => { setView('forgot'); setForgotMsg(null); setForgotError(null); }} style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
                      {t('¿Olvidaste tu contraseña?')}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
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
                <label>{t('Dólar')}</label>
                <div className="input-wrapper">
                  <select
                    id="alert-casa-select"
                    value={alertCasa}
                    onChange={(e) => setAlertCasa(e.target.value)}
                  >
                    {rates.map(r => (
                      <option key={r.casa} value={r.casa}>
                        {`${t('Dólar')} ${t(r.nombre)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-container">
                <label>{t('Condición')}</label>
                <div className="input-wrapper">
                  <select
                    id="alert-condition-select"
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value)}
                  >
                    <option value="ABOVE">{t('Cuando supere o sea igual a (≥)')}</option>
                    <option value="BELOW">{t('Cuando caiga o sea igual a (≤)')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="input-container">
              <label>{t('Precio Objetivo (Venta)')}</label>
              <div className="input-wrapper">
                <input
                  id="alert-value-input"
                  type="text"
                  inputMode="decimal"
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="Ej: 1500 o 1.500,50"
                />
              </div>
            </div>

            {alertError && <div style={{ color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>{alertError}</div>}
            {alertSuccess && <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{alertSuccess}</div>}

            <button type="submit" className="btn-primary" id="create-alert-btn">{t('Crear Alerta')}</button>
          </form>

          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>{t('Tus Alertas')}</h4>
            {alerts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '15px' }}>
                {t('Aún no tienes alertas configuradas.')}
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
