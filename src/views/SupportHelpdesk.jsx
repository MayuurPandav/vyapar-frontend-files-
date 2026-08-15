import React, { useState, useEffect, useRef } from 'react';

/* ─── helpers ─── */
const formatCurr = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v || 0);
const formatNum  = v => new Intl.NumberFormat('en-IN').format(v || 0);
const timeAgo = d => {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };
const CATEGORIES = ['Billing Issue', 'Technical Bug', 'Feature Request', 'GST / Tax Help', 'Invoice Issue', 'Inventory Issue', 'Delivery Issue', 'Payment Issue', 'Account Access', 'Subscription Issue', 'General'];

/* ─── KPI Card ─── */
const KPI = ({ title, value, sub, icon, color, onClick }) => (
  <div className="card card--lift" onClick={onClick} style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px', cursor: onClick ? 'pointer' : 'default' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
      <i className={icon}></i>
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-1)' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  </div>
);

/* ─── Badge ─── */
const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${color}18`, color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
    {(text || '').replace('_', ' ')}
  </span>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function SupportHelpdesk() {
  const [tab, setTab]           = useState('dashboard'); // dashboard | tickets | ticket-detail | faq
  const [stats, setStats]       = useState(null);
  const [tickets, setTickets]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [filters, setFilters]   = useState({ status: '', priority: '', category: '', search: '' });
  const [page, setPage]         = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [staff, setStaff]       = useState([]);
  const [faqs, setFaqs]         = useState([]);
  const [faqForm, setFaqForm]   = useState({ question: '', answer: '', order: 0, editing: null });
  const [loading, setLoading]   = useState(false);
  const chatEndRef = useRef(null);
  const [detailModal, setDetailModal] = useState(null); // { title, status, rows: [], loading: false }

  const handleOpenTicketsModal = async (statusFilter) => {
    setDetailModal({ title: `${statusFilter.replace('_', ' ').toUpperCase()} Tickets`, status: statusFilter, rows: [], loading: true });
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const r = await fetch(`/api/admin/support/tickets?${params}`);
      const j = await r.json();
      if (j.data) {
        setDetailModal(prev => prev ? { ...prev, rows: j.data, loading: false } : null);
      } else {
        setDetailModal(prev => prev ? { ...prev, loading: false } : null);
      }
    } catch (err) {
      console.error(err);
      setDetailModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  /* ─── fetch helpers ─── */
  const fetchStats = async () => {
    try {
      const r = await fetch('/api/admin/support/stats');
      const j = await r.json();
      if (j.status === 'success' || j.totals) setStats(j);
      else setStats({ totals: { total: 0, open: 0, inprogress: 0, resolved: 0 }, topCategories: [] });
    } catch {
      setStats({ totals: { total: 0, open: 0, inprogress: 0, resolved: 0 }, topCategories: [] });
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.category) params.set('category', filters.category);
      if (filters.search) params.set('search', filters.search);
      const r = await fetch(`/api/admin/support/tickets?${params}`);
      const j = await r.json();
      if (j.data) { setTickets(j.data); setTotal(j.total || 0); }
    } catch {} finally { setLoading(false); }
  };

  const fetchTicketDetail = async (id) => {
    try {
      const r = await fetch(`/api/admin/support/tickets/${id}`);
      const j = await r.json();
      if (j.ticket) { setSelectedTicket(j.ticket); setComments(j.comments || []); }
    } catch {}
  };

  const fetchStaff = async () => {
    try {
      const r = await fetch('/api/admin/support/staff');
      const j = await r.json();
      if (j.staff) setStaff(j.staff);
    } catch {}
  };

  const fetchFaqs = async () => {
    try {
      const r = await fetch('/api/admin/faq');
      const j = await r.json();
      if (j.faqs) setFaqs(j.faqs);
      else if (j.data) setFaqs(j.data);
      else setFaqs([]);
    } catch {
      setFaqs([]);
    }
  };

  /* ─── initial load ─── */
  useEffect(() => { fetchStats(); fetchStaff(); }, []);
  useEffect(() => { if (tab === 'tickets') fetchTickets(); }, [tab, page, filters]);
  useEffect(() => { if (tab === 'faq') fetchFaqs(); }, [tab]);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  /* ─── ticket actions ─── */
  const openTicketDetail = (id) => {
    fetchTicketDetail(id);
    setTab('ticket-detail');
  };

  const postComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    try {
      await fetch(`/api/admin/support/tickets/${selectedTicket._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket._id, author: 'Support Agent', message: newComment })
      });
      setNewComment('');
      fetchTicketDetail(selectedTicket._id);
    } catch {}
  };

  const updateTicket = async (field, value) => {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/admin/support/tickets/${selectedTicket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, actor: 'agent' })
      });
      fetchTicketDetail(selectedTicket._id);
    } catch {}
  };

  /* ─── FAQ actions ─── */
  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    try {
      if (faqForm.editing) {
        await fetch(`/api/admin/faq/${faqForm.editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: faqForm.question, answer: faqForm.answer, order: faqForm.order })
        });
      } else {
        await fetch('/api/admin/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: faqForm.question, answer: faqForm.answer, order: faqForm.order })
        });
      }
      setFaqForm({ question: '', answer: '', order: 0, editing: null });
      fetchFaqs();
    } catch {}
  };

  const deleteFaq = async (id) => {
    if (!await window.confirm('Delete this FAQ entry?')) return;
    try {
      await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      fetchFaqs();
    } catch {}
  };

  const editFaq = (faq) => {
    setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order || 0, editing: faq._id });
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: DASHBOARD
     ═══════════════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    if (!stats) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>;

    const totals = stats.totals || {};
    const topCats = stats.topCategories || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <KPI title="Total Tickets" value={formatNum(totals.total)} sub="All time" icon="fas fa-ticket-alt" color="#3b82f6" onClick={() => handleOpenTicketsModal('all')} />
          <KPI title="Open Tickets" value={formatNum(totals.open)} sub="Awaiting attention" icon="fas fa-envelope-open" color="#f59e0b" onClick={() => handleOpenTicketsModal('open')} />
          <KPI title="In Progress" value={formatNum(totals.inprogress)} sub="Being worked on" icon="fas fa-spinner" color="#8b5cf6" onClick={() => handleOpenTicketsModal('in_progress')} />
          <KPI title="Resolved" value={formatNum(totals.resolved)} sub="Successfully closed" icon="fas fa-check-circle" color="#10b981" onClick={() => handleOpenTicketsModal('resolved')} />
        </div>

        {/* Avg resolution + SLA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
              <i className="fas fa-clock" style={{ marginRight: '8px', color: '#3b82f6' }}></i> SLA & Response Metrics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600 }}>Avg Resolution Time</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>{Number(stats.avgResolutionHours || 0).toFixed(1)} hrs</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600 }}>SLA Compliance Rate</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{stats.slaCompliance != null ? `${stats.slaCompliance}%` : '—'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600 }}>Breached SLAs</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{stats.slaBreached != null ? `${stats.slaBreached}%` : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
              <i className="fas fa-tags" style={{ marginRight: '8px', color: '#8b5cf6' }}></i> Most Common Issue Types
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topCats.length > 0 ? topCats.map((c, i) => {
                const maxCnt = topCats[0]?.cnt || 1;
                const pct = Math.round((c.cnt / maxCnt) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{c._id || 'General'}</span>
                      <span style={{ color: 'var(--text-3)' }}>{c.cnt}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
                    </div>
                  </div>
                );
              }) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '20px' }}>No data yet.</div>}
            </div>
          </div>
        </div>

        {/* Team performance — dynamic from staff API */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
            <i className="fas fa-users" style={{ marginRight: '8px', color: '#10b981' }}></i> Support Team
          </h3>
          {staff.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Agent</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.name || s.username}</td>
                      <td style={{ color: 'var(--text-2)', textTransform: 'capitalize' }}>{s.role || 'Support'}</td>
                      <td><span style={{ color: '#10b981', fontWeight: 700 }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>No team data available.</div>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: TICKETS LIST
     ═══════════════════════════════════════════════════════════════ */
  const renderTickets = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px' }}></i>
          <input
            type="text"
            placeholder="Search tickets…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
          />
        </div>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}
          style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.category} onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
          style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tickets table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div style={{ width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
            <i className="fas fa-inbox" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>
            No tickets found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => openTicketDetail(t._id)}>
                    <td style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                    <td>{t.username}</td>
                    <td><span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{t.category || 'General'}</span></td>
                    <td><Badge text={t.priority || 'medium'} color={PRIORITY_COLORS[(t.priority||'medium').toLowerCase()] || '#f59e0b'} /></td>
                    <td><Badge text={t.status || 'open'} color={STATUS_COLORS[(t.status||'open').toLowerCase()] || '#3b82f6'} /></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-2)' }}>{t.assignedTo || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{timeAgo(t.createdAt)}</td>
                    <td>
                      <button className="btn btn--primary" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px' }} onClick={e => { e.stopPropagation(); openTicketDetail(t._id); }}>
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button className="btn btn--secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}>
            <i className="fas fa-chevron-left"></i> Prev
          </button>
          <span style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--text-2)' }}>Page {page} of {Math.ceil(total / 15)}</span>
          <button className="btn btn--secondary" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}>
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER: TICKET DETAIL (Chat UI)
     ═══════════════════════════════════════════════════════════════ */
  const renderTicketDetail = () => {
    if (!selectedTicket) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>Loading ticket…</div>;

    const slaDeadline = selectedTicket.slaDeadline ? new Date(selectedTicket.slaDeadline) : null;
    const slaBreach = slaDeadline && slaDeadline < new Date() && selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed';

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', minHeight: '600px' }}>
        {/* ─── LEFT: Chat Thread ─── */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn--secondary" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }} onClick={() => { setTab('tickets'); setSelectedTicket(null); }}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedTicket.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>by {selectedTicket.username} • {timeAgo(selectedTicket.createdAt)}</div>
            </div>
            <Badge text={selectedTicket.status} color={STATUS_COLORS[selectedTicket.status] || '#3b82f6'} />
            <Badge text={selectedTicket.priority} color={PRIORITY_COLORS[selectedTicket.priority] || '#f59e0b'} />
          </div>

          {/* Description */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>
            {selectedTicket.description || 'No description provided.'}
          </div>

          {/* Comment Thread */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '360px' }}>
            {comments.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                <i className="fas fa-comments" style={{ marginRight: '8px' }}></i> No replies yet. Start the conversation below.
              </div>
            ) : comments.map((c, i) => {
              const isAgent = (c.author || '').toLowerCase().includes('agent') || (c.author || '').toLowerCase().includes('support');
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: isAgent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isAgent ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--bg-input)',
                    color: isAgent ? '#fff' : 'var(--text-1)',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {c.message}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', padding: '0 4px' }}>
                    {c.author} • {timeAgo(c.createdAt)}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef}></div>
          </div>

          {/* Comment Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Type your reply…"
              rows={2}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '14px', resize: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
            />
            <button className="btn btn--primary" onClick={postComment} style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '14px' }}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Ticket Sidebar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* SLA Tracking */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-clock" style={{ marginRight: '6px' }}></i> SLA Tracking
            </h4>
            {slaDeadline ? (
              <div style={{ padding: '14px', borderRadius: '8px', background: slaBreach ? '#ef444415' : '#10b98115', border: `1px solid ${slaBreach ? '#ef444430' : '#10b98130'}` }}>
                <div style={{ fontWeight: 600, color: slaBreach ? '#ef4444' : '#10b981', fontSize: '14px' }}>
                  {slaBreach ? '⚠️ SLA Breached' : '✅ Within SLA'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
                  Deadline: {slaDeadline.toLocaleString('en-IN')}
                </div>
              </div>
            ) : <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>No SLA set.</div>}
          </div>

          {/* Assign Staff */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-user-check" style={{ marginRight: '6px' }}></i> Assign To
            </h4>
            <select
              value={selectedTicket.assignedTo || ''}
              onChange={e => updateTicket('assignedTo', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
            >
              <option value="">— Unassigned —</option>
              {staff.map(s => <option key={s._id} value={s.username}>{s.name || s.username}</option>)}
            </select>
          </div>

          {/* Change Status */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-flag" style={{ marginRight: '6px' }}></i> Status
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => updateTicket('status', s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: selectedTicket.status === s ? `2px solid ${STATUS_COLORS[s]}` : '1px solid var(--border)',
                    background: selectedTicket.status === s ? `${STATUS_COLORS[s]}15` : 'transparent',
                    color: selectedTicket.status === s ? STATUS_COLORS[s] : 'var(--text-2)',
                    fontWeight: selectedTicket.status === s ? 700 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    textAlign: 'left',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Change Priority */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i> Priority
            </h4>
            <select
              value={selectedTicket.priority || 'medium'}
              onChange={e => updateTicket('priority', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Ticket Meta */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i> Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-3)' }}>Category</span><span style={{ fontWeight: 600 }}>{selectedTicket.category || 'General'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-3)' }}>Created</span><span style={{ fontWeight: 600 }}>{new Date(selectedTicket.createdAt).toLocaleDateString('en-IN')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-3)' }}>Last Updated</span><span style={{ fontWeight: 600 }}>{timeAgo(selectedTicket.updatedAt)}</span></div>
              {selectedTicket.resolvedAt && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-3)' }}>Resolved</span><span style={{ fontWeight: 600, color: '#10b981' }}>{new Date(selectedTicket.resolvedAt).toLocaleDateString('en-IN')}</span></div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER: FAQ / KNOWLEDGE BASE
     ═══════════════════════════════════════════════════════════════ */
  const renderFAQ = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* FAQ Form */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
          <i className="fas fa-plus-circle" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
          {faqForm.editing ? 'Edit FAQ Entry' : 'Add New FAQ Entry'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px', display: 'block' }}>Question</label>
            <input
              type="text"
              value={faqForm.question}
              onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))}
              placeholder="e.g. How do I create an invoice?"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px', display: 'block' }}>Answer</label>
            <textarea
              value={faqForm.answer}
              onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))}
              placeholder="Detailed answer for the shop owner..."
              rows={5}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px', resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px', display: 'block' }}>Display Order</label>
            <input
              type="number"
              value={faqForm.order}
              onChange={e => setFaqForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
              style={{ width: '100px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--primary" onClick={saveFaq} style={{ padding: '10px 20px', borderRadius: '8px' }}>
              <i className={`fas ${faqForm.editing ? 'fa-save' : 'fa-plus'}`} style={{ marginRight: '6px' }}></i>
              {faqForm.editing ? 'Update FAQ' : 'Add FAQ'}
            </button>
            {faqForm.editing && (
              <button className="btn btn--secondary" onClick={() => setFaqForm({ question: '', answer: '', order: 0, editing: null })} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
          <i className="fas fa-book" style={{ marginRight: '8px', color: '#10b981' }}></i>
          Knowledge Base ({faqs.length} entries)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflow: 'auto' }}>
          {faqs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-3)' }}>
              <i className="fas fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
              No FAQs created yet.
            </div>
          ) : faqs.map(faq => (
            <div key={faq._id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-1)' }}>
                  <i className="fas fa-question-circle" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                  {faq.question}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => editFaq(faq)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', padding: '4px' }}>
                    <i className="fas fa-pen"></i>
                  </button>
                  <button onClick={() => deleteFaq(faq._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '4px' }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6', paddingLeft: '24px' }}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Styles
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
  const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '850px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };
  const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

  /* ═══════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px' }}>
        <div className="topbar__left">
          <h1>Support & Helpdesk</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>
            Manage support tickets, SLAs, and knowledge base for shop owners.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button onClick={() => setTab('dashboard')} className={`btn ${tab === 'dashboard' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-chart-pie"></i> Dashboard
        </button>
        <button onClick={() => setTab('tickets')} className={`btn ${tab === 'tickets' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-ticket-alt"></i> All Tickets
        </button>
        <button onClick={() => setTab('faq')} className={`btn ${tab === 'faq' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-book-open"></i> FAQ / Knowledge Base
        </button>
      </div>

      {/* Content */}
      {tab === 'dashboard' && renderDashboard()}
      {tab === 'tickets' && renderTickets()}
      {tab === 'ticket-detail' && renderTicketDetail()}
      {tab === 'faq' && renderFAQ()}

      {/* Detail Modal */}
      {detailModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDetailModal(null)}>
          <div style={{ ...modalBox, maxWidth: '850px' }}>
            <div style={modalHead}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>{detailModal.title}</h3>
              <button className="btn--icon" onClick={() => setDetailModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {detailModal.loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--accent)' }}></i>
                  <div style={{ marginTop: '8px', color: 'var(--text-3)' }}>Loading tickets...</div>
                </div>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Priority</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Assigned To</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.rows.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No tickets found.</td></tr>
                    ) : (
                      detailModal.rows.map(t => (
                        <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>{t.title}</td>
                          <td style={{ padding: '12px' }}>{t.username}</td>
                          <td style={{ padding: '12px' }}>{t.category || 'General'}</td>
                          <td style={{ padding: '12px' }}>
                            <Badge text={t.priority || 'medium'} color={PRIORITY_COLORS[(t.priority||'medium').toLowerCase()] || '#f59e0b'} />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Badge text={t.status || 'open'} color={STATUS_COLORS[(t.status||'open').toLowerCase()] || '#3b82f6'} />
                          </td>
                          <td style={{ padding: '12px' }}>{t.assignedTo || '—'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button className="btn btn--sm btn--primary" onClick={() => { setDetailModal(null); openTicketDetail(t._id); }}>
                              Open
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
