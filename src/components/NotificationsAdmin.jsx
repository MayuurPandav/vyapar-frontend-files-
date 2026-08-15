import React, { useState } from 'react';
import TargetBuilder from './TargetBuilder';

export default function NotificationsAdmin() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ 'in-app': true, email: false, sms: false, whatsapp: false });
  const [filters, setFilters] = useState({ planName: '', city: '', state: '', shopType: '', trialOnly: false, expiringOnly: false });
  const [showTargetBuilder, setShowTargetBuilder] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  async function submit(e) {
    e.preventDefault();
    const ch = Object.keys(channels).filter(k => channels[k]);
    const body = { title, message, channels: ch, scheduledAt: scheduledAt || null, immediate: scheduledAt ? false : true, filters };
    const res = await fetch('/api/admin/notifications/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    alert('Result: ' + JSON.stringify(j));
  }

  return (
    <div style={{padding:20}}>
      <h3>Announcements & Notifications</h3>
      <div style={{marginBottom:12}}>
        <a href="/super_admin.html#/notifications/report">Open Reports</a> | <a href="/super_admin.html#/notifications/templates">Templates</a> | <a href="/super_admin.html#/notifications/logs">Delivery Logs</a>
      </div>
      <form onSubmit={submit}>
        <div>
          <label>Title</label><br />
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%'}} />
        </div>
        <div>
          <label>Message</label><br />
          <textarea value={message} onChange={e=>setMessage(e.target.value)} style={{width:'100%',height:120}} />
        </div>
        <div>
          <label>Channels</label><br />
          {Object.keys(channels).map(k => (
            <label key={k} style={{marginRight:10}}>
              <input type="checkbox" checked={channels[k]} onChange={() => setChannels(prev=>({...prev,[k]:!prev[k]}))} /> {k}
            </label>
          ))}
        </div>
        <div style={{marginTop:10}}>
          <h4>Targeting Filters</h4>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setShowTargetBuilder(true)}>Open Targeting Builder</button>
          </div>
          <div><input placeholder="Plan Name" value={filters.planName} onChange={e=>setFilters(prev=>({...prev,planName:e.target.value}))} /></div>
          <div><input placeholder="City" value={filters.city} onChange={e=>setFilters(prev=>({...prev,city:e.target.value}))} /></div>
          <div><input placeholder="State" value={filters.state} onChange={e=>setFilters(prev=>({...prev,state:e.target.value}))} /></div>
          <div><input placeholder="Shop Type" value={filters.shopType} onChange={e=>setFilters(prev=>({...prev,shopType:e.target.value}))} /></div>
          <div><label><input type="checkbox" checked={filters.trialOnly} onChange={e=>setFilters(prev=>({...prev,trialOnly:e.target.checked}))} /> Trial shops only</label></div>
          <div><label><input type="checkbox" checked={filters.expiringOnly} onChange={e=>setFilters(prev=>({...prev,expiringOnly:e.target.checked}))} /> Expiring shops only</label></div>
        </div>
        {showTargetBuilder && <TargetBuilder initialFilters={filters} onClose={() => setShowTargetBuilder(false)} onApply={(f)=>{ setFilters(prev=>({...prev,...f})); setShowTargetBuilder(false); }} />}
        <div>
          <label>Scheduled At (optional)</label><br />
          <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} />
        </div>
        <div style={{marginTop:10}}>
          <button type="submit">Send</button>
        </div>
      </form>
    </div>
  );
}
