import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import SettingsSidebar from './SettingsSidebar.jsx'
import Dashboard from './Dashboard.jsx'
import Profile from './Profile.jsx'
import NewOrder from './NewOrder.jsx'
import DeliveryHistory from './DeliveryHistory.jsx'
import EarningsHistory from './EarningsHistory.jsx'
import StatusChart from './StatusChart.jsx'
import './driver.css'

// Multi-language translation dictionary
const translations = {
  en: {
    deliveryPartnerPanel: "Delivery Partner Panel",
    overview: "Overview",
    management: "Management",
    details: "Details",
    newOrder: "New Order",
    profile: "Profile",
    today: "Today",
    deliveryDashboard: "Delivery Dashboard",
    loadingDate: "Loading date...",
    quickAddOrder: "Quick Add Order",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    deliveryAddress: "Delivery Address",
    itemsSeparated: "Items (separated by commas)",
    billAmount: "Bill Amount",
    paymentType: "Payment Type",
    timeSlot: "Time Slot",
    createDelivery: "Create Delivery",
    activeDeliveries: "Active Deliveries",
    orderId: "Order ID",
    customer: "Customer",
    phone: "Phone",
    address: "Address",
    items: "Items",
    amount: "Amount",
    status: "Status",
    actions: "Actions",
    noActiveDeliveries: "No active deliveries assigned to you.",
    selectDelivery: "Select a delivery to view maps and details",
    deliveryDetails: "Delivery Details",
    paymentCollected: "Payment Collected",
    failedReason: "Reason of Failure",
    rescheduleDate: "Reschedule Date",
    rescheduleSlot: "Reschedule Time Slot",
    markOutForDelivery: "Mark Out for Delivery",
    markCompleted: "Mark Delivered",
    markFailed: "Mark Failed",
    rescheduleOrder: "Reschedule Order",
    collectCash: "Collect COD Payment",
    uploadProof: "Upload Signature/Proof",
    initiateReturn: "Initiate Return Flow",
    openInMapPortal: "Open Navigation in Google Maps",
    mapLookupTitle: "Google Maps Embed",
    mapLoading: "Loading Google Map...",
    totalDeliveries: "Total Deliveries",
    pendingDeliveries: "Pending Deliveries",
    completedDeliveries: "Completed Deliveries",
    failedDeliveries: "Failed Deliveries",
    totalEarnings: "Earnings",
    completionRate: "Completion Rate",
    theme: "Theme",
    language: "Language",
    baseCommission: "Base Commission",
    dangerZone: "Danger Zone",
    loadDemoData: "Load Demo Data",
    signIntoPanel: "Sign In",
    partnerRegistration: "Partner Registration",
    welcomeBack: "Welcome Back",
    accessPanel: "Access your delivery assignment panel",
    employeeId: "Employee ID",
    password: "Password",
    signIn: "Sign In",
    fullName: "Full Name",
    emailAddress: "Email Address",
    vehicleType: "Vehicle Type",
    vehicleNumber: "Vehicle Number",
    assignedZone: "Assigned Zone",
    createPartnerAccount: "Create Account",
    personalProfile: "Personal Profile",
    personalDetails: "Personal Details",
    deliveryPartnerInfo: "Delivery Partner Info",
    statisticsOverview: "Statistics Overview",
    currentPassword: "Current Password",
    newPassword: "New Password",
    changePassword: "Change Password",
    logout: "Log Out",
    demoLoaded: "Real-time active sales loaded from your Vyapar backend!",
    selectDeliveryFirst: "Please select an order first",
    openedMapPortal: "Opened navigation",
    signatureRequired: "Signature or proof upload is required for Delivered status",
    statusUpdated: "Status updated successfully",
    paymentUpdated: "Payment status updated",
    proofUploaded: "Proof photo uploaded successfully",
    returnInitiated: "Return logistics flow registered in database",
    passwordChanged: "Password changed successfully",
    profileUpdated: "Profile details updated",
    earnHistory: "Earn History",
    deliveryHistory: "Delivery History",
    databaseSync: "Database Synchronization"
  },
  hi: {
    deliveryPartnerPanel: "वितरण भागीदार पैनल",
    overview: "अवलोकन",
    management: "प्रबंधन",
    details: "विवरण",
    newOrder: "नया ऑर्डर",
    profile: "प्रोफ़ाइल",
    today: "आज",
    deliveryDashboard: "वितरण डैशबोर्ड",
    loadingDate: "तारीख लोड हो रही है...",
    quickAddOrder: "त्वरित ऑर्डर जोड़ें",
    customerName: "ग्राहक का नाम",
    customerPhone: "ग्राहक का फोन",
    deliveryAddress: "वितरण पता",
    itemsSeparated: "आइटम (अल्पविराम से अलग)",
    billAmount: "बिल राशि",
    paymentType: "भुगतान का प्रकार",
    timeSlot: "समय स्लॉट",
    createDelivery: "वितरण बनाएं",
    activeDeliveries: "सक्रिय वितरण",
    orderId: "ऑर्डर आईडी",
    customer: "ग्राहक",
    phone: "फोन",
    address: "पता",
    items: "सामग्री",
    amount: "राशि",
    status: "स्थिति",
    actions: "कार्रवाई",
    noActiveDeliveries: "आपको कोई सक्रिय वितरण नहीं सौंपा गया है।",
    selectDelivery: "नक्शे और विवरण देखने के लिए एक वितरण का चयन करें",
    deliveryDetails: "वितरण विवरण",
    paymentCollected: "भुगतान प्राप्त हुआ",
    failedReason: "विफलता का कारण",
    rescheduleDate: "पुनर्निर्धारित तिथि",
    rescheduleSlot: "पुनर्निर्धारित समय स्लॉट",
    markOutForDelivery: "वितरण के लिए रवाना करें",
    markCompleted: "वितरित मार्क करें",
    markFailed: "विफल मार्क करें",
    rescheduleOrder: "ऑर्डर पुनर्निर्धारित करें",
    collectCash: "नकद प्राप्त करें (COD)",
    uploadProof: "हस्ताक्षर/प्रमाण अपलोड करें",
    initiateReturn: "रिटर्न प्रक्रिया शुरू करें",
    openInMapPortal: "गूगल मैप्स में नेविगेशन खोलें",
    mapLookupTitle: "गूगल मैप्स एम्बेड",
    mapLoading: "गूगल मैप लोड हो रहा है...",
    totalDeliveries: "कुल वितरण",
    pendingDeliveries: "लंबित वितरण",
    completedDeliveries: "पूरे हुए वितरण",
    failedDeliveries: "विफल वितरण",
    totalEarnings: "कुल कमाई",
    completionRate: "सफलता दर",
    theme: "थीम",
    language: "भाषा",
    baseCommission: "मूल कमीशन",
    dangerZone: "खतरनाक क्षेत्र",
    loadDemoData: "डेमो डेटा लोड करें",
    signIntoPanel: "साइन इन करें",
    partnerRegistration: "भागीदार पंजीकरण",
    welcomeBack: "आपका स्वागत है",
    accessPanel: "अपने वितरण असाइनमेंट पैनल तक पहुंचें",
    employeeId: "कर्मचारी आईडी",
    password: "पासवर्ड",
    signIn: "साइन इन करें",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    vehicleType: "वाहन का प्रकार",
    vehicleNumber: "वाहन संख्या",
    assignedZone: "सौंपा गया क्षेत्र",
    createPartnerAccount: "खाता बनाएं",
    personalProfile: "व्यक्तिगत प्रोफ़ाइल",
    personalDetails: "व्यक्तिगत विवरण",
    deliveryPartnerInfo: "वितरण भागीदार जानकारी",
    statisticsOverview: "सांख्यिकी सिंहावलोकन",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    changePassword: "पासवर्ड बदलें",
    logout: "लॉग आउट",
    demoLoaded: "व्यापार बैकएंड से वास्तविक समय की बिक्री लोड की गई!",
    selectDeliveryFirst: "कृपया पहले एक ऑर्डर चुनें",
    openedMapPortal: "नेविगेशन खोल दिया गया है",
    signatureRequired: "वितरित स्थिति के लिए हस्ताक्षर या प्रमाण अपलोड करना आवश्यक है",
    statusUpdated: "स्थिति सफलतापूर्वक अपडेट की गई",
    paymentUpdated: "भुगतान स्थिति अपडेट की गई",
    proofUploaded: "प्रमाण फोटो सफलतापूर्वक अपलोड किया गया",
    returnInitiated: "रिटर्न लॉजिस्टिक्स प्रवाह डेटाबेस में पंजीकृत किया गया",
    passwordChanged: "पासवर्ड सफलतापूर्वक बदला गया",
    profileUpdated: "प्रोफ़ाइल विवरण अपडेट किया गया",
    earnHistory: "कमाई इतिहास",
    deliveryHistory: "वितरण इतिहास",
    databaseSync: "डेटाबेस सिंक्रनाइझेशन"
  },
  mr: {
    deliveryPartnerPanel: "वितरण भागीदार पॅनेल",
    overview: "आढावा",
    management: "व्यवस्थापन",
    details: "तपशील",
    newOrder: "नवीन ऑर्डर",
    profile: "प्रोफाइल",
    today: "आज",
    deliveryDashboard: "वितरण डॅशबोर्ड",
    loadingDate: "तारीख लोड होत आहे...",
    quickAddOrder: "त्वरित ऑर्डर जोडा",
    customerName: "ग्राहकाचे नाव",
    customerPhone: "ग्राहकाचा फोन",
    deliveryAddress: "वितरणाचा पत्ता",
    itemsSeparated: "वस्तू (स्वल्पविरामाने वेगळ्या केलेल्या)",
    billAmount: "बिल रक्कम",
    paymentType: "पेमेंट प्रकार",
    timeSlot: "वेळ स्लॉट",
    createDelivery: "वितरण तयार करा",
    activeDeliveries: "सक्रिय वितरण",
    orderId: "ऑर्डर आयडी",
    customer: "ग्राहक",
    phone: "फोन",
    address: "पत्ता",
    items: "वस्तू",
    amount: "रक्कम",
    status: "स्थिती",
    actions: "कृती",
    noActiveDeliveries: "तुम्हाला कोणतेही सक्रिय वितरण नियुक्त केलेले नाही.",
    selectDelivery: "नकाशे आणि तपशील पाहण्यासाठी एक वितरण निवडा",
    deliveryDetails: "वितरण तपशील",
    paymentCollected: "पेमेंट गोळा केले",
    failedReason: "अयशस्वी होण्याचे कारण",
    rescheduleDate: "पुनर्निर्धारित तारीख",
    rescheduleSlot: "पुनर्निर्धारित वेळ स्लॉट",
    markOutForDelivery: "वितरणासाठी रवाना करा",
    markCompleted: "वितरित म्हणून चिन्हांकित करा",
    markFailed: "अयशस्वी म्हणून चिन्हांकित करा",
    rescheduleOrder: "ऑर्डर पुनर्निर्धारित करा",
    collectCash: "COD पेमेंट जमा करा",
    uploadProof: "स्वाक्षरी/प्रमाण अपलोड करा",
    initiateReturn: "रिटर्न प्रक्रिया सुरू करा",
    openInMapPortal: "गूगल नकाशे मध्ये उघडा",
    mapLookupTitle: "गूगल नकाशे एम्बेड",
    mapLoading: "गूगल नकाशा लोड होत आहे...",
    totalDeliveries: "एकूण वितरण",
    pendingDeliveries: "प्रलंबित वितरण",
    completedDeliveries: "पूर्ण झालेले वितरण",
    failedDeliveries: "अयशस्वी वितरण",
    totalEarnings: "एकूण कमाई",
    completionRate: "यशस्वी दर",
    theme: "थीम",
    language: "भाषा",
    baseCommission: "मूळ कमिशन",
    dangerZone: "धोकादायक क्षेत्र",
    loadDemoData: "डेमो डेटा लोड करा",
    signIntoPanel: "साइन इन करा",
    partnerRegistration: "भागीदार नोंदणी",
    welcomeBack: "आपले स्वागत आहे",
    accessPanel: "तुमच्या वितरण पॅनेलमध्ये प्रवेश करा",
    employeeId: "कर्मचारी आयडी",
    password: "पासवर्ड",
    signIn: "साइन इन करा",
    fullName: "पूर्ण नाव",
    emailAddress: "ईमेल पत्ता",
    vehicleType: "वाहनाचा प्रकार",
    vehicleNumber: "वाहन क्रमांक",
    assignedZone: "नियोजित क्षेत्र",
    createPartnerAccount: "खाते तयार करा",
    personalProfile: "वैयक्तिक प्रोफाइल",
    personalDetails: "वैयक्तिक तपशील",
    deliveryPartnerInfo: "वितरण भागीदार माहिती",
    statisticsOverview: "सांख्यिकी विहंगावलोकन",
    currentPassword: "सध्याचा पासवर्ड",
    newPassword: "नवीन पासवर्ड",
    changePassword: "पासवर्ड बदला",
    logout: "लॉग आउट",
    demoLoaded: "व्यापार बॅकएंडवरून रिअल-टाइम विक्री लोड केली!",
    selectDeliveryFirst: "कृपया आधी एक ऑर्डर निवडा",
    openedMapPortal: "नेव्हिगेशन उघडले गेले आहे",
    signatureRequired: "वितरित स्थितीसाठी स्वाक्षरी किंवा पुरावा अपलोड करणे आवश्यक आहे",
    statusUpdated: "स्थिती यशस्वीरित्या अपडेट केली",
    paymentUpdated: "पेमेंट स्थिती अपडेट केली",
    proofUploaded: "प्रमाण फोटो यशस्वीरित्या अपलोड केला",
    returnInitiated: "रिटर्न लॉजिस्टिक्स प्रवाह डेटाबेसमध्ये नोंदवला गेला",
    passwordChanged: "पासवर्ड यशस्वीरित्या बदलला",
    profileUpdated: "प्रोफाइल तपशील अपडेट केले",
    earnHistory: "कमाई इतिहास",
    deliveryHistory: "वितरण इतिहास",
    databaseSync: "डेटाबेस सिंक्रोनाइझेशन"
  }
}

const apiBase = '/api'

export default function DeliveryBoyApp({ token, user, handleLogout: parentLogout }) {
  const [driverProfile, setDriverProfile] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null)
  const [drillModal, setDrillModal] = useState(null)
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'management' | 'details' | 'newOrder' | 'profile'
  const [showSettings, setShowSettings] = useState(false)
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All')
  
  // Customization preferences
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [baseCommission, setBaseCommission] = useState(Number(localStorage.getItem('commission')) || 45)

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, title: "System Ready", text: "SwiftDrop Logistics Server is fully operational.", type: "success", read: false, time: new Date() }
  ])

  // Toast alerts
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
  const toastTimeoutRef = useRef(null)

  // References for wiggling bell animation
  const [bellShake, setBellShake] = useState(false)

  // Local helper translation function
  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key
  }

  // Toast Helper
  const triggerToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }
    setToast({ message, type, visible: true })
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 2800)
  }

  // Load profile and order history
  useEffect(() => {
    if (token) {
      loadProfile()
      loadDeliveries()

      const socket = io()
      socket.on('delivery_updated', (updatedDelivery) => {
        loadDeliveries()
      })

      return () => {
        socket.disconnect()
      }
    } else {
      setDriverProfile(null)
      setDeliveries([])
    }
  }, [token])

  // Save baseCommission changes to localStore
  useEffect(() => {
    localStorage.setItem('commission', baseCommission)
  }, [baseCommission])

  // Sync theme changes to body element classes and attributes
  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      document.body.setAttribute('data-theme', 'light')
    }
  }, [theme])

  // Sync language translations choice to localStorage
  useEffect(() => {
    localStorage.setItem('lang', language)
  }, [language])

  // Wiggle bell when notifications count increases
  const addNotification = (title, text, type = 'info') => {
    setNotifications(prev => [
      { id: Date.now(), title, text, type, read: false, time: new Date() },
      ...prev
    ])
    setBellShake(true)
    setTimeout(() => setBellShake(false), 800)
  }

  const fetchMyNotifications = async () => {
    const targetUser = user?.username || driverProfile?.employeeId;
    if (!targetUser) return;
    try {
      const res = await fetch(`/api/admin/notifications/my?username=${encodeURIComponent(targetUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const list = data.notifications || [];
          
          const mapped = list.map(n => ({
            id: n._id,
            title: n.title,
            text: n.message,
            type: 'info',
            read: n.read,
            time: new Date(n.createdAt)
          }));

          const defaults = [
            { id: 'default-1', title: "System Ready", text: "SwiftDrop Logistics Server is fully operational.", type: "success", read: true, time: new Date() }
          ];

          setNotifications([...mapped, ...defaults]);

          const storageKey = `seen_driver_notifs_${targetUser}`;
          let seenIds = [];
          try {
            seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch (e) {}

          const newUnread = list.filter(n => !n.read && !seenIds.includes(String(n._id)));
          if (newUnread.length > 0) {
            const updatedSeen = [...seenIds, ...newUnread.map(n => String(n._id))];
            localStorage.setItem(storageKey, JSON.stringify(updatedSeen));

            newUnread.forEach(notif => {
              triggerToast(`📢 Broadcast: ${notif.title}\n${notif.message}`, 'info');
              setBellShake(true);
              setTimeout(() => setBellShake(false), 800);

              fetch('/api/admin/notifications/ack/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetUser, notificationId: notif._id })
              }).catch(err => console.error('Error auto-ack read:', err));
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch driver notifications:', err);
    }
  };

  useEffect(() => {
    const targetUser = user?.username || driverProfile?.employeeId;
    if (targetUser) {
      fetchMyNotifications();
      const interval = setInterval(fetchMyNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, driverProfile]);

  // Handle title tab updates with unread count
  const unreadCount = notifications.filter(n => !n.read).length
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${t('deliveryDashboard')} & Management`
    } else {
      document.title = `${t('deliveryDashboard')} & Management`
    }
  }, [unreadCount, language])

  // Core API Requests Wrapper
  async function requestJson(url, options = {}) {
    options.headers = options.headers || {}
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, options)
    const data = await response.json().catch(() => ({}))

    if (response.status === 401) {
      parentLogout()
      throw new Error("Session expired")
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed")
    }

    return data
  }

  async function loadProfile() {
    try {
      const data = await requestJson(`${apiBase}/profile`)
      setDriverProfile(data)
      if (data.commissionPerDelivery) {
        setBaseCommission(data.commissionPerDelivery)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadDeliveries() {
    try {
      const data = await requestJson(`${apiBase}/deliveries`)
      setDeliveries(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    parentLogout()
  }

  // Seeder Sync
  const handleSeedData = async () => {
    try {
      const result = await requestJson(`${apiBase}/seed`, { method: "POST" })
      triggerToast(result.message || t("demoLoaded"))
      addNotification("Invoices Synchronized", "Real-time active sales loaded from your backend database!", "success")
      setSelectedDeliveryId(null)
      await loadProfile()
      await loadDeliveries()
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  // Calculate statistics for Overview page
  const total = deliveries.length
  const pending = deliveries.filter(d => ['Assigned', 'Out for delivery', 'Rescheduled'].includes(d.status)).length
  const completed = deliveries.filter(d => d.status === 'Delivered').length
  const failed = deliveries.filter(d => d.status === 'Failed').length
  const rate = total ? Math.round((completed / total) * 100) : 0
  const earnings = completed * baseCommission

  // Get all deliveries for Management page (to show all customers in the queue)
  const activeDeliveries = deliveries

  return (
    <div className="driver-app">
      <div className="app-shell">
        {/* 1. Left Drawer Sidebar navigation (Overview, Management, Details, History, Earnings, Profile) */}
        <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        driverProfile={driverProfile} 
        handleLogout={handleLogout}
        t={t}
      />

      {/* Main dashboard content body */}
      <div className="dashboard-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* 2. Top App Bar Header */}
        <Topbar 
          t={t} 
          notifications={notifications} 
          setNotifications={setNotifications}
          unreadCount={unreadCount}
          bellShake={bellShake}
          setShowSettings={setShowSettings}
        />

        {/* 3. Core Page Content switching */}
        <main className="driver-dashboard" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          
          {/* TAB 1: Overview Page (Statistics counters & Progress donut chart dashboard) */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="section-header">
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{t('statisticsOverview')}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                  A breakdown of your daily delivery performance, quotas, and commissions.
                </p>
              </div>

              <div className="overview-grid-container">
                <section className="overview-stats-grid" aria-label="Performance Statistics">
                  <div 
                    className="stat-card total" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrillModal({
                        title: t('totalDeliveries'),
                        cols: ['Order ID', 'Customer', 'Status', 'Amount', 'Time Slot'],
                        rows: deliveries.map(d => [d.orderId, d.customerName, d.status, `Rs. ${d.billAmount}`, d.deliveryTimeSlot || '-'])
                      });
                    }}
                  >
                    <span className="stat-icon">T</span>
                    <p className="stat-label">{t('totalDeliveries')}</p>
                    <h3 className="stat-value">{total}</h3>
                  </div>
                  <div 
                    className="stat-card pending" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrillModal({
                        title: t('pendingDeliveries'),
                        cols: ['Order ID', 'Customer', 'Status', 'Amount', 'Time Slot'],
                        rows: deliveries.filter(d => ['Assigned', 'Out for delivery', 'Rescheduled'].includes(d.status)).map(d => [d.orderId, d.customerName, d.status, `Rs. ${d.billAmount}`, d.deliveryTimeSlot || '-'])
                      });
                    }}
                  >
                    <span className="stat-icon">P</span>
                    <p className="stat-label">{t('pendingDeliveries')}</p>
                    <h3 className="stat-value" style={{ color: '#f59e0b' }}>{pending}</h3>
                  </div>
                  <div 
                    className="stat-card completed" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrillModal({
                        title: t('completedDeliveries'),
                        cols: ['Order ID', 'Customer', 'Status', 'Amount', 'Tip'],
                        rows: deliveries.filter(d => d.status === 'Delivered').map(d => [d.orderId, d.customerName, d.status, `Rs. ${d.billAmount}`, `Rs. ${d.tip || 0}`])
                      });
                    }}
                  >
                    <span className="stat-icon">D</span>
                    <p className="stat-label">{t('completedDeliveries')}</p>
                    <h3 className="stat-value" style={{ color: '#10b981' }}>{completed}</h3>
                  </div>
                  <div 
                    className="stat-card failed" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrillModal({
                        title: t('failedDeliveries'),
                        cols: ['Order ID', 'Customer', 'Status', 'Reason'],
                        rows: deliveries.filter(d => d.status === 'Failed').map(d => [d.orderId, d.customerName, d.status, d.failedReason || '-'])
                      });
                    }}
                  >
                    <span className="stat-icon">F</span>
                    <p className="stat-label">{t('failedDeliveries')}</p>
                    <h3 className="stat-value" style={{ color: '#ef4444' }}>{failed}</h3>
                  </div>
                  <div 
                    className="stat-card earnings" 
                    id="earnings"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const completedDeliveries = deliveries.filter(d => d.status === 'Delivered');
                      setDrillModal({
                        title: t('totalEarnings'),
                        cols: ['Order ID', 'Customer', 'Commission', 'Tip', 'Total'],
                        rows: completedDeliveries.map(d => [d.orderId, d.customerName, `Rs. ${baseCommission}`, `Rs. ${d.tip || 0}`, `Rs. ${baseCommission + (d.tip || 0)}`])
                      });
                    }}
                  >
                    <span className="stat-icon">Rs</span>
                    <p className="stat-label">{t('totalEarnings')}</p>
                    <h3 className="stat-value" style={{ color: 'var(--teal)' }}>Rs. {earnings}</h3>
                  </div>
                  <div 
                    className="stat-card" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrillModal({
                        title: t('completionRate'),
                        cols: ['Status Metric', 'Count'],
                        rows: [
                          ['Completed Deliveries', completed],
                          ['Pending Deliveries', pending],
                          ['Failed Deliveries', failed],
                          ['Total Assigned Queue', total]
                        ]
                      });
                    }}
                  >
                    <span className="stat-icon" style={{ background: '#eef2f6', color: '#475569' }}>%</span>
                    <p className="stat-label">{t('completionRate')}</p>
                    <h3 className="stat-value">{rate}%</h3>
                  </div>
                </section>

                <div className="overview-chart-wrapper">
                  <StatusChart deliveries={deliveries} t={t} />
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Welcome to SwiftDrop Courier Panel</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                  Use the **Management** tab to view all delivery jobs assigned to your profile today. Selecting any order will automatically open the **Details** page, giving you instant access to public Google Maps embeds, directions routing, cash collections ledger registers, and status completion controls.
                </p>
              </div>
            </div>
          )}

          {/* Auto select first active delivery if none is selected */}
          {(() => {
            if (!selectedDeliveryId && deliveries.length) {
              const firstActive = deliveries.find(d => ['Assigned', 'Out for delivery', 'Rescheduled'].includes(d.status))
              if (firstActive) {
                setSelectedDeliveryId(firstActive._id)
              } else {
                setSelectedDeliveryId(deliveries[0]._id)
              }
            }
          })()}

          {/* TAB 2: Delivery Management Page (Unified split-pane active deliveries queue & details map) */}
          {activeTab === 'management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="section-header">
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Delivery Management</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                  View assigned deliveries, track locations with live Google Maps, update statuses, collect payments, and initiate returns in one place.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                {/* Left Column: Scrollable Assigned Queue */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>Assigned Queue ({activeDeliveries.length})</h3>
                  {activeDeliveries.length === 0 ? (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', color: 'var(--muted)' }}>
                      {t('noActiveDeliveries')}
                    </div>
                  ) : (
                    activeDeliveries.map((delivery) => (
                      <div 
                        key={delivery._id}
                        className="delivery-card-item"
                        onClick={() => setSelectedDeliveryId(delivery._id)}
                        style={{
                          background: 'var(--card-bg)',
                          border: selectedDeliveryId === delivery._id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: selectedDeliveryId === delivery._id ? '0 4px 15px rgba(99, 102, 241, 0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-color)' }}>{delivery.orderId}</strong>
                          <span 
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '4px 8px',
                              borderRadius: '20px',
                              textTransform: 'uppercase',
                              background: delivery.status === 'Out for delivery' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                              color: delivery.status === 'Out for delivery' ? '#f59e0b' : '#6366f1'
                            }}
                          >
                            {delivery.status}
                          </span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{delivery.customerName}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{delivery.deliveryAddress}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                          <span>{delivery.paymentType} • Rs. {delivery.billAmount}</span>
                          <span>{delivery.deliveryTimeSlot}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Column: Active Delivery details and Google Maps frame */}
                <div style={{ flex: '1.8', minWidth: '320px' }}>
                  <Dashboard 
                    deliveries={deliveries}
                    setDeliveries={setDeliveries}
                    selectedDeliveryId={selectedDeliveryId}
                    setSelectedDeliveryId={setSelectedDeliveryId}
                    baseCommission={baseCommission}
                    requestJson={requestJson}
                    apiBase={apiBase}
                    triggerToast={triggerToast}
                    addNotification={addNotification}
                    loadProfile={loadProfile}
                    loadDeliveries={loadDeliveries}
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Delivery History Page */}
          {activeTab === 'deliveryHistory' && (
            <DeliveryHistory 
              deliveries={deliveries}
              setDeliveries={setDeliveries}
              setSelectedDeliveryId={setSelectedDeliveryId}
              setActiveTab={setActiveTab}
              apiBase={apiBase}
              requestJson={requestJson}
              triggerToast={triggerToast}
              addNotification={addNotification}
              t={t}
              statusFilter={historyStatusFilter}
              setStatusFilter={setHistoryStatusFilter}
            />
          )}

          {/* TAB 5: Earnings History Page */}
          {activeTab === 'earningsHistory' && (
            <EarningsHistory 
              deliveries={deliveries}
              baseCommission={baseCommission}
              t={t}
            />
          )}

          {/* TAB 6: Profile Page (View personal details, change pass) */}
          {activeTab === 'profile' && (
            <Profile 
              driverProfile={driverProfile}
              setDriverProfile={setDriverProfile}
              requestJson={requestJson}
              apiBase={apiBase}
              handleLogout={handleLogout}
              triggerToast={triggerToast}
              t={t}
            />
          )}

        </main>
      </div>

      {/* 4. Sliding Preferences Settings sidebar */}
      <SettingsSidebar 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        baseCommission={baseCommission}
        setBaseCommission={setBaseCommission}
        handleSeedData={handleSeedData}
        t={t}
      />

      {/* 5. Glowing Notification Alert Box (Toast) */}
      <div className={`toast ${toast.visible ? '' : 'hidden'} ${toast.type}`}>
        {toast.message}
      </div>

      {/* 6. Performance drillModal popup box */}
      {drillModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxHeight: '85vh'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Breakdown</span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 0 0' }}>{drillModal.title}</h3>
              </div>
              <button 
                onClick={() => setDrillModal(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', borderRadius: '12px', border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                    {drillModal.cols.map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontWeight: 'bold' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillModal.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      style={{ 
                        borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : (theme === 'dark' ? '#17253b' : '#fafafa')
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 16px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {drillModal.rows.length === 0 && (
                    <tr>
                      <td colSpan={drillModal.cols.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button 
              onClick={() => setDrillModal(null)} 
              style={{
                width: '100%',
                backgroundColor: 'var(--primary-color)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '13px',
                padding: '12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
