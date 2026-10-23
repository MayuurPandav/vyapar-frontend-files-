import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function BroadcastAdmin() {
  const { viewOnly } = useApp();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState({
    admin: true,
    delivery: false,
    staff: false,
    accountant: false,
  });

  // Preview state
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewSample, setPreviewSample] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch announcements history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/super/announcements');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          // Sort by createdAt descending
          const sorted = (data.announcements || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setAnnouncements(sorted);
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcement history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch live preview of recipients
  const fetchPreview = async () => {
    const selectedRoles = Object.keys(roles).filter((r) => roles[r]);
    if (selectedRoles.length === 0) {
      setPreviewTotal(0);
      setPreviewSample([]);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/notifications/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { roles: selectedRoles },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setPreviewTotal(data.total || 0);
          setPreviewSample(data.sample || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recipient preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Update preview when roles selection change
  useEffect(() => {
    fetchPreview();
  }, [roles]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRoleToggle = (roleKey) => {
    setRoles((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (viewOnly) {
      return alert('⛔ VIEW-ONLY Mode: Broadcast blocked.');
    }

    const selectedRoles = Object.keys(roles).filter((r) => roles[r]);
    if (selectedRoles.length === 0) {
      return alert('Please select at least one recipient role.');
    }

    if (!title.trim() || !message.trim()) {
      return alert('Title and Message body are required.');
    }

    if (!await window.confirm(`Are you sure you want to broadcast this message to ${previewTotal} recipient(s)?`)) {
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/super/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          immediate: true,
          channels: ['in-app'],
          filters: { roles: selectedRoles },
          actor: 'Super Admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          alert('🚀 Broadcast successfully dispatched to recipients!');
          setTitle('');
          setMessage('');
          fetchHistory();
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        alert('Server returned an error. Failed to broadcast.');
      }
    } catch (err) {
      console.error('Broadcast send error:', err);
      alert('Failed to send broadcast due to a network or server error.');
    } finally {
      setSending(false);
    }
  };

  const handleRecall = async (id, title) => {
    if (viewOnly) {
      return alert('⛔ VIEW-ONLY Mode: Action blocked.');
    }
    if (!await window.confirm(`Are you sure you want to recall/delete the broadcast "${title}"?\n\nThis will completely remove it from the database and stop showing unread notifications to Delivery, Staff, Admin, and Accountant users.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/super/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Super Admin' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          alert('🚀 Broadcast successfully recalled and removed!');
          fetchHistory();
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        alert('Server returned an error. Failed to recall broadcast.');
      }
    } catch (err) {
      console.error('Recall error:', err);
      alert('Failed to recall broadcast due to a network or server error.');
    }
  };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      {/* Header section with elegant typography */}
      <div className="sec-header sec-header--row" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-bullhorn" style={{ color: '#3b82f6' }}></i> Broadcast Control Center
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '4px' }}>
            Dispatch real-time in-app messages and notifications to Shop Owners, Delivery Boys, Cashiers, and Accountants.
          </p>
        </div>
        <button className="btn btn--outline" onClick={fetchHistory} disabled={historyLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className={`fas fa-rotate ${historyLoading ? 'fa-spin' : ''}`}></i> Refresh History
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Form Container */}
        <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-1)', borderBottom: '1px dashed var(--border)', paddingBottom: '12px' }}>
            Compose Announcement
          </h3>
          <form onSubmit={handleSend}>
            <div className="fg" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Broadcast Title *</label>
              <input
                type="text"
                className="fi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Upgrade Scheduled"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="fg" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Message Body *</label>
              <textarea
                className="fi"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your broadcast message details here..."
                required
                rows={5}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Role Filter Checkboxes */}
            <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-users-gear"></i> Target Recipient Roles
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.keys(roles).map((role) => (
                  <label
                    key={role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${roles[role] ? '#3b82f6' : 'var(--border)'}`,
                      background: roles[role] ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: roles[role] ? '600' : '400',
                      color: roles[role] ? '#2563eb' : 'var(--text-2)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={roles[role]}
                      onChange={() => handleRoleToggle(role)}
                      style={{ cursor: 'pointer' }}
                    />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Recipient Live Estimate Count Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <div style={{ fontSize: '20px', color: '#10b981' }}>
                {previewLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-users"></i>}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Target Recipients</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-1)' }}>
                  {previewTotal} user{previewTotal !== 1 ? 's' : ''} matched
                </div>
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="btn btn--primary"
              disabled={sending || previewTotal === 0}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
              }}
            >
              {sending ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Broadcasting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Send Real-time Broadcast
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Sample Preview & History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Sample matched recipients */}
          {previewTotal > 0 && previewSample.length > 0 && (
            <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-eye" style={{ color: 'var(--blue)' }}></i> Recipient Sample Preview (showing up to 10)
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                {previewSample.slice(0, 10).map((usr, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <i className="fas fa-user-tag" style={{ color: 'var(--text-3)', fontSize: '9px' }}></i>
                    {usr.username}
                  </span>
                ))}
                {previewTotal > 10 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', alignSelf: 'center', fontWeight: 'bold' }}>
                    + {previewTotal - 10} more...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* History List */}
          <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-1)', borderBottom: '1px dashed var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Broadcast Log History</span>
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-3)' }}>
                Total: {announcements.length} sent
              </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                  <i className="fas fa-circle-notch fa-spin fa-2x" style={{ marginBottom: '12px', color: '#3b82f6' }}></i>
                  <p>Loading historical broadcasts...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px var(--border)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-3)' }}>
                  <i className="fas fa-folder-open fa-3x" style={{ color: 'var(--border)', marginBottom: '12px' }}></i>
                  <p>No broadcast history found. Compose a message and send it to begin.</p>
                </div>
              ) : (
                announcements.map((ann, idx) => {
                  const targetRoles = ann.filters?.roles || [];
                  const dateStr = new Date(ann.createdAt).toLocaleString();
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-input)',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>
                          {ann.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{dateStr}</span>
                          <button
                            onClick={() => handleRecall(ann._id, ann.title)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s',
                              fontWeight: '600'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="Recall/Delete Broadcast Message"
                          >
                            <i className="fas fa-trash-can"></i> Recall
                          </button>
                        </div>
                      </div>
                      
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {ann.message}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {targetRoles.map((role) => (
                            <span
                              key={role}
                              className="badge"
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                fontWeight: '700',
                                backgroundColor:
                                  role === 'admin'
                                    ? 'rgba(59, 130, 246, 0.12)'
                                    : role === 'delivery'
                                    ? 'rgba(245, 158, 11, 0.12)'
                                    : role === 'staff'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : 'rgba(139, 92, 246, 0.12)',
                                color:
                                  role === 'admin'
                                    ? '#2563eb'
                                    : role === 'delivery'
                                    ? '#d97706'
                                    : role === 'staff'
                                    ? '#10b981'
                                    : '#7c3aed',
                                border: `1px solid ${
                                  role === 'admin'
                                    ? 'rgba(59, 130, 246, 0.2)'
                                    : role === 'delivery'
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : role === 'staff'
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(139, 92, 246, 0.2)'
                                }`,
                              }}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                        
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-3)' }}>
                          Recipients: <span style={{ color: 'var(--text-1)' }}>{ann.queuedCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
