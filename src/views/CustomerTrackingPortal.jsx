import React, { useState, useEffect, useRef } from 'react';

export default function CustomerTrackingPortal({ orderIdParam }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);

  const orderId = orderIdParam || new URLSearchParams(window.location.search).get('order') || window.location.pathname.split('/track/')[1];

  useEffect(() => {
    if (!orderId) {
      setError("No Order ID provided for live tracking");
      setLoading(false);
      return;
    }

    const fetchTrackingData = async () => {
      try {
        const res = await fetch(`/api/track/order/${encodeURIComponent(orderId)}`);
        if (!res.ok) {
          throw new Error("Order not found or tracking link invalid");
        }
        const data = await res.json();
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 5000); // Polling every 5s for live radar
    return () => clearInterval(interval);
  }, [orderId]);

  // Leaflet Map Initialization and Realtime Movement
  useEffect(() => {
    if (order && mapContainerRef.current && window.L) {
      const storeLoc = order.locations?.store || { lat: 12.9716, lng: 77.5946 };
      const custLoc = order.locations?.customer || { lat: 12.9352, lng: 77.6245 };
      const driverLoc = order.locations?.driver || storeLoc;

      if (!mapRef.current) {
        const map = window.L.map(mapContainerRef.current).setView([driverLoc.lat, driverLoc.lng], 13);
        mapRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Custom Icon Creators
        const createCustomIcon = (bgColor, iconClass) => {
          return window.L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="background: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fas ${iconClass}" style="font-size: 16px;"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
        };

        // Store Marker
        window.L.marker([storeLoc.lat, storeLoc.lng], {
          icon: createCustomIcon('#3b82f6', 'fa-store')
        }).addTo(map).bindPopup(`<b>${storeLoc.name || 'Store'}</b><br/>Merchant Fulfillment Warehouse`);

        // Customer Marker
        window.L.marker([custLoc.lat, custLoc.lng], {
          icon: createCustomIcon('#10b981', 'fa-house-user')
        }).addTo(map).bindPopup(`<b>${order.customerName}</b><br/>${order.deliveryAddress}`);

        // Driver Live Marker
        const driverMarker = window.L.marker([driverLoc.lat, driverLoc.lng], {
          icon: createCustomIcon('#f59e0b', 'fa-motorcycle')
        }).addTo(map).bindPopup(`<b>${order.driver?.fullName || 'Delivery Partner'}</b><br/>${order.driver?.vehicleNumber || 'En Route'}`);
        driverMarkerRef.current = driverMarker;

        // Draw Route Polyline
        const polyline = window.L.polyline([
          [storeLoc.lat, storeLoc.lng],
          [driverLoc.lat, driverLoc.lng],
          [custLoc.lat, custLoc.lng]
        ], { color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } else {
        // Map is already initialized: smoothly update driver position in real time!
        if (driverMarkerRef.current && driverLoc.lat && driverLoc.lng) {
          driverMarkerRef.current.setLatLng([driverLoc.lat, driverLoc.lng]);
        }
      }
    }
  }, [order]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b1220', color: '#fff', gap: '16px' }}>
        <i className="fas fa-motorcycle fa-spin" style={{ fontSize: '48px', color: '#38bdf8' }}></i>
        <h2>Connecting to Live Delivery Radar...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b1220', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <i className="fas fa-triangle-exclamation" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}></i>
        <h2 style={{ margin: 0 }}>Tracking Link Expired or Invalid</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px', marginTop: '8px' }}>{error || "Could not find active delivery details for this order."}</p>
        <button className="btn" onClick={() => window.location.href = '/'} style={{ marginTop: '20px', background: '#38bdf8', color: '#0f172a', fontWeight: 800 }}>Return to Home</button>
      </div>
    );
  }

  const steps = [
    { key: 'Assigned', label: 'Order Placed', icon: 'fa-file-invoice-dollar' },
    { key: 'Accepted', label: 'Confirmed', icon: 'fa-circle-check' },
    { key: 'Picked Up', label: 'Picked Up', icon: 'fa-boxes-packing' },
    { key: 'Out for delivery', label: 'On The Way', icon: 'fa-motorcycle' },
    { key: 'Delivered', label: 'Delivered', icon: 'fa-house-flag' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : (order.status === 'Delivered' ? 4 : 3);

  return (
    <div style={{ background: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Top Navigation Bar */}
      <header style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', sticky: 'top', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #38bdf8, #2563eb)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900 }}>
            <i className="fas fa-cube"></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Vyapar Live Delivery Tracker</h1>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.5px' }}>HYPERLOCAL EXPRESS RADAR</span>
          </div>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#38bdf8', fontSize: '13px', fontWeight: 800 }}>
          Order: {order.orderId}
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Zomato-Style Live Status Stepper Banner */}
        <section style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                {order.status === 'Out for delivery' ? '🛵 Driver is on the way to your doorstep!' : order.status === 'Delivered' ? '🎉 Order Successfully Delivered!' : order.status}
              </h2>
            </div>
            {order.status === 'Out for delivery' && (
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '12px 20px', borderRadius: '12px', textAlign: 'center', color: '#fff', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {order.isLiveGps && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }}></span>}
                  {order.isLiveGps ? '🛰️ LIVE SATELLITE RADAR' : 'ESTIMATED ARRIVAL'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '2px' }}>
                  {order.etaMinutes ? `~${order.etaMinutes} Mins` : '10 - 15 Mins'}
                  {order.distanceKm ? ` (${order.distanceKm} km away)` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Stepper Steps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '10px' }}>
            {steps.map((step, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, minWidth: '90px', position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isCurrent ? '#38bdf8' : isCompleted ? '#10b981' : '#1e293b',
                    color: isCurrent ? '#0f172a' : isCompleted ? '#fff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 20px #38bdf8' : 'none',
                    border: '2px solid rgba(255,255,255,0.1)'
                  }}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: isCompleted ? 800 : 500, color: isCompleted ? '#fff' : '#64748b', textAlign: 'center' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* OTP Alert Box if Out for Delivery */}
        {order.status === 'Out for delivery' && (
          <div style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fas fa-shield-key" style={{ fontSize: '24px', color: '#f59e0b' }}></i>
              <div>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block' }}>Delivery Verification OTP</strong>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Please share this 6-digit OTP with your delivery partner upon arrival to complete delivery.</span>
              </div>
            </div>
            <div style={{ background: '#f59e0b', color: '#0f172a', padding: '8px 18px', borderRadius: '8px', fontSize: '20px', fontWeight: 900, letterSpacing: '3px' }}>
              {order.otpRequired ? '******' : 'AUTO-VERIFY'}
            </div>
          </div>
        )}

        {/* Live Map & Driver Profile Dual Column */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Interactive OpenStreetMap */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', overflow: 'hidden', height: '380px', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Delivery Partner Details & Item Invoice Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Driver Profile Card */}
            {order.driver ? (
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={order.driver.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt="Driver Avatar" 
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Delivery Executive</span>
                  <h3 style={{ margin: '2px 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#fff' }}>{order.driver.fullName}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    {order.driver.vehicleType} • {order.driver.vehicleNumber}
                  </p>
                </div>
                <a 
                  href={`tel:${order.driver.phone}`} 
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '18px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                  title="Call Driver"
                >
                  <i className="fas fa-phone"></i>
                </a>
              </div>
            ) : (
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                Assigning nearest delivery partner...
              </div>
            )}

            {/* Invoice & Order Summary */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fff' }}>Bill & Items Breakdown</h4>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 8px', borderRadius: '6px' }}>{order.paymentType}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                {order.items.map((item, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• {item}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: '16px', color: '#fff' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#38bdf8' }}>₹{order.billAmount}</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
