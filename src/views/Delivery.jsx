import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { io } from 'socket.io-client';

const calculateEstimatedCharges = (partner, billAmt) => {
  const p = String(partner || 'in-house').toLowerCase();
  const amt = Number(billAmt) || 0;
  if (p === 'shiprocket') {
    return Math.round(45 + amt * 0.05);
  } else if (p === 'delhivery') {
    return Math.round(55 + amt * 0.03);
  } else if (p === 'dunzo') {
    return Math.round(40 + amt * 0.10);
  }
  return 0;
};

export default function Delivery() {
  const { token, user, dbData } = useApp();
  const [deliveries, setDeliveries] = useState([]);
  const [boys, setBoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [form, setForm] = useState({
    customer: { name: '', phone: '', address: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '' },
    items: [],
    charges: 0,
    timeSlot: '',
    partner: 'in-house',
    paymentType: 'COD',
    invoiceId: null
  });
  const [mapQuery, setMapQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);
  const [trackingDelivery, setTrackingDelivery] = useState(null);
  const [trackingTimeline, setTrackingTimeline] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [drillModal, setDrillModal] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (showModal && mapContainerRef.current && window.L) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch (e) {}
          mapRef.current = null;
        }

        const defaultLat = 19.2183; // Default to Thane/Mumbai area
        const defaultLng = 72.9781;

        // Leaflet icon path resolution fix for CDN
        const DefaultIcon = window.L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        window.L.Marker.prototype.options.icon = DefaultIcon;

        const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);
        mapRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        const onMapAction = async (lat, lng) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              
              const street = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.industrial || addr.commercial || '';
              const area = addr.suburb || addr.neighbourhood || addr.county || addr.district || '';
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || '';
              const state = addr.state || '';
              const pincode = addr.postcode || '';
              const landmark = addr.amenity || addr.shop || addr.tourism || addr.historic || '';

              setForm(prev => ({
                ...prev,
                customer: {
                  ...prev.customer,
                  address: street,
                  addressLine2: area,
                  city: city,
                  state: state,
                  pincode: pincode,
                  landmark: landmark
                }
              }));
              
              const parts = [street, area, city, state, pincode].filter(Boolean);
              setMapQuery(parts.join(', '));
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
          }
        };

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng(e.latlng);
          onMapAction(lat, lng);
        });

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMapAction(lat, lng);
        });

        // Search address geocoding fallback
        const currentAddr = [form.customer.address, form.customer.addressLine2, form.customer.city, form.customer.state, form.customer.pincode].filter(Boolean).join(', ');
        if (currentAddr) {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(currentAddr)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 14);
                marker.setLatLng([lat, lon]);
              }
            })
            .catch(err => console.error('Geocoding search error:', err));
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const currentLat = pos.coords.latitude;
            const currentLng = pos.coords.longitude;
            map.setView([currentLat, currentLng], 14);
            marker.setLatLng([currentLat, currentLng]);
            onMapAction(currentLat, currentLng);
          }, () => {}, { timeout: 5000 });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const username = user?.username || 'admin@vyapar.com';

  useEffect(() => {
    fetchList();
    fetchBoys();

    const socket = io();
    socket.on('delivery_updated', (updatedDelivery) => {
      fetchList();
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deliveries?username=${encodeURIComponent(username)}`);
      const j = await res.json();
      setDeliveries(j);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoys = async () => {
    try {
      const res = await fetch('/api/admin/delivery-boys');
      const j = await res.json();
      setBoys(j);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setShowModal(true);
  };

  const closeCreate = () => {
    setShowModal(false);
    setSelectedInvoiceId('');
    setEditingDelivery(null);
    setMapQuery('');
    setForm({
      customer: { name: '', phone: '', address: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '' },
      items: [],
      charges: 0,
      timeSlot: '',
      partner: 'in-house',
      paymentType: 'COD',
      invoiceId: null
    });
  };

  const handleEditOpen = (d) => {
    setEditingDelivery(d);
    const fullAddr = d.customer?.address || d.deliveryAddress || '';
    setForm({
      customer: {
        name: d.customer?.name || d.customerName || '',
        phone: d.customer?.phone || d.customerPhone || '',
        address: d.customer?.addressLine1 || fullAddr,
        addressLine2: d.customer?.addressLine2 || '',
        city: d.customer?.city || '',
        state: d.customer?.state || '',
        pincode: d.customer?.pincode || '',
        landmark: d.customer?.landmark || ''
      },
      items: d.items || [],
      charges: Number(d.charges || d.billAmount || 0),
      timeSlot: d.timeSlot || d.deliveryTimeSlot || '',
      partner: d.partner || 'in-house',
      paymentType: d.paymentType || 'COD',
      invoiceId: d.invoiceId || null
    });
    if (fullAddr) setMapQuery(fullAddr);
    setSelectedInvoiceId(d.invoiceId || '');
    setShowModal(true);
  };

  const handleInvoiceChange = (e) => {
    const invId = e.target.value;
    setSelectedInvoiceId(invId);
    if (!invId) {
      setForm(s => ({
        ...s,
        customer: { name: '', phone: '', address: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '' },
        items: [],
        charges: 0,
        paymentType: 'COD',
        invoiceId: null
      }));
      setMapQuery('');
      return;
    }
    const sale = (dbData.sales || []).find(s => s.id === invId);
    if (sale) {
      const party = (dbData.parties || []).find(p => p.name === sale.customer && p.type === 'Customer');
      const phone = party ? party.phone : '';
      const address = party ? party.address : '';
      
      let itemsList = [];
      if (Array.isArray(sale.items)) {
        itemsList = sale.items.map(it => ({ name: it.name || it.productId || 'Item', qty: it.qty || 1 }));
      }
      
      const isCod = String(sale.mode).toLowerCase().includes('due') || String(sale.mode).toLowerCase().includes('credit');

      if (address) setMapQuery(address);
      setForm(s => ({
        ...s,
        customer: {
          name: sale.customer || '',
          phone: phone || '',
          address: address || '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        },
        items: itemsList,
        charges: Number(sale.amount) || 0,
        paymentType: isCod ? 'COD' : 'Prepaid',
        invoiceId: sale.id
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const custName = form.customer?.name;
    if (!custName) return alert('Customer name required');
    try {
      const url = editingDelivery 
        ? `/api/admin/deliveries/${editingDelivery._id}` 
        : '/api/admin/deliveries';
      const method = editingDelivery ? 'PUT' : 'POST';

      const customerName = form.customer.name;
      const customerPhone = form.customer.phone;
      // Compose full address from structured fields
      const addrParts = [
        form.customer.address,
        form.customer.addressLine2,
        form.customer.landmark ? `Near ${form.customer.landmark}` : '',
        form.customer.city,
        form.customer.state,
        form.customer.pincode
      ].filter(Boolean);
      const deliveryAddress = addrParts.join(', ');
      const billAmount = form.charges;

      let itemsStrArray = [];
      let itemsObjArray = [];
      if (Array.isArray(form.items)) {
        form.items.forEach(item => {
          if (typeof item === 'string') {
            itemsStrArray.push(item);
            itemsObjArray.push({ name: item, qty: 1 });
          } else if (item && typeof item === 'object') {
            itemsObjArray.push(item);
            itemsStrArray.push(`${item.name || item.productId || 'Item'} x${item.qty || 1}`);
          }
        });
      }

      const bodyPayload = {
        ...form,
        username,
        customerName,
        customerPhone,
        deliveryAddress,
        billAmount,
        assignedDriver: form.assignedTo || null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        closeCreate();
        fetchList();
      } else {
        alert(editingDelivery ? 'Failed to update delivery' : 'Failed to create delivery');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (id, boyId) => {
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryBoyId: boyId })
      });
      if (res.ok) fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const uploadWithProgress = (id, file) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadedBy', 'admin');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(p => ({ ...p, [id]: pct }));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.open('POST', `/api/admin/deliveries/${id}/proof`);
    xhr.send(fd);
  });

  const handleFile = async (id, file) => {
    if (!file) return;
    try {
      await uploadWithProgress(id, file);
      setUploadProgress(p => ({ ...p, [id]: 0 }));
      fetchList();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const markDelivered = async (id) => {
    try {
      const res = await fetch(`/api/admin/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (res.ok) fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const markReturned = async (id) => {
    const reason = prompt('Return reason');
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePushToCourier = async (id) => {
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/third-party/create`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchList();
      } else {
        alert('Failed to push to courier');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelCourier = async (id) => {
    if (!await window.confirm('Are you sure you want to cancel this courier request?')) return;
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/third-party/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchList();
      } else {
        alert('Failed to cancel courier shipment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrackCourier = async (d) => {
    setTrackingDelivery(d);
    setShowTrackingModal(true);
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/admin/deliveries/${d._id}/third-party/track`);
      const json = await res.json();
      if (json.status === 'success') {
        setTrackingTimeline(json.timeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!trackingDelivery) return;
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/admin/deliveries/${trackingDelivery._id}/third-party/track`);
      const json = await res.json();
      if (json.status === 'success') {
        setTrackingTimeline(json.timeline || []);
        fetchList();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleDownloadLabel = (id) => {
    window.open(`/api/admin/deliveries/${id}/third-party/label`, '_blank');
  };

  const getAssignedName = (d) => {
    const assignId = d.assignedTo || d.assignedDriver;
    if (!assignId) return '-';
    const b = boys.find(x => String(x._id) === String(assignId));
    return b ? b.name : assignId;
  };

  const totalDeliveries = deliveries.length;
  const outForDelivery = deliveries.filter(d => ['out_for_delivery', 'Out for delivery'].includes(d.status)).length;
  const deliveredCount = deliveries.filter(d => ['delivered', 'Delivered'].includes(d.status)).length;
  const failedCount = deliveries.filter(d => ['failed', 'returned', 'Failed', 'Returned'].includes(d.status)).length;

  return (
    <>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 0' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>Delivery Management</h2>
            <div style={{ color: 'var(--text-3)', marginTop: 6, fontSize: '14px' }}>Create, assign, upload proofs and track deliveries.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary" onClick={openCreate}><i className="fas fa-truck" style={{ marginRight: 6 }}></i> New Delivery</button>
            <button className="btn" onClick={fetchList} style={{ backgroundColor: 'var(--bg-card)' }}><i className="fas fa-arrows-rotate"></i> Refresh</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '24px' }}>
          <div 
            className="card card--lift" 
            style={{ padding: '15px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => setDrillModal({
              title: "All Delivery Orders",
              cols: ['Order ID', 'Customer', 'Assigned Driver', 'Status', 'Bill Amount'],
              rows: deliveries.map(d => [
                d.orderId || String(d._id).slice(0, 8),
                d.customerName || d.customer?.name || '-',
                getAssignedName(d),
                d.status || '-',
                `₹${d.billAmount || d.charges || 0}`
              ])
            })}
          >
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Deliveries</div>
            <div className="stat__val" style={{ color: 'var(--blue)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{totalDeliveries}</div>
          </div>
          <div 
            className="card card--lift" 
            style={{ padding: '15px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => setDrillModal({
              title: "Out for Delivery Orders",
              cols: ['Order ID', 'Customer', 'Assigned Driver', 'Status', 'Bill Amount'],
              rows: deliveries.filter(d => ['out_for_delivery', 'Out for delivery', 'out of delivery'].includes(d.status)).map(d => [
                d.orderId || String(d._id).slice(0, 8),
                d.customerName || d.customer?.name || '-',
                getAssignedName(d),
                d.status || '-',
                `₹${d.billAmount || d.charges || 0}`
              ])
            })}
          >
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Out for Delivery</div>
            <div className="stat__val" style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{outForDelivery}</div>
          </div>
          <div 
            className="card card--lift" 
            style={{ padding: '15px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => setDrillModal({
              title: "Delivered Orders",
              cols: ['Order ID', 'Customer', 'Assigned Driver', 'Status', 'Bill Amount'],
              rows: deliveries.filter(d => ['delivered', 'Delivered'].includes(d.status)).map(d => [
                d.orderId || String(d._id).slice(0, 8),
                d.customerName || d.customer?.name || '-',
                getAssignedName(d),
                d.status || '-',
                `₹${d.billAmount || d.charges || 0}`
              ])
            })}
          >
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Delivered</div>
            <div className="stat__val" style={{ color: 'var(--green)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{deliveredCount}</div>
          </div>
          <div 
            className="card card--lift" 
            style={{ padding: '15px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => setDrillModal({
              title: "Failed / Returned Orders",
              cols: ['Order ID', 'Customer', 'Assigned Driver', 'Status', 'Bill Amount'],
              rows: deliveries.filter(d => ['failed', 'returned', 'Failed', 'Returned'].includes(d.status)).map(d => [
                d.orderId || String(d._id).slice(0, 8),
                d.customerName || d.customer?.name || '-',
                getAssignedName(d),
                d.status || '-',
                `₹${d.billAmount || d.charges || 0}`
              ])
            })}
          >
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Failed / Returned</div>
            <div className="stat__val" style={{ color: 'var(--red)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{failedCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '0px', overflowX: 'auto', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', background: 'rgba(0,0,0,0.01)' }}>
            {['all', 'pending', 'out_for_delivery', 'delivered', 'failed'].map(filterKey => {
              const label = filterKey === 'all' ? 'All' 
                : filterKey === 'pending' ? 'Pending' 
                : filterKey === 'out_for_delivery' ? 'Out for Delivery' 
                : filterKey === 'delivered' ? 'Delivered' 
                : 'Failed / Returned';
              const isActive = activeFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  onClick={() => setActiveFilter(filterKey)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isActive ? 'none' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-2)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Loading deliveries...</div>
          ) : (
            deliveries.length === 0 ? (
              <div className="empty-state" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 56, color: 'var(--text-3)' }}>🚚</div>
                <h3 style={{ marginTop: 16, fontSize: 18 }}>No deliveries yet</h3>
                <p style={{ color: 'var(--text-3)', marginTop: 8, fontSize: 14 }}>Create delivery orders and upload proof photos here.</p>
                <div style={{ marginTop: 20 }}>
                  <button className="btn btn--primary" onClick={openCreate}>New Delivery</button>
                </div>
              </div>
            ) : (() => {
              const filteredDeliveries = deliveries.filter(d => {
                if (activeFilter === 'all') return true;
                const s = (d.status || '').toLowerCase();
                if (activeFilter === 'pending') return ['pending', 'pending_partner_pickup', 'assigned', 'rescheduled'].includes(s);
                if (activeFilter === 'out_for_delivery') return ['out_for_delivery', 'out of delivery', 'out for delivery'].includes(s);
                if (activeFilter === 'delivered') return s === 'delivered';
                if (activeFilter === 'failed') return ['failed', 'returned'].includes(s);
                return true;
              });

              if (filteredDeliveries.length === 0) {
                return (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                    No deliveries match the selected status filter.
                  </div>
                );
              }

              return (
                <table className="tbl">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer & Items</th>
                    <th>Status</th>
                    <th>Assigned Driver</th>
                    <th>Proof Images</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map(d => {
                    const statusStr = (d.status || '').toLowerCase();
                    const isTerminal = ['delivered', 'failed', 'returned', 'cancelled'].includes(statusStr);
                    const isTransit = ['out_for_delivery', 'out of delivery', 'out for delivery'].includes(statusStr);
                    return (
                      <tr key={d._id}>
                        <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{d.orderId || String(d._id).slice(0, 8)}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{d.customer?.name || d.customerName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>📞 {d.customer?.phone || d.customerPhone}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>📍 {d.customer?.address || d.deliveryAddress}</div>
                          {d.invoiceId && <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4, fontWeight: 'bold' }}>📄 Invoice: {d.invoiceId}</div>}
                          {d.items && d.items.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6, background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              📦 {d.items.map(it => typeof it === 'string' ? it : `${it.name} x${it.qty}`).join(', ')}
                            </div>
                          )}
                          {d.partner && d.partner !== 'in-house' && (
                            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, fontWeight: 'bold' }}>
                              <i className="fas fa-truck"></i> {d.partner.toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${['delivered', 'Delivered'].includes(d.status) ? 'badge--green' : ['failed', 'returned', 'Failed', 'Returned'].includes(d.status) ? 'badge--red' : ['out_for_delivery', 'Out for delivery', 'Out For Delivery'].includes(d.status) ? 'badge--blue' : 'badge--yellow'}`} style={{ textTransform: 'capitalize' }}>
                            {(d.status || '').replace('_', ' ')}
                          </span>
                          {isTransit && d.otp && (
                            <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4, fontWeight: 'bold' }}>
                              🔑 OTP: {d.otp}
                            </div>
                          )}
                          {statusStr === 'failed' && (d.failedReason || d.returnInfo?.reason) && (
                            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 'bold' }}>
                              ⚠️ Reason: {d.failedReason || d.returnInfo?.reason}
                            </div>
                          )}
                          {statusStr === 'rescheduled' && (d.rescheduleDate || d.rescheduleSlot) && (
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: 'bold' }}>
                              📅 Resched: {d.rescheduleDate ? new Date(d.rescheduleDate).toLocaleDateString() : ''} {d.rescheduleSlot || ''}
                            </div>
                          )}
                          {d.returnInitiated && (
                            <div style={{ fontSize: 11, color: '#ec4899', marginTop: 4, fontWeight: 'bold' }}>
                              ↩️ Return Initiated
                              {d.returnInitiatedAt && <span style={{ fontSize: 10, fontWeight: 'normal', color: 'var(--text-3)' }}> ({new Date(d.returnInitiatedAt).toLocaleDateString()})</span>}
                            </div>
                          )}
                          {d.returnInfo && (
                            <div style={{ fontSize: 11, color: '#ec4899', marginTop: 4, fontWeight: 'bold' }}>
                              ↩️ Returned: {d.returnInfo.reason}
                              {d.returnInfo.date && <span style={{ fontSize: 10, fontWeight: 'normal', color: 'var(--text-3)' }}> ({new Date(d.returnInfo.date).toLocaleDateString()})</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{getAssignedName(d)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {d.proof && d.proof.length > 0 ? d.proof.map((p, i) => (
                              <img key={i} src={p.url || p.data} alt={`proof-${i}`} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setPreviewImage(p.url || p.data)} />
                            )) : d.proofPhotoUrl ? (
                              <img src={d.proofPhotoUrl} alt="proof" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setPreviewImage(d.proofPhotoUrl)} />
                            ) : (
                              <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>—</span>
                            )}
                          </div>
                        {uploadProgress[d._id] > 0 && (
                          <div style={{ marginTop: 6, width: 80 }}>
                            <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4 }}>
                              <div style={{ width: `${uploadProgress[d._id]}%`, height: 4, background: 'var(--accent)', borderRadius: 4 }}></div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {isTerminal ? (
                            <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>—</span>
                          ) : d.partner && d.partner !== 'in-house' ? (
                            <>
                              {['pending_partner_pickup', 'pending', 'pending_partner'].includes(statusStr) ? (
                                <button className="btn btn--sm" onClick={() => handlePushToCourier(d._id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}>
                                  🚀 Push to Courier
                                </button>
                              ) : (
                                <>
                                  <button className="btn btn--sm" onClick={() => handleTrackCourier(d)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                                    🔍 Track
                                  </button>
                                  <button className="btn btn--sm" onClick={() => handleDownloadLabel(d._id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#64748b', color: '#ffffff', border: 'none' }}>
                                    📄 Label
                                  </button>
                                </>
                              )}
                              {!['delivered', 'cancelled'].includes(statusStr) && (
                                <button className="btn btn--sm" onClick={() => handleCancelCourier(d._id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                  ❌ Cancel
                                </button>
                              )}
                              <button className="btn btn--sm" type="button" onClick={() => handleEditOpen(d)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}><i className="fas fa-pen"></i> Edit</button>
                            </>
                          ) : isTransit ? (
                            <>
                              <label className="btn" style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(d._id, e.target.files[0])} />
                                <i className="fas fa-upload"></i> Proof
                              </label>
                              <button className="btn btn--sm" onClick={() => markDelivered(d._id)} style={{ padding: '4px 8px', fontSize: 11 }}>Delivered</button>
                              <button className="btn btn--sm" onClick={() => markReturned(d._id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Return</button>
                              <button className="btn btn--sm" type="button" onClick={() => handleEditOpen(d)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}><i className="fas fa-pen"></i> Edit</button>
                            </>
                          ) : (
                            <>
                              <select 
                                onChange={(e) => handleAssign(d._id, e.target.value)} 
                                value={d.assignedTo || d.assignedDriver || ""}
                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                              >
                                <option value="">Assign Driver</option>
                                {boys.map(b => <option key={b._id} value={b._id}>{b.name} ({b.phone})</option>)}
                              </select>
                              <button className="btn btn--sm" type="button" onClick={() => handleEditOpen(d)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}><i className="fas fa-pen"></i> Edit</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
              );
            })()
          )}
        </div>
      </div>

      {/* Centered Premium White Modal Create */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal" style={{ display: 'block', maxWidth: '580px', width: '100%', margin: '0 20px', borderRadius: '12px', background: '#ffffff', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.05)', color: '#1e293b' }}>
            <div className="modal__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>{editingDelivery ? 'Edit Delivery Order' : 'New Delivery Order'}</h3>
              <button className="btn--icon" type="button" onClick={closeCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}><i className="fas fa-xmark"></i></button>
            </div>
            <form onSubmit={handleCreate}>
              
              {/* Sales Invoice Selection (Optional) */}
              <div className="fg" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Link to Sales Invoice (Optional)</label>
                <select 
                  className="fi" 
                  value={selectedInvoiceId} 
                  onChange={handleInvoiceChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                >
                  <option value="">-- Choose Sales Invoice --</option>
                  {(dbData.sales || []).map(s => (
                    <option key={s.id} value={s.id}>{s.id} - {s.customer} (₹{s.amount})</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Selecting an invoice will auto-populate customer details, items, and billing amount.</div>
              </div>

              {/* Customer Row */}
              <div className="form-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Customer Name <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    className="fi" 
                    value={form.customer.name} 
                    onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, name: e.target.value } }))} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                    required
                  />
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Phone Number</label>
                  <input 
                    className="fi" 
                    value={form.customer.phone} 
                    onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, phone: e.target.value } }))} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* ── Delivery Address Section ── */}
              <div style={{ marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#1e293b' }}>Delivery Address</h4>
                </div>

                {/* Address Line 1 */}
                <div className="fg" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>Flat / House / Building *</label>
                  <input 
                    className="fi" 
                    placeholder="e.g. Flat 201, Green Towers" 
                    value={form.customer.address} 
                    onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, address: e.target.value } }))} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  />
                </div>

                {/* Address Line 2 */}
                <div className="fg" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>Street / Area / Colony</label>
                  <input 
                    className="fi" 
                    placeholder="e.g. MG Road, Sector 12" 
                    value={form.customer.addressLine2} 
                    onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, addressLine2: e.target.value } }))} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  />
                </div>

                {/* City + State */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>City</label>
                    <input 
                      className="fi" 
                      placeholder="e.g. Pune" 
                      value={form.customer.city} 
                      onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, city: e.target.value } }))} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>State</label>
                    <select 
                      className="fi" 
                      value={form.customer.state} 
                      onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, state: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                    >
                      <option value="">Select State</option>
                      {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','J&K','Ladakh','Puducherry'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pincode + Landmark */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>Pincode</label>
                    <input 
                      className="fi" 
                      placeholder="e.g. 411001" 
                      maxLength={6} 
                      value={form.customer.pincode} 
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setForm(s => ({ ...s, customer: { ...s.customer, pincode: v } })); }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14, letterSpacing: 2, fontWeight: 700 }}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#475569' }}>Landmark (optional)</label>
                    <input 
                      className="fi" 
                      placeholder="e.g. Near City Mall" 
                      value={form.customer.landmark} 
                      onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, landmark: e.target.value } }))} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Interactive Map Picker */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 12, color: '#475569' }}>
                    🗺️ Interactive Map (Tap to Pin & Autofill)
                  </label>
                  <div 
                    ref={mapContainerRef} 
                    style={{ height: '220px', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', background: '#e2e8f0', position: 'relative', zIndex: 1 }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    Tap/drag the marker on the map. The address fields above will autofill automatically.
                  </div>
                </div>

                {/* Locate on Map button */}
                <button 
                  type="button"
                  onClick={() => {
                    const parts = [form.customer.address, form.customer.addressLine2, form.customer.city, form.customer.state, form.customer.pincode].filter(Boolean);
                    setMapQuery(parts.join(', '));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px dashed #3b82f6', background: 'rgba(59,130,246,0.05)', color: '#3b82f6', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: mapQuery ? 14 : 0, transition: 'all 0.2s' }}
                >
                  <i className="fas fa-map-location-dot"></i> Locate on Google Maps
                </button>

                {/* Google Maps Embed */}
                {mapQuery && (
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: 2 }}>
                    <iframe
                      title="Delivery Location Map"
                      width="100%"
                      height="200"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    />
                    <div style={{ padding: '6px 10px', background: '#ffffff', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fas fa-location-dot" style={{ color: '#ef4444' }}></i>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapQuery}</span>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Open in Maps ↗</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Time slot and partner */}
              <div className="form-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Preferred Time Slot</label>
                  <select 
                    className="fi" 
                    value={form.timeSlot || ''} 
                    onChange={e => setForm(s => ({ ...s, timeSlot: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  >
                    <option value="">Select Time Slot</option>
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Delivery Partner</label>
                  <select 
                    className="fi" 
                    value={form.partner || 'in-house'}
                    onChange={e => {
                      const newPartner = e.target.value;
                      let baseAmt = Number(form.charges) || 0;
                      if (selectedInvoiceId) {
                        const sale = (dbData.sales || []).find(s => s.id === selectedInvoiceId);
                        if (sale) baseAmt = Number(sale.amount) || 0;
                      }
                      const estimated = calculateEstimatedCharges(newPartner, baseAmt);
                      setForm(s => ({ ...s, partner: newPartner, charges: estimated }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  >
                    <option value="in-house">In-House Delivery</option>
                    <option value="shiprocket">Shiprocket (API Stub)</option>
                    <option value="delhivery">Delhivery (API Stub)</option>
                    <option value="dunzo">Dunzo (API Stub)</option>
                  </select>
                </div>
              </div>

              {/* Charges and Payment type */}
              <div className="form-row" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Charges / Bill Amount (₹)</label>
                  <input 
                    className="fi" 
                    type="number" 
                    value={form.charges} 
                    onChange={e => setForm(s => ({ ...s, charges: Number(e.target.value) }))} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  />
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#475569' }}>Payment Type</label>
                  <select 
                    className="fi" 
                    value={form.paymentType || 'COD'} 
                    onChange={e => setForm(s => ({ ...s, paymentType: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontSize: 14 }}
                  >
                    <option value="COD">Cash On Delivery (COD)</option>
                    <option value="Prepaid">Prepaid (Paid Online/Cash)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <button className="btn" type="button" onClick={closeCreate} style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>Cancel</button>
                <button className="btn btn--primary" type="submit"><i className="fas fa-check" style={{ marginRight: 6 }}></i> Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setPreviewImage(null)}>
          <div className="modal" style={{ display: 'block', maxWidth: '640px', width: '100%', margin: '0 20px', borderRadius: '12px', background: '#ffffff', padding: '16px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Proof Image Preview</h4>
              <button className="btn--icon" type="button" onClick={() => setPreviewImage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}><i className="fas fa-xmark"></i></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 8, overflow: 'hidden' }}>
              <img src={previewImage} alt="Proof Full Size" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }} />
            </div>
          </div>
        </div>
      )}

      {/* 3PL Tracking Stepper Modal */}
      {showTrackingModal && trackingDelivery && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal" style={{ display: 'block', maxWidth: '500px', width: '100%', margin: '0 20px', borderRadius: '12px', background: '#ffffff', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', color: '#1e293b' }}>
            <div className="modal__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '16px' }}>Live Shipment Tracking</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Partner: <strong style={{ textTransform: 'uppercase' }}>{trackingDelivery.partner}</strong> | ID: {trackingDelivery.thirdPartyTrackingId || 'SR-MOCK-999'}</div>
              </div>
              <button className="btn--icon" type="button" onClick={() => { setShowTrackingModal(false); setTrackingDelivery(null); setTrackingTimeline([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}><i className="fas fa-xmark"></i></button>
            </div>

            {trackingLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 10, display: 'block', margin: '0 auto 10px auto' }}></i>
                <div>Polling live carrier status...</div>
              </div>
            ) : (
              <div>
                {/* Stepper container */}
                <div style={{ padding: '10px 0 20px 10px' }}>
                  {trackingTimeline.map((step, idx) => {
                    const isLast = idx === trackingTimeline.length - 1;
                    return (
                      <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: isLast ? 0 : 24 }}>
                        {/* Line connector */}
                        {!isLast && (
                          <div style={{ position: 'absolute', left: 11, top: 22, bottom: 0, width: 2, background: '#cbd5e1' }}></div>
                        )}
                        {/* Circle badge indicator */}
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isLast ? '#10b981' : '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, border: isLast ? '4px solid #d1fae5' : '1px solid #cbd5e1', color: isLast ? '#ffffff' : '#64748b', fontSize: 10 }}>
                          {isLast ? '✓' : idx + 1}
                        </div>
                        {/* Text labels */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: 14, color: isLast ? '#10b981' : '#1e293b' }}>{step.status}</strong>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{step.time ? new Date(step.time).toLocaleTimeString() : ''}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{step.desc}</div>
                          {step.loc && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}><i className="fas fa-location-dot" style={{ marginRight: 4 }}></i> {step.loc}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 12 }}>
                  <button className="btn" type="button" onClick={handleRefreshTracking} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#1e293b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <i className="fas fa-rotate"></i> Poll Status Update
                  </button>
                  <button className="btn btn--primary" type="button" onClick={() => { setShowTrackingModal(false); setTrackingDelivery(null); setTrackingTimeline([]); }} style={{ flex: 1 }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Global Drill-down Modal */}
      {drillModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl transition-all duration-300 text-slate-800" 
            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh' }}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase" style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics Detailed Breakdown</span>
                <h3 className="text-xl font-black mt-0.5" style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>{drillModal.title}</h3>
              </div>
              <button
                onClick={() => setDrillModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <i className="fas fa-xmark text-slate-500" style={{ fontSize: '18px', color: '#64748b' }}></i>
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {drillModal.cols.map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillModal.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : '#fafafa'
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 16px', color: '#475569' }}>{val}</td>
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
              className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-3 rounded-full transition"
              style={{ width: '100%', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </>
  );
}
