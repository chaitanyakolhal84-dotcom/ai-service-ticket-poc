import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";

const API = "http://localhost:5000/api/tickets";
const CATEGORIES = [
  "Technical Issue",
  "Billing & Payment",
  "Account & Login",
  "Product/Service Issue",
  "Delivery/Order",
  "General Query",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["New", "In Progress", "Resolved"];
const EMPTY_FORM = { title: "", description: "" };

function getAuthHeaders(token, includeJson = true) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}
function getTicketFromResponse(data) {
  return data.ticket || data.data?.ticket || data.data || null;
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const token = localStorage.getItem("ticketToken");
      const savedUser = localStorage.getItem("ticketUser");
      if (token && savedUser) {
        const user = JSON.parse(savedUser);
        if (user?.role && user?.email) return { token, user };
      }
    } catch {
      // Invalid saved session is cleared below.
    }
    localStorage.removeItem("ticketToken");
    localStorage.removeItem("ticketUser");
    return null;
  });

  function handleLogin(token, user) {
    localStorage.setItem("ticketToken", token);
    localStorage.setItem("ticketUser", JSON.stringify(user));
    setSession({ token, user });
  }
  function handleLogout() {
    localStorage.removeItem("ticketToken");
    localStorage.removeItem("ticketUser");
    setSession(null);
  }

  if (!session) return <Auth onLogin={handleLogin} />;
  return (
    <Dashboard
      key={session.user.email}
      token={session.token}
      user={session.user}
      onLogout={handleLogout}
    />
  );
}

function Dashboard({ token, user, onLogout }) {
  const isAdmin = user.role === "admin";
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (category) query.set("category", category);
      if (priority) query.set("priority", priority);
      if (status) query.set("status", status);
      if (isAdmin && activeSection === "Deleted Tickets") query.set("includeDeleted", "true");

      const response = await fetch(`${API}?${query.toString()}`, {
        headers: getAuthHeaders(token, false),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load tickets.");
      }
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);

      if (isAdmin) {
        const statsResponse = await fetch(`${API}/stats`, {
          headers: getAuthHeaders(token, false),
        });
        const statsData = await statsResponse.json();
        if (statsResponse.status === 401) {
          onLogout();
          return;
        }
        if (!statsResponse.ok || !statsData.success) {
          throw new Error(statsData.message || "Could not load statistics.");
        }
        setStats(statsData.stats || {});
      } else {
        setStats({});
      }
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to the backend server.");
    }
  }, [token, isAdmin, onLogout, search, category, priority, status, activeSection]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function changeSection(section) {
    setActiveSection(section);
    setMessage("");
    setError("");
    if (section === "AI Classification") {
      setSearch("");
      setCategory("");
      setPriority("");
      setStatus("");
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((old) => ({ ...old, [name]: value }));
  }

  async function createTicket(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ticket creation failed.");
      }
      setMessage(data.message || "Ticket created and classified successfully!");
      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create ticket.");
    } finally {
      setLoading(false);
    }
  }

  async function openTicketDetails(id) {
    setDetailsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, {
        headers: getAuthHeaders(token, false),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load ticket details.");
      }
      const ticket = getTicketFromResponse(data);
      if (!ticket?._id) throw new Error("Unexpected ticket details response.");
      setSelectedTicket(ticket);
    } catch (err) {
      setError(err.message || "Unable to load ticket details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function updateTicket(id, changes) {
    if (!isAdmin) {
      setError("Only an administrator can update tickets.");
      return false;
    }
    setUpdating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return false;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ticket update failed.");
      }
      const updatedTicket = getTicketFromResponse(data);
      if (updatedTicket?._id) setSelectedTicket(updatedTicket);
      setMessage(data.message || "Ticket updated successfully.");
      await loadData();
      return true;
    } catch (err) {
      setError(err.message || "Unable to update ticket.");
      return false;
    } finally {
      setUpdating(false);
    }
  }

  async function deleteTicket(id) {
    if (!isAdmin) {
      setError("Only an administrator can delete tickets.");
      return;
    }

    const confirmed = window.confirm(
      "Move this ticket to Deleted Tickets? You can restore it later."
    );
    if (!confirmed) return;

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token, false),
      });
      const data = await response.json();

      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ticket deletion failed.");
      }

      if (selectedTicket?._id === id) setSelectedTicket(null);
      setMessage(data.message || "Ticket moved to Deleted Tickets.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete ticket.");
    } finally {
      setUpdating(false);
    }
  }

  async function restoreTicket(id) {
    if (!isAdmin) return;
    setUpdating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API}/${id}/restore`, {
        method: "PATCH",
        headers: getAuthHeaders(token, false),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ticket restore failed.");
      }
      setMessage(data.message || "Ticket restored successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to restore ticket.");
    } finally {
      setUpdating(false);
    }
  }

  async function permanentlyDeleteTicket(id) {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      "Permanently delete this ticket? This cannot be undone and the ticket cannot be restored."
    );
    if (!confirmed) return;
    setUpdating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API}/${id}/permanent`, {
        method: "DELETE",
        headers: getAuthHeaders(token, false),
      });
      const data = await response.json();
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Permanent deletion failed.");
      }
      setMessage(data.message || "Ticket permanently deleted.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to permanently delete ticket.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleStatusChange(ticket, newStatus) {
    if (newStatus === ticket.status) return;
    if (await updateTicket(ticket._id, { status: newStatus })) {
      await openTicketDetails(ticket._id);
    }
  }

  async function saveClassification() {
    if (!selectedTicket || !isAdmin) return;
    if (await updateTicket(selectedTicket._id, {
      category: selectedTicket.category,
      priority: selectedTicket.priority,
    })) {
      await openTicketDetails(selectedTicket._id);
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setPriority("");
    setStatus("");
  }

  const reviewCount = stats.reviewTickets ?? 0;
  const highCriticalCount = stats.highCriticalTickets ?? 0;
  const reviewTickets = tickets.filter((ticket) => ticket.requiresManualReview);

  function Filters() {
    return (
      <div className="filters">
        <input
          aria-label="Search tickets"
          placeholder="⌕ Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" className="refresh-button" onClick={clearFilters}>Clear Filters</button>
      </div>
    );
  }

  function TicketTable({ rows = tickets, showAi = false }) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticket / Customer</th>
              <th>{showAi ? "AI Category" : "Category"}</th>
              <th>{showAi ? "AI Priority" : "Priority"}</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>{activeSection === "Deleted Tickets" ? "Recovery / Delete" : showAi ? "Review" : "Details"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket) => (
              <tr key={ticket._id}>
                <td className="ticket-name-cell">
                  <strong>{ticket.title}</strong>
                  <small>{ticket.customerName || "Customer"}</small>
                  {isAdmin && <small>{ticket.customerEmail}</small>}
                </td>
                <td>
                  <span className="category-text">
                    {showAi ? (ticket.aiCategory || ticket.category) : ticket.category}
                  </span>
                  {ticket.categoryOverridden && <small className="review-label">Manually reviewed</small>}
                </td>
                <td>
                  <span className={`priority ${String(showAi ? (ticket.aiPriority || ticket.priority) : ticket.priority || "").toLowerCase()}`}>
                    {showAi ? (ticket.aiPriority || ticket.priority) : ticket.priority}
                  </span>
                </td>
                <td>
                  {isAdmin ? (
                    <select
                      className="status-select"
                      aria-label={`Update status for ${ticket.title}`}
                      value={ticket.status}
                      disabled={updating}
                      onChange={(e) => handleStatusChange(ticket, e.target.value)}
                    >
                      {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  ) : (
                    <span className={`status-badge ${String(ticket.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {ticket.status}
                    </span>
                  )}
                </td>
                <td>
                  <span className="confidence-value">{ticket.confidence ?? 0}%</span>
                  {ticket.requiresManualReview && <small className="review-label">Review needed</small>}
                </td>
                <td>
                  {activeSection === "Deleted Tickets" ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="details-button" type="button" disabled={updating} onClick={() => restoreTicket(ticket._id)}>Restore</button>
                      <button type="button" disabled={updating} onClick={() => permanentlyDeleteTicket(ticket._id)} style={{ background: "#b42318", color: "#fff", border: 0, borderRadius: 6, padding: "8px 10px", cursor: updating ? "not-allowed" : "pointer" }}>Permanently Delete</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="details-button" type="button" disabled={detailsLoading} onClick={() => openTicketDetails(ticket._id)}>
                        {showAi && ticket.requiresManualReview ? "Review" : "View"}
                      </button>
                      {isAdmin && <button type="button" disabled={updating} onClick={() => deleteTicket(ticket._id)} style={{ background: "#b42318", color: "#fff", border: 0, borderRadius: 6, padding: "8px 10px", cursor: updating ? "not-allowed" : "pointer" }}>Delete</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="6" className="empty-state"><span>▤</span><strong>No tickets found</strong><p>Try changing the filters or create a new ticket.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function CreateTicket() {
    return (
      <section className="panel create-panel">
        <div className="panel-heading">
          <div><h2>Create a Ticket</h2><p>Submit a support request for AI classification.</p></div>
          <span className="ai-badge">✧ AI POWERED</span>
        </div>
        <form onSubmit={createTicket}>
          <label>Ticket title <span className="required">*</span>
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Unable to login" maxLength={200} required />
          </label>
          <label>Description <span className="required">*</span>
            <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe the issue in detail..." rows={4} required />
          </label>
          <div className="ai-note"><span className="ai-note-icon">✧</span><div><strong>AI classification enabled</strong><p>The backend predicts category, priority, confidence and whether manual review is needed.</p></div></div>
          <button className="submit-button" type="submit" disabled={loading}>{loading ? "Creating ticket..." : "＋ Create & Classify Ticket"}</button>
        </form>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">AI</div><div><h2>TicketSense</h2><p>Intelligent Support</p></div></div>
        <p className="side-label">WORKSPACE</p>
        {["Dashboard", "All Tickets", "AI Classification", ...(isAdmin ? ["Deleted Tickets"] : [])].map((section) => (
          <button
            type="button"
            key={section}
            className={`nav-item ${activeSection === section ? "active" : ""}`}
            onClick={() => changeSection(section)}
          >
            <span>{section === "Dashboard" ? "▦" : section === "All Tickets" ? "◉" : section === "Deleted Tickets" ? "♲" : "✧"}</span>
            {section}
          </button>
        ))}
        <div className="sidebar-bottom"><span className="status-dot" /><span>TicketSense API</span><small>Authenticated session</small></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isAdmin ? "ADMINISTRATION" : "CUSTOMER PORTAL"} / {activeSection.toUpperCase()}</p>
            <h1>{activeSection === "Dashboard" ? (isAdmin ? "AI Ticket Dashboard" : "My Support Dashboard") : activeSection === "All Tickets" ? (isAdmin ? "All Support Tickets" : "My Support Tickets") : activeSection === "Deleted Tickets" ? "Deleted Tickets & Recovery" : "AI Classification Center"}</h1>
            <p className="subtitle">{activeSection === "Dashboard" ? (isAdmin ? "Manage and classify customer support requests." : "Create tickets and track your support requests.") : activeSection === "All Tickets" ? "Search, filter, review and update support tickets." : activeSection === "Deleted Tickets" ? "Restore deleted tickets or permanently remove them." : "Inspect AI predictions, confidence scores and tickets requiring manual review."}</p>
          </div>
          <div className="user-profile">
            <div className="avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
            <div><strong>{user.name || user.email}</strong><small>{isAdmin ? "Administrator" : "Customer"}</small></div>
            <button type="button" onClick={onLogout}>Logout</button>
          </div>
        </header>

        {message && <div className="alert success"><span>✓</span> {message}<button type="button" onClick={() => setMessage("")}>×</button></div>}
        {error && <div className="alert error"><span>!</span> {error}<button type="button" onClick={() => setError("")}>×</button></div>}

        {activeSection === "Dashboard" && (
          <>
            {isAdmin && <>
              <section className="stats-grid">
                <StatCard label="Total Tickets" value={stats.totalTickets ?? 0} icon="▤" color="purple" />
                <StatCard label="New Tickets" value={stats.newTickets ?? 0} icon="◷" color="blue" />
                <StatCard label="In Progress" value={stats.inProgressTickets ?? 0} icon="↻" color="orange" />
                <StatCard label="Resolved" value={stats.resolvedTickets ?? 0} icon="✓" color="green" />
              </section>
              <section className="extra-stats">
                <div><span className="mini-stat-icon red">!</span><div><strong>{highCriticalCount}</strong><p>High / Critical Priority</p></div></div>
                <div><span className="mini-stat-icon purple">✧</span><div><strong>{reviewCount}</strong><p>Manual Review Required</p></div></div>
                <button className="refresh-button" type="button" onClick={loadData}>↻ Refresh Data</button>
              </section>
            </>}
            <div className="content-grid">
              <section className="panel ticket-panel">
                <div className="panel-heading"><div><h2>{isAdmin ? "Support Tickets" : "My Support Tickets"}</h2><p>Search, filter and manage customer requests.</p></div><span className="count-badge">{tickets.length} shown</span></div>
                <Filters />
                <TicketTable />
              </section>
              <CreateTicket />
            </div>
          </>
        )}

        {activeSection === "All Tickets" && (
          <section className="panel ticket-panel">
            <div className="panel-heading"><div><h2>{isAdmin ? "All Support Tickets" : "My Support Tickets"}</h2><p>All tickets you are authorized to access.</p></div><span className="count-badge">{tickets.length} shown</span></div>
            <Filters />
            <TicketTable />
            {!isAdmin && <div style={{ padding: 20 }}><CreateTicket /></div>}
          </section>
        )}

        {activeSection === "Deleted Tickets" && isAdmin && (
          <section className="panel ticket-panel">
            <div className="panel-heading"><div><h2>Deleted Tickets</h2><p>Restore a ticket to make it active again, or permanently delete it.</p></div><span className="count-badge">{tickets.length} deleted</span></div>
            <Filters />
            <TicketTable rows={tickets} />
          </section>
        )}

        {activeSection === "AI Classification" && (
          <>
            {isAdmin && <section className="extra-stats">
              <div><span className="mini-stat-icon purple">✧</span><div><strong>{reviewCount}</strong><p>Manual Review Required</p></div></div>
              <div><span className="mini-stat-icon red">!</span><div><strong>{highCriticalCount}</strong><p>High / Critical Priority</p></div></div>
              <button className="refresh-button" type="button" onClick={loadData}>↻ Refresh Predictions</button>
            </section>}
            <section className="panel ticket-panel">
              <div className="panel-heading"><div><h2>AI Predictions</h2><p>Original prediction, confidence and manual-review status.</p></div><span className="count-badge">{reviewTickets.length} review needed</span></div>
              <Filters />
              <div style={{ padding: "12px 20px" }}>
                <p><strong>Manual review:</strong> Low-confidence tickets are flagged by the backend. Open a ticket to inspect reasoning and keywords. Admins can correct the category and priority.</p>
                <button className="refresh-button" type="button" onClick={clearFilters}>Show All Predictions</button>
              </div>
              <TicketTable rows={tickets} showAi />
            </section>
          </>
        )}

        {selectedTicket && (
          <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTicket(null); }}>
            <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
              <div className="modal-header">
                <div><p className="eyebrow">TICKET DETAILS</p><h2 id="details-title">{selectedTicket.title}</h2><p className="modal-id">ID: {selectedTicket._id}</p></div>
                <button type="button" className="close-button" onClick={() => setSelectedTicket(null)} aria-label="Close ticket details">×</button>
              </div>
              <div className="modal-body">
                <div className="detail-description"><h3>Issue Description</h3><p>{selectedTicket.description}</p></div>
                <div className="details-grid">
                  <DetailItem label="Customer" value={selectedTicket.customerName} />
                  <DetailItem label="Email" value={selectedTicket.customerEmail} />
                  <DetailItem label="Created" value={selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : "Not available"} />
                  <DetailItem label="Current Status" value={selectedTicket.status} />
                </div>
                <div className="ai-results">
                  <div className="section-title"><span>✧</span><div><h3>AI Prediction</h3><p>Original prediction from the classifier</p></div></div>
                  <div className="details-grid">
                    <DetailItem label="AI Category" value={selectedTicket.aiCategory || selectedTicket.category} />
                    <DetailItem label="AI Priority" value={selectedTicket.aiPriority || selectedTicket.priority} />
                    <DetailItem label="Confidence" value={`${selectedTicket.confidence ?? 0}%`} />
                    <DetailItem label="Manual Review" value={selectedTicket.requiresManualReview ? "Required" : "Not required"} />
                  </div>
                  <div className="reasoning-box"><strong>AI Reasoning</strong><p>{selectedTicket.aiReasoning || "Reasoning information is not available for this ticket."}</p></div>
                  {Array.isArray(selectedTicket.keywords) && selectedTicket.keywords.length > 0 && <div className="keyword-section"><strong>Matched Keywords</strong><div className="keyword-list">{selectedTicket.keywords.map((word, i) => <span key={`${word}-${i}`}>{word}</span>)}</div></div>}
                </div>
                {isAdmin && <div className="override-section">
                  <div className="section-title"><span>⚙</span><div><h3>Manual Override</h3><p>Change classification if the prediction is incorrect.</p></div></div>
                  <label>Category<select value={selectedTicket.category} onChange={(e) => setSelectedTicket((old) => ({ ...old, category: e.target.value }))}>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>Priority<select value={selectedTicket.priority} onChange={(e) => setSelectedTicket((old) => ({ ...old, priority: e.target.value }))}>{PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <button type="button" className="submit-button" disabled={updating} onClick={saveClassification}>{updating ? "Saving..." : "Save Classification"}</button>
                  <button
                    type="button"
                    className="delete-ticket-button"
                    disabled={updating}
                    onClick={() => deleteTicket(selectedTicket._id)}
                    style={{ marginTop: 12, background: "#b42318", color: "#fff", border: 0, borderRadius: 8, padding: "12px 16px", cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.7 : 1 }}
                  >
                    {updating ? "Please wait..." : "Delete Ticket"}
                  </button>
                </div>}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div><strong>{value}</strong><small>Live dashboard metric</small></div>;
}
function DetailItem({ label, value }) {
  return <div className="detail-item"><small>{label}</small><strong>{value || "Not available"}</strong></div>;
}
