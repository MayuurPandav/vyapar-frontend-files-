import React, { useState, useRef } from 'react'
import DeliveryHistory from './DeliveryHistory.jsx'
import EarningsHistory from './EarningsHistory.jsx'

export default function Profile({
  driverProfile,
  setDriverProfile,
  requestJson,
  apiBase,
  handleLogout,
  triggerToast,
  t
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [showCameraMode, setShowCameraMode] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const getInitials = (name) => {
    if (!name) return 'RJ'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(driverProfile.fullName)
  const joinedDateStr = driverProfile.joinedDate
    ? new Date(driverProfile.joinedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A'

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    
    const payload = {
      fullName: e.target.fullName.value.trim(),
      email: e.target.email.value.trim(),
      phone: e.target.phone.value.trim() || '',
      vehicleType: e.target.vehicleType.value,
      vehicleNumber: e.target.vehicleNumber.value.trim() || '',
      assignedZone: e.target.assignedZone.value.trim() || ''
    }

    try {
      const res = await requestJson(`${apiBase}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setDriverProfile(res)
      triggerToast(t('profileUpdated'))
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerToast("Webcam capture is not supported in this browser or connection. Please use 'Upload File' instead!", "error")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 300, height: 300, facingMode: "user" } 
      })
      setShowCameraMode(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 50)
      setCameraStream(stream)
    } catch (err) {
      triggerToast("Could not access camera: " + err.message, "error")
      setShowCameraMode(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCameraMode(false)
  }

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    canvas.width = 300
    canvas.height = 300
    
    // Draw square cropped camera snapshot
    context.drawImage(video, 0, 0, 300, 300)
    
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      await uploadPhotoFile(file)
      stopCamera()
    }, 'image/jpeg')
  }

  const uploadPhotoFile = async (file) => {
    const formData = new FormData()
    formData.append('profilePhoto', file)

    try {
      const res = await fetch(`${apiBase}/profile/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('driverToken')}` },
        body: formData
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Upload failed")

      setDriverProfile(data)
      triggerToast("Profile photo updated successfully")
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    await uploadPhotoFile(file)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return

    try {
      await requestJson(`${apiBase}/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      triggerToast(t('passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hidden Canvas for Camera Snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Profile Header Avatar Banner */}
      <section style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }} aria-label="Profile Banner">
        <div style={{ position: 'relative', width: showCameraMode ? '100px' : '68px', height: showCameraMode ? '100px' : '68px', transition: 'all 0.25s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showCameraMode ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green)', transform: 'scaleX(-1)' }}
            />
          ) : driverProfile.profilePhotoUrl ? (
            <img 
              src={driverProfile.profilePhotoUrl.startsWith('http') ? driverProfile.profilePhotoUrl : `${apiBase.replace('/api', '')}${driverProfile.profilePhotoUrl}`} 
              alt="Profile" 
              style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
            />
          ) : (
            <div className="avatar" style={{ width: '68px', height: '68px', fontSize: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {initials}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{driverProfile.fullName}</h2>
          <p style={{ margin: '2px 0 6px 0', fontSize: '13px', color: 'var(--muted)' }}>
            {driverProfile.vehicleType} Courier • {driverProfile.assignedZone || 'All Zones'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              accept="image/*" 
              id="profilePhotoInput" 
              style={{ display: 'none' }} 
              onChange={handleProfilePhotoUpload}
            />
            
            {!showCameraMode ? (
              <>
                {/* Option 1: File Upload */}
                <button 
                  type="button"
                  onClick={() => document.getElementById('profilePhotoInput').click()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--body-bg)',
                    color: 'var(--text-color)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.color = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload File
                </button>
                
                {/* Option 2: Live Camera Capture */}
                <button 
                  type="button"
                  onClick={startCamera}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--body-bg)',
                    color: 'var(--text-color)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--green)';
                    e.currentTarget.style.color = 'var(--green)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  Take Photo
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button"
                  onClick={captureSnapshot}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--green)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📸 Capture Photo
                </button>
                <button 
                  type="button"
                  onClick={stopCamera}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--body-bg)',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sub Tab Contents */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Personal Details Editor Form */}
          <div style={{ flex: 1, minWidth: '300px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', margin: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                {t('personalDetails')}
              </h3>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('fullName')} *</span>
                  <input 
                    name="fullName" 
                    type="text" 
                    defaultValue={driverProfile.fullName} 
                    required
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Employee ID</span>
                  <input 
                    type="text" 
                    value={driverProfile.employeeId} 
                    disabled
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg-hover)', color: 'var(--muted)', fontWeight: 600, cursor: 'not-allowed' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('emailAddress')} *</span>
                  <input 
                    name="email" 
                    type="email" 
                    defaultValue={driverProfile.email} 
                    required
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Phone</span>
                  <input 
                    name="phone" 
                    type="text" 
                    defaultValue={driverProfile.phone || ''} 
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>
              </div>

              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', margin: '14px 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                {t('deliveryPartnerInfo')}
              </h3>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('vehicleType')}</span>
                  <select 
                    name="vehicleType"
                    defaultValue={driverProfile.vehicleType || 'Bike'} 
                    style={{ minHeight: '36px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Cycle">Cycle</option>
                    <option value="E-Rickshaw">E-Rickshaw</option>
                    <option value="Mini Truck">Mini Truck</option>
                  </select>
                </label>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('vehicleNumber')}</span>
                  <input 
                    name="vehicleNumber" 
                    type="text" 
                    defaultValue={driverProfile.vehicleNumber || ''} 
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('assignedZone')}</span>
                  <input 
                    name="assignedZone" 
                    type="text" 
                    defaultValue={driverProfile.assignedZone || ''} 
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Joined Date</span>
                  <span style={{ display: 'flex', alignItems: 'center', minHeight: '36px', padding: '0 10px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                    {joinedDateStr}
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                style={{ width: '100%', minHeight: '38px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
              >
                Update Personal Profile
              </button>
            </form>
          </div>

          {/* Password Changer Drawer & Logout */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', margin: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  {t('changePassword')}
                </h3>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('currentPassword')} *</span>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{t('newPassword')} *</span>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 chars"
                    style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                </label>

                <button 
                  type="submit"
                  style={{ width: '100%', minHeight: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* Log Out button */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  minHeight: '40px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {t('logout')}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
