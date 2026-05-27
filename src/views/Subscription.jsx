import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Subscription() {
  const { user, updateUser } = useApp();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [amount, setAmount] = useState(0);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/super/subscription-info?username=${encodeURIComponent(user.username)}`);
      if (res.ok) setInfo(await res.json());
      setLoading(false);
    }
    load();
    // load plans
    (async function loadPlans(){
      try{
        const r = await fetch('/api/super/plans');
        if (r.ok) setPlans(await r.json());
      }catch(e){}
    })();
  }, [user]);

  const renew = async () => {
    const res = await fetch('/api/super/renew', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, amount, days }) });
    if (res.ok) { const j = await res.json(); setInfo(prev => ({ ...prev, subscriptionExpiry: j.subscriptionExpiry })); alert('Renewed'); }
    else alert('Failed');
  };

  const payForPlan = async () => {
    if (!selectedPlan) return alert('Select a plan');
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, planName: selectedPlan }) });
      if (res.ok) {
        const j = await res.json();
        setInfo(prev => ({ ...prev, subscriptionExpiry: j.subscription && j.subscription.expiry ? j.subscription.expiry : j.subscriptionExpiry }));
        // update user onboarding/subscription flags
        if (updateUser) updateUser({ onboardingRequired: false, subscription: j.subscription || { active: true, expiry: (j.subscription && j.subscription.expiry) || null } });
        alert('Payment recorded and subscription activated');
      } else {
        const e = await res.json();
        alert(e.message || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuto = async (val) => {
    const res = await fetch('/api/super/auto-renew', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, autoRenew: val }) });
    if (res.ok) alert('Updated');
  };

  if (loading) return <div>Loading subscription...</div>;

  return (
    <div className="page-content" style={{ padding: 16 }}>
      <h2>Subscription</h2>
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        {info ? (
          <div>
            <div className="fg"><label>Plan</label><div className="sub-meta">{info.planName || '—'} ({info.planCycle || '—'})</div></div>
            <div className="fg"><label>Expiry</label><div className="sub-meta">{info.subscriptionExpiry || 'Not set'}</div></div>
            <div className="fg"><label>Last payment</label><div className="sub-meta">{info.last_payment || '—'}</div></div>
            <div className="fg"><label>Active</label><div className="sub-meta">{info.active ? 'Yes' : 'No'}</div></div>
          </div>
        ) : <div>No subscription data.</div>}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3>Renew / Upgrade</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8, color: '#64748b' }}>Select Plan</div>
            {plans.length ? plans.map(p => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name} <span style={{ fontSize: 12, color: '#94a3b8' }}>({p.cycle})</span></div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{p.features}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{p.price}</div>
                  <div style={{ marginTop: 6 }}>
                    <button className={selectedPlan === p.name ? 'btn btn--primary' : 'btn btn--sm'} onClick={() => setSelectedPlan(p.name)}>{selectedPlan === p.name ? 'Selected' : 'Select'}</button>
                  </div>
                </div>
              </div>
            )) : <div>No plans available</div>}
          </div>
          <div style={{ width: 220 }}>
            <div style={{ marginBottom: 8 }}><strong>Pay & Activate</strong></div>
            <div style={{ marginBottom: 8 }}>Selected: {selectedPlan || '—'}</div>
            <button onClick={payForPlan} className="btn btn--primary" disabled={loading || !selectedPlan}>{loading ? 'Processing...' : 'Pay & Activate'}</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3>Auto-Renew</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={()=>toggleAuto(true)} className="btn">Turn ON</button>
          <button onClick={()=>toggleAuto(false)} className="btn">Turn OFF</button>
        </div>
      </div>
    </div>
  );
}
