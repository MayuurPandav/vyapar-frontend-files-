import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ShopProfileManagement() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [profile, setProfile] = useState({});
  const [branches, setBranches] = useState([]);
  const [analytics, setAnalytics] = useState({ revenue: 0, invoices: 0, branches: 0, employees: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: '' }

  // Modals / Forms
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ id: '', name: '', contact: '', address: '', manager: '', status: 'Active' });

  // Analytics Modals / Lists
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [modalInvoices, setModalInvoices] = useState([]);
  const [modalEmployees, setModalEmployees] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Input forms state
  const [profileForm, setProfileForm] = useState({});
  const [settingsForm, setSettingsForm] = useState({});
  const [socialForm, setSocialForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, branchRes, analyticsRes] = await Promise.all([
        fetch('/api/super/shop-profile'),
        fetch('/api/super/shop-profile/branches'),
        fetch('/api/super/shop-profile/analytics')
      ]);

      if (profRes.ok) {
        const p = await profRes.json();
        setProfile(p);
        setProfileForm(p);
        setSettingsForm({
          financialYearStart: p.financialYearStart || '',
          financialYearEnd: p.financialYearEnd || '',
          openingTime: p?.workingHours?.openingTime || '',
          closingTime: p?.workingHours?.closingTime || '',
          weeklyHoliday: p.weeklyHoliday || '',
          language: p.languagePreference || 'English',
          currency: p.currencyPreference || 'INR'
        });
        setSocialForm({
          facebook: p?.socialMedia?.facebook || '',
          instagram: p?.socialMedia?.instagram || '',
          twitter: p?.socialMedia?.twitter || '',
          linkedin: p?.socialMedia?.linkedin || '',
          website: p?.socialMedia?.website || ''
        });
      }
      if (branchRes.ok) setBranches(await branchRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (err) {
      showToast('error', 'Failed to fetch shop profile data');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        if (logoFile) {
          const formData = new FormData();
          formData.append('logo', logoFile);
          await fetch('/api/super/shop-profile/logo', {
            method: 'POST',
            body: formData
          });
        }
        showToast('success', 'Profile updated successfully!');
        fetchData();
      } else {
        showToast('error', 'Failed to update profile');
      }
    } catch (err) {
      showToast('error', 'Error updating profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        showToast('success', 'Business settings updated!');
        fetchData();
      } else {
        showToast('error', 'Failed to update settings');
      }
    } catch (err) {
      showToast('error', 'Error updating settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/social-media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialForm)
      });
      if (res.ok) {
        showToast('success', 'Social media updated!');
        fetchData();
      } else {
        showToast('error', 'Failed to update social media');
      }
    } catch (err) {
      showToast('error', 'Error updating social media');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = branchForm.id ? `/api/super/shop-profile/branches/${branchForm.id}` : '/api/super/shop-profile/branches';
      const method = branchForm.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchForm)
      });
      
      if (res.ok) {
        showToast('success', `Branch ${branchForm.id ? 'updated' : 'added'} successfully!`);
        setShowBranchModal(false);
        fetchData();
      } else {
        showToast('error', 'Failed to save branch');
      }
    } catch (err) {
      showToast('error', 'Error saving branch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!await window.confirm('Are you sure you want to delete this branch?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/shop-profile/branches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Branch deleted successfully!');
        fetchData();
      } else {
        showToast('error', 'Failed to delete branch');
      }
    } catch (err) {
      showToast('error', 'Error deleting branch');
    } finally {
      setActionLoading(false);
    }
  };

  const openBranchModal = (branch = null) => {
    if (branch) {
      setBranchForm({ id: branch._id, name: branch.name, contact: branch.contact, address: branch.address, manager: branch.manager, status: branch.status });
    } else {
      setBranchForm({ id: '', name: '', contact: '', address: '', manager: '', status: 'Active' });
    }
    setShowBranchModal(true);
  };

  const handleOpenInvoicesModal = async () => {
    setShowInvoicesModal(true);
    setInvoicesLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/analytics/invoices');
      if (res.ok) {
        setModalInvoices(await res.json());
      } else {
        showToast('error', 'Failed to fetch invoices list');
      }
    } catch (err) {
      showToast('error', 'Error fetching invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleOpenEmployeesModal = async () => {
    setShowEmployeesModal(true);
    setEmployeesLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/analytics/employees');
      if (res.ok) {
        setModalEmployees(await res.json());
      } else {
        showToast('error', 'Failed to fetch employees list');
      }
    } catch (err) {
      showToast('error', 'Error fetching employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  // --- Renderers ---
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#f64e60' }}></i>
      </div>
    );
  }

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: '8px' }}></i>
          {toast.msg}
        </div>
      )}

      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Shop Profile Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>Manage central shop details, branches, and configurations.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Sidebar Nav for Shop Profile */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', background: '#fff', padding: '24px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', minHeight: '600px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '16px', paddingLeft: '12px' }}>Profile Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {[
              { id: 'dashboard', icon: 'fa-table-columns', label: 'Dashboard' },
              { id: 'edit', icon: 'fa-pen-to-square', label: 'Edit Profile' },
              { id: 'branches', icon: 'fa-code-branch', label: 'Branches' },
              { id: 'settings', icon: 'fa-sliders', label: 'Business Settings' },
              { id: 'social', icon: 'fa-share-nodes', label: 'Social Media' },
              { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none',
                  background: activeTab === tab.id ? 'rgba(246, 78, 96, 0.08)' : 'transparent',
                  color: activeTab === tab.id ? '#f64e60' : 'var(--text-2)',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--bg-input)' }}
                onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
              >
                <i className={`fas ${tab.icon}`} style={{ width: '24px', textAlign: 'center', fontSize: '16px' }}></i>
                {tab.label}
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fas fa-store" style={{ color: 'var(--text-3)', fontSize: '24px' }}></i>
            </div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-1)' }}>Shop Module</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>Manage your entire business identity centrally.</div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '36px' }}>
                <div className="card" onClick={() => setActiveTab('analytics')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                    <i className="fas fa-indian-rupee-sign"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-1)', marginTop: '4px' }}>₹{analytics.revenue.toLocaleString()}</div>
                  </div>
                </div>
                <div className="card" onClick={() => setActiveTab('analytics')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                    <i className="fas fa-file-invoice"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoices Generated</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-1)', marginTop: '4px' }}>{analytics.invoices.toLocaleString()}</div>
                  </div>
                </div>
                <div className="card" onClick={() => setActiveTab('branches')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                    <i className="fas fa-code-branch"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Branches</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-1)', marginTop: '4px' }}>{analytics.branches}</div>
                  </div>
                </div>
                <div className="card" onClick={() => setActiveTab('analytics')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(246, 78, 96, 0.1)', color: '#f64e60', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                    <i className="fas fa-users-viewfinder"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-1)', marginTop: '4px' }}>{analytics.customers}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{ flex: '1 1 500px', cursor: 'pointer', transition: 'all 0.3s' }} className="card" onClick={() => setActiveTab('edit')} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--blue)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Shop Information</h3>
                    <i className="fas fa-chevron-right" style={{ color: 'var(--text-3)' }}></i>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-image" style={{ color: 'var(--text-3)', fontSize: '28px' }}></i>
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-1)' }}>{profile.shopName || 'Business Name Not Set'}</div>
                      <div style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '4px' }}><i className="fas fa-tag" style={{marginRight: '6px', color: 'var(--text-3)'}}></i>{profile.shopType || 'Shop Type Not Set'}</div>
                      <div style={{ marginTop: '8px', fontSize: '13px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '20px', display: 'inline-block' }}><span style={{ color: 'var(--text-3)', fontWeight: '600' }}>Owner:</span> <span style={{fontWeight: '500'}}>{profile.ownerName || 'Not Set'}</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px', background: 'var(--bg-sidebar)', padding: '20px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>GSTIN</div>
                      <div style={{ fontWeight: '500' }}>{profile.gstin || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>PAN</div>
                      <div style={{ fontWeight: '500' }}>{profile.pan || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Registration No</div>
                      <div style={{ fontWeight: '500' }}>{profile.regNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>FSSAI</div>
                      <div style={{ fontWeight: '500' }}>{profile.fssai || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: '1 1 350px', cursor: 'pointer', transition: 'all 0.3s' }} className="card" onClick={() => setActiveTab('edit')} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--blue)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Contact & Address</h3>
                    <i className="fas fa-chevron-right" style={{ color: 'var(--text-3)' }}></i>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-input)', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}><i className="fas fa-envelope"></i></div>
                      <div style={{ fontWeight: '500' }}>{profile.email || 'No email provided'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-input)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}><i className="fas fa-phone"></i></div>
                      <div style={{ fontWeight: '500' }}>{profile.phone || 'No phone provided'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.1)', display: 'grid', placeItems: 'center', color: '#25D366' }}><i className="fab fa-whatsapp"></i></div>
                      <div style={{ fontWeight: '500' }}>{profile.whatsapp || 'No WhatsApp provided'}</div>
                    </div>
                    
                    <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '20px' }}>
                      <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Registered Location</div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <i className="fas fa-location-dot" style={{ color: '#f64e60', marginTop: '4px' }}></i>
                        <div style={{ lineHeight: '1.6', color: 'var(--text-2)', fontWeight: '500' }}>
                          <div>{profile.addressLine1 || 'Address line 1 missing'}</div>
                          {profile.addressLine2 && <div>{profile.addressLine2}</div>}
                          <div>{profile.city}{profile.city && profile.state ? ', ' : ''}{profile.state} {profile.pincode}</div>
                          <div>{profile.country}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT PROFILE TAB */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Edit Shop Profile</h2>
              
              <div className="fg" style={{ marginBottom: '24px' }}>
                <label>Shop Logo</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {(logoPreview || profile.logoUrl) ? (
                    <img src={logoPreview || profile.logoUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-image" style={{ color: 'var(--text-3)', fontSize: '24px' }}></i>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="fg"><label>Shop Name</label><input type="text" className="fi" value={profileForm.shopName || ''} onChange={(e) => setProfileForm({...profileForm, shopName: e.target.value})} required /></div>
                <div className="fg"><label>Owner Full Name</label><input type="text" className="fi" value={profileForm.ownerName || ''} onChange={(e) => setProfileForm({...profileForm, ownerName: e.target.value})} required /></div>
              </div>
              
              <div className="form-row">
                <div className="fg">
                  <label>Shop Type</label>
                  <select className="fi" value={profileForm.shopType || ''} onChange={(e) => setProfileForm({...profileForm, shopType: e.target.value})} required>
                    <option value="">Select Type</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Electronics">Electronics</option>
                    <option value="General Store">General Store</option>
                    <option value="Medical">Medical</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="fg"><label>Registration Number</label><input type="text" className="fi" value={profileForm.regNumber || ''} onChange={(e) => setProfileForm({...profileForm, regNumber: e.target.value})} /></div>
              </div>

              <div className="form-row">
                <div className="fg"><label>GSTIN Number</label><input type="text" className="fi" value={profileForm.gstin || ''} onChange={(e) => setProfileForm({...profileForm, gstin: e.target.value})} /></div>
                <div className="fg"><label>PAN Number</label><input type="text" className="fi" value={profileForm.pan || ''} onChange={(e) => setProfileForm({...profileForm, pan: e.target.value})} /></div>
                <div className="fg"><label>FSSAI Number</label><input type="text" className="fi" value={profileForm.fssai || ''} onChange={(e) => setProfileForm({...profileForm, fssai: e.target.value})} /></div>
              </div>

              <h3 style={{ fontSize: '15px', marginTop: '30px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Contact Information</h3>
              <div className="form-row">
                <div className="fg"><label>Official Email</label><input type="email" className="fi" value={profileForm.email || ''} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} required /></div>
                <div className="fg"><label>Phone Number</label><input type="text" className="fi" value={profileForm.phone || ''} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} required /></div>
                <div className="fg"><label>WhatsApp Number</label><input type="text" className="fi" value={profileForm.whatsapp || ''} onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})} /></div>
              </div>

              <h3 style={{ fontSize: '15px', marginTop: '30px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Address Information</h3>
              <div className="form-row">
                <div className="fg" style={{ flex: 2 }}><label>Address Line 1</label><input type="text" className="fi" value={profileForm.addressLine1 || ''} onChange={(e) => setProfileForm({...profileForm, addressLine1: e.target.value})} required /></div>
                <div className="fg" style={{ flex: 1 }}><label>Address Line 2</label><input type="text" className="fi" value={profileForm.addressLine2 || ''} onChange={(e) => setProfileForm({...profileForm, addressLine2: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="fg"><label>City</label><input type="text" className="fi" value={profileForm.city || ''} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} required /></div>
                <div className="fg"><label>State</label><input type="text" className="fi" value={profileForm.state || ''} onChange={(e) => setProfileForm({...profileForm, state: e.target.value})} required /></div>
                <div className="fg"><label>PIN Code</label><input type="text" className="fi" value={profileForm.pincode || ''} onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})} required /></div>
                <div className="fg"><label>Country</label><input type="text" className="fi" value={profileForm.country || ''} onChange={(e) => setProfileForm({...profileForm, country: e.target.value})} required /></div>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: '20px' }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* BRANCHES TAB */}
          {activeTab === 'branches' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Branch Management</h2>
                <button className="btn btn--primary" onClick={() => openBranchModal()}><i className="fas fa-plus"></i> Add Branch</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>Manager</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No branches found</td></tr>
                    ) : (
                      branches.map(b => (
                        <tr key={b._id}>
                          <td style={{ fontWeight: '500' }}>{b.name}</td>
                          <td>{b.manager || '-'}</td>
                          <td>{b.contact}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.address}</td>
                          <td>
                            <span className={`badge ${b.status === 'Active' ? 'badge--green' : 'badge--gray'}`}>{b.status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn--icon" onClick={() => openBranchModal(b)} style={{ color: 'var(--blue)' }}><i className="fas fa-edit"></i></button>
                              <button className="btn--icon" onClick={() => handleDeleteBranch(b._id)} style={{ color: 'var(--red)' }}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Business Settings</h2>
              
              <div className="form-row">
                <div className="fg"><label>Financial Year Start Date</label><input type="date" className="fi" value={settingsForm.financialYearStart} onChange={(e) => setSettingsForm({...settingsForm, financialYearStart: e.target.value})} required /></div>
                <div className="fg"><label>Financial Year End Date</label><input type="date" className="fi" value={settingsForm.financialYearEnd} onChange={(e) => setSettingsForm({...settingsForm, financialYearEnd: e.target.value})} required /></div>
              </div>

              <h3 style={{ fontSize: '15px', marginTop: '30px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Working Hours</h3>
              <div className="form-row">
                <div className="fg"><label>Opening Time</label><input type="time" className="fi" value={settingsForm.openingTime} onChange={(e) => setSettingsForm({...settingsForm, openingTime: e.target.value})} required /></div>
                <div className="fg"><label>Closing Time</label><input type="time" className="fi" value={settingsForm.closingTime} onChange={(e) => setSettingsForm({...settingsForm, closingTime: e.target.value})} required /></div>
                <div className="fg">
                  <label>Weekly Holiday</label>
                  <select className="fi" value={settingsForm.weeklyHoliday} onChange={(e) => setSettingsForm({...settingsForm, weeklyHoliday: e.target.value})}>
                    <option value="">None</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', marginTop: '30px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Localization</h3>
              <div className="form-row">
                <div className="fg">
                  <label>Language Preference</label>
                  <select className="fi" value={settingsForm.language} onChange={(e) => setSettingsForm({...settingsForm, language: e.target.value})}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Currency Preference</label>
                  <select className="fi" value={settingsForm.currency} onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: '20px' }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}

          {/* SOCIAL MEDIA TAB */}
          {activeTab === 'social' && (
            <form onSubmit={handleSaveSocial}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Social Media Links</h2>
              
              <div className="fg" style={{ marginBottom: '16px' }}>
                <label>Website URL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                  <i className="fas fa-globe" style={{ color: 'var(--text-3)' }}></i>
                  <input type="url" className="fi" style={{ border: 'none', background: 'transparent' }} value={socialForm.website} onChange={(e) => setSocialForm({...socialForm, website: e.target.value})} placeholder="https://www.yourshop.com" />
                </div>
              </div>
              <div className="fg" style={{ marginBottom: '16px' }}>
                <label>Facebook URL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                  <i className="fab fa-facebook" style={{ color: '#1877F2' }}></i>
                  <input type="url" className="fi" style={{ border: 'none', background: 'transparent' }} value={socialForm.facebook} onChange={(e) => setSocialForm({...socialForm, facebook: e.target.value})} placeholder="https://facebook.com/yourshop" />
                </div>
              </div>
              <div className="fg" style={{ marginBottom: '16px' }}>
                <label>Instagram URL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                  <i className="fab fa-instagram" style={{ color: '#E4405F' }}></i>
                  <input type="url" className="fi" style={{ border: 'none', background: 'transparent' }} value={socialForm.instagram} onChange={(e) => setSocialForm({...socialForm, instagram: e.target.value})} placeholder="https://instagram.com/yourshop" />
                </div>
              </div>
              <div className="fg" style={{ marginBottom: '16px' }}>
                <label>Twitter/X URL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                  <i className="fab fa-x-twitter" style={{ color: '#000000' }}></i>
                  <input type="url" className="fi" style={{ border: 'none', background: 'transparent' }} value={socialForm.twitter} onChange={(e) => setSocialForm({...socialForm, twitter: e.target.value})} placeholder="https://twitter.com/yourshop" />
                </div>
              </div>
              <div className="fg" style={{ marginBottom: '16px' }}>
                <label>LinkedIn URL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
                  <i className="fab fa-linkedin" style={{ color: '#0A66C2' }}></i>
                  <input type="url" className="fi" style={{ border: 'none', background: 'transparent' }} value={socialForm.linkedin} onChange={(e) => setSocialForm({...socialForm, linkedin: e.target.value})} placeholder="https://linkedin.com/company/yourshop" />
                </div>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: '20px' }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Links'}
              </button>
            </form>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Analytics Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <i className="fas fa-indian-rupee-sign"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Lifetime Revenue</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{analytics.revenue.toLocaleString()}</div>
                  </div>
                </div>
                <div 
                  className="card" 
                  onClick={handleOpenInvoicesModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#3b82f6' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <i className="fas fa-file-invoice"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Lifetime Invoices</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{analytics.invoices.toLocaleString()}</div>
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <i className="fas fa-users-viewfinder"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total Customers</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{analytics.customers}</div>
                  </div>
                </div>
                <div 
                  className="card" 
                  onClick={handleOpenEmployeesModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#f64e60' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(246, 78, 96, 0.1)', color: '#f64e60', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Active Employees</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{analytics.employees}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BRANCH MODAL */}
      {showBranchModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 1101 }}>
            <div className="modal__top">
              <h3>{branchForm.id ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button className="btn--icon" onClick={() => setShowBranchModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveBranch}>
              <div className="fg">
                <label>Branch Name</label>
                <input type="text" className="fi" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Contact Number</label>
                  <input type="text" className="fi" value={branchForm.contact} onChange={e => setBranchForm({...branchForm, contact: e.target.value})} required />
                </div>
                <div className="fg">
                  <label>Status</label>
                  <select className="fi" value={branchForm.status} onChange={e => setBranchForm({...branchForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="fg">
                <label>Branch Manager</label>
                <input type="text" className="fi" value={branchForm.manager} onChange={e => setBranchForm({...branchForm, manager: e.target.value})} />
              </div>
              <div className="fg">
                <label>Complete Address</label>
                <textarea className="fi" rows="3" value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} required></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowBranchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICES LIST MODAL */}
      {showInvoicesModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 1101, maxWidth: '800px', width: '90%' }}>
            <div className="modal__top">
              <h3>Lifetime Invoices</h3>
              <button className="btn--icon" onClick={() => setShowInvoicesModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {invoicesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: '#3b82f6' }}></i>
                </div>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Invoice ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Mode</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Shop Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalInvoices.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No invoices found</td></tr>
                    ) : (
                      modalInvoices.map(inv => (
                        <tr key={inv._id || inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{inv.id}</td>
                          <td style={{ padding: '12px' }}>{inv.customer || '-'}</td>
                          <td style={{ padding: '12px' }}>{inv.date || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{inv.amount?.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{inv.mode || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{inv.status || 'Pending'}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-3)' }}>{inv.username}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowInvoicesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEES LIST MODAL */}
      {showEmployeesModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 1101, maxWidth: '700px', width: '90%' }}>
            <div className="modal__top">
              <h3>Active Employees</h3>
              <button className="btn--icon" onClick={() => setShowEmployeesModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {employeesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: '#f64e60' }}></i>
                </div>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalEmployees.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No employees found</td></tr>
                    ) : (
                      modalEmployees.map(emp => (
                        <tr key={emp._id || emp.username} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{emp.username}</td>
                          <td style={{ padding: '12px' }}>{emp.phone || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className="badge badge--gray" style={{ textTransform: 'capitalize' }}>{emp.role || 'Staff'}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${emp.status === 'active' ? 'badge--green' : 'badge--red'}`}>{emp.status || 'Active'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowEmployeesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
