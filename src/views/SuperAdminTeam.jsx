import React, { useState, useEffect } from 'react';
import { 
  Shield, UserPlus, Key, Activity, Clock, Trash2, 
  Settings, LogOut, CheckCircle, XCircle 
} from 'lucide-react';

const SuperAdminTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  
  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Detail Modal States
  const [memberActivity, setMemberActivity] = useState([]);
  const [memberSessions, setMemberSessions] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    subRole: 'Support Staff',
    enforce2FA: false
  });

  const subRoles = [
    { name: 'Billing Manager', desc: 'Manage payments, subscriptions, and revenue.' },
    { name: 'Support Staff', desc: 'Handle tickets, FAQs, and chat.' },
    { name: 'Analytics Viewer', desc: 'Read-only access to platform reports.' },
    { name: 'Content Manager', desc: 'Manage announcements and offers.' },
    { name: 'Technical Manager', desc: 'API keys, webhooks, DB health.' }
  ];

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/team');
      const j = await res.json();
      if (j.data) setTeam(j.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const url = formData._id ? `/api/super/team/${formData.username}` : '/api/super/team';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const j = await res.json();
      if (j.status === 'success') {
        fetchTeam();
        setShowMemberModal(false);
      } else {
        alert(j.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (username) => {
    if (!await window.confirm(`Remove ${username} from the Super Admin team?`)) return;
    try {
      await fetch(`/api/super/team/${username}`, { method: 'DELETE' });
      fetchTeam();
    } catch (e) {}
  };

  const fetchMemberDetails = async (username) => {
    try {
      const actRes = await fetch(`/api/super/team/${username}/activity`);
      const act = await actRes.json();
      if (act.data) setMemberActivity(act.data);

      const sessRes = await fetch(`/api/super/team/${username}/sessions`);
      const sess = await sessRes.json();
      if (sess.data) setMemberSessions(sess.data);
    } catch (e) {}
  };

  const openDetails = (member) => {
    setSelectedMember(member);
    setMemberActivity([]);
    setMemberSessions([]);
    setShowDetailModal(true);
    fetchMemberDetails(member.username);
  };

  const terminateSession = async (sessionId) => {
    if (!await window.confirm("Terminate this session?")) return;
    try {
      await fetch(`/api/super/team/${selectedMember.username}/sessions/${sessionId}`, { method: 'DELETE' });
      fetchMemberDetails(selectedMember.username);
    } catch (e) {}
  };

  const toggle2FA = async (username, currentVal) => {
    try {
      await fetch(`/api/super/team/${username}/2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enforce2FA: !currentVal })
      });
      fetchTeam();
    } catch (e) {}
  };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="topbar__left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={24} style={{ color: '#3b82f6' }} />
            Team Management
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Manage Super Admin staff, roles, and security policies.
          </p>
        </div>
        <div className="topbar__right">
          <button 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            onClick={() => {
              setFormData({ username: '', name: '', password: '', subRole: 'Support Staff', enforce2FA: false });
              setShowMemberModal(true);
            }}
          >
            <UserPlus size={16} /> Add Team Member
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          style={{
            background: 'none', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
            color: activeTab === 'members' ? 'var(--accent)' : 'var(--text-2)',
            borderBottom: activeTab === 'members' ? '2px solid var(--accent)' : 'none',
            paddingBottom: '4px'
          }}
          onClick={() => setActiveTab('members')}
        >
          Team Members
        </button>
        <button
          style={{
            background: 'none', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
            color: activeTab === 'roles' ? 'var(--accent)' : 'var(--text-2)',
            borderBottom: activeTab === 'roles' ? '2px solid var(--accent)' : 'none',
            paddingBottom: '4px'
          }}
          onClick={() => setActiveTab('roles')}
        >
          Sub-Role Permissions
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-input)' }}>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Admin Info</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Sub-Role</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Security (2FA)</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Last Login</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{member.name || member.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{member.username}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {member.subRole || 'Super Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => toggle2FA(member.username, member.enforce2FA)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                        background: member.enforce2FA ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: member.enforce2FA ? '#10b981' : '#ef4444',
                        borderColor: member.enforce2FA ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      <Key size={14} />
                      {member.enforce2FA ? 'Enforced' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-3)', fontSize: '13px' }}>
                    {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => openDetails(member)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6' }} title="Activity">
                        <Activity size={18} />
                      </button>
                      <button onClick={() => { setFormData(member); setShowMemberModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title="Edit">
                        <Settings size={18} />
                      </button>
                      <button onClick={() => handleDelete(member.username)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {team.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>No team members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {subRoles.map((role) => (
            <div key={role.name} className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>{role.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', minHeight: '38px' }}>{role.desc}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>View Data</span>
                  <CheckCircle size={16} color="#10b981" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Modify Settings</span>
                  {role.name === 'Technical Manager' || role.name === 'Billing Manager' ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Delete Records</span>
                  {role.name === 'Support Staff' || role.name === 'Analytics Viewer' ? <XCircle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#10b981" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showMemberModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{formData._id ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button onClick={() => setShowMemberModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '20px' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveMember} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Username (Email)</label>
                <input type="email" required disabled={!!formData._id} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-1)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-1)' }} />
              </div>
              {!formData._id && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-1)' }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-2)' }}>Sub-Role</label>
                <select value={formData.subRole} onChange={e => setFormData({...formData, subRole: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-1)' }}>
                  <option value="Super Admin">Full Super Admin</option>
                  {subRoles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                <input type="checkbox" checked={formData.enforce2FA} onChange={e => setFormData({...formData, enforce2FA: e.target.checked})} />
                <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Require 2FA on Login</span>
              </label>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn" style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-1)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} color="#3b82f6" /> {selectedMember.name} - Activity & Sessions</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{selectedMember.subRole || 'Super Admin'}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '24px' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Sessions */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '12px' }}>Active Sessions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {memberSessions.map((s, i) => (
                    <div key={i} style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{s.ip}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.device}</div>
                        <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {new Date(s.timestamp).toLocaleString()}</div>
                      </div>
                      <button onClick={() => terminateSession(s._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Terminate">
                        <LogOut size={16} />
                      </button>
                    </div>
                  ))}
                  {memberSessions.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic' }}>No active sessions.</p>}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>Audit Log</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Last 50 actions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {memberActivity.map((log, i) => (
                    <div key={i} style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>{log.action}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{log.details}</div>
                    </div>
                  ))}
                  {memberActivity.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic' }}>No recent activity.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTeam;
