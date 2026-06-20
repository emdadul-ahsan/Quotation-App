/* ============================================================
   app.jsx — routing, Shell, Clients, Settings, mount
   ============================================================ */
/* useState / useEffect are already destructured globally in store.jsx
   (Babel standalone shares one global scope across all script tags). */

/* ---------- Hash routing ---------- */
function parseHash() {
  const h = (window.location.hash || "#/dashboard").replace(/^#\//, "");
  const [route, id] = h.split("/");
  return { route: route || "dashboard", id: id || null };
}
function nav(name, opts) {
  window.location.hash = "#/" + name + (opts && opts.id ? "/" + opts.id : "");
}

/* Unified invoice-creation entry point: stash a prefill, open the editor.
   Every "new/generate invoice" action across the app routes through here so
   the flow (editor + live preview -> save/send) is identical everywhere. */
function startInvoice(onNav, prefill) {
  window.__invoiceDraft = prefill || null;
  (onNav || nav)("editor");
}
window.startInvoice = startInvoice;

/* ---------- Clients screen ---------- */
function ClientsScreen({ onNav }) {
  const store = useStore();
  const { clients, invoicesByClient, invoiceTotal, createClient, updateClient, deleteClient, createInvoice } = store;
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', client}
  const [del, setDel] = useState(null);
  const [view, setView] = useState("grid"); // grid | list
  const [form, setForm] = useState({ name: "", email: "", addr: "", description: "" });

  const open = (mode, client) => {
    setForm(client ? { name: client.name, email: client.email, addr: client.addr, description: client.description || "" } : { name: "", email: "", addr: "", description: "" });
    setModal({ mode, client });
  };
  const save = () => {
    if (!form.name.trim()) { store.toast("Company name required", "warn"); return; }
    if (modal.mode === "add") { createClient(form); store.toast("Client added", "ok"); }
    else { updateClient(modal.client.id, form); store.toast("Client updated", "ok"); }
    setModal(null);
  };
  const newInvoiceFor = (c) => startInvoice(onNav, { clientId: c.id });

  return (
    <div className="screen">
      <div className="page-head">
        <div><h1>Clients</h1><div className="sub">{clients.length} clients</div></div>
        <div className="row gap-8">
          <div className="seg">
            <button className={"seg-btn" + (view === "grid" ? " active" : "")} onClick={() => setView("grid")} title="Grid"><Icon name="dashboard" size={14} /></button>
            <button className={"seg-btn" + (view === "list" ? " active" : "")} onClick={() => setView("list")} title="List"><Icon name="invoice" size={14} /></button>
          </div>
          <button className="btn violet" onClick={() => open("add")}><Icon name="plus" size={15} /> Add client</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="card flush">
          <table className="table">
            <thead><tr><th>Client</th><th>Description</th><th className="right">Billed</th><th className="right">Outstanding</th><th className="right">Invoices</th><th></th></tr></thead>
            <tbody>
              {clients.map((c) => {
                const invs = invoicesByClient(c.id);
                const lifetime = invs.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceTotal(i), 0);
                const outstanding = invs.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + invoiceTotal(i), 0);
                return (
                  <tr key={c.id}>
                    <td><ClientCell client={c} sub={c.email} /></td>
                    <td className="muted truncate" style={{ maxWidth: 280 }}>{c.description || "—"}</td>
                    <td className="right mono semibold">{fmtMoney(lifetime)}</td>
                    <td className={"right mono semibold" + (outstanding > 0 ? " violet-text" : "")}>{fmtMoney(outstanding)}</td>
                    <td className="right mono">{invs.length}</td>
                    <td className="right">
                      <RowMenu items={[
                        { icon: "edit", label: "Edit", onClick: () => open("edit", c) },
                        { icon: "plus", label: "New invoice", onClick: () => newInvoiceFor(c) },
                        { icon: "trash", label: "Delete", danger: true, onClick: () => setDel(c) },
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid grid-3">
        {clients.map((c) => {
          const invs = invoicesByClient(c.id);
          const lifetime = invs.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceTotal(i), 0);
          const outstanding = invs.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + invoiceTotal(i), 0);
          return (
            <div key={c.id} className="card">
              <div className="spread mb-16">
                <div className="row gap-12" style={{ minWidth: 0 }}>
                  <Avatar name={c.name} color={c.color} size={36} />
                  <div style={{ minWidth: 0 }}><div className="semibold truncate">{c.name}</div><div className="muted small truncate">{c.email}</div></div>
                </div>
                <div className="row gap-4">
                  <button className="icon-btn" onClick={() => open("edit", c)}><Icon name="edit" size={14} /></button>
                  <button className="icon-btn" onClick={() => setDel(c)}><Icon name="trash" size={14} /></button>
                </div>
              </div>
              {c.description && <div className="muted small mb-12" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</div>}
              <div className="muted tiny truncate mb-16">{c.addr || "No address"}</div>
              <div className="grid grid-3">
                <div><div className="muted tiny">Billed</div><div className="semibold mono">{fmtMoney(lifetime)}</div></div>
                <div><div className="muted tiny">Outstanding</div><div className={"semibold mono" + (outstanding > 0 ? " violet-text" : "")}>{fmtMoney(outstanding)}</div></div>
                <div><div className="muted tiny">Invoices</div><div className="semibold mono">{invs.length}</div></div>
              </div>
              <button className="btn ghost sm mt-16" onClick={() => newInvoiceFor(c)}><Icon name="plus" size={13} /> New invoice for {c.name.split(" ")[0]}</button>
            </div>
          );
        })}
      </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "Add client" : "Edit client"} desc="Billing details for invoices."
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn violet" onClick={save}>{modal.mode === "add" ? "Add client" : "Save"}</button>
          </>}>
          <div className="field"><label>Company name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Co." /></div>
          <div className="field"><label>Billing email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="billing@acme.io" /></div>
          <div className="field"><label>Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes about this client — terms, contacts, context…" /></div>
          <div className="field"><label>Address</label><textarea className="input" value={form.addr} onChange={(e) => setForm({ ...form, addr: e.target.value })} placeholder="350 Mission St, San Francisco CA" /></div>
        </Modal>
      )}
      {del && (
        <Modal title="Delete client?" desc={"Remove " + del.name + " from your client list."}
          onClose={() => setDel(null)}
          footer={<>
            <button className="btn ghost" onClick={() => setDel(null)}>Cancel</button>
            <button className="btn danger" onClick={() => { deleteClient(del.id); store.toast("Client deleted", "warn"); setDel(null); }}>Delete</button>
          </>}>
          <div className="muted small">{invoicesByClient(del.id).length} invoice(s) will remain but become unlinked. This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Settings screen ---------- */
function SettingsScreen() {
  const store = useStore();
  const { account, signOut } = useAuth();
  const { business, updateBusiness, addPaymentMethod, removePaymentMethod, resetData, loadDemo } = store;
  const [form, setForm] = useState({ ...business });
  const [reset, setReset] = useState(false);
  const [newMethod, setNewMethod] = useState("");

  const onLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { store.toast("Logo must be under 1.5MB", "warn"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="screen">
      <div className="page-head"><div><h1>Settings</h1><div className="sub">Business profile &amp; data.</div></div></div>
      <div className="grid grid-asym">
        <div className="card">
          <div className="card-head"><h3>Business info</h3></div>
          <div className="logo-up mb-24">
            <div className="logo-preview">{form.logo ? <img src={form.logo} alt="logo" /> : <Icon name="sparkle" size={22} color="#8a8f98" />}</div>
            <div className="col gap-8">
              <label className="btn ghost sm" style={{ cursor: "pointer" }}><Icon name="download" size={13} /> {form.logo ? "Replace" : "Upload"} logo
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: "none" }} onChange={onLogo} /></label>
              {form.logo && <button className="btn danger sm" onClick={() => setForm({ ...form, logo: "" })}>Remove</button>}
              <span className="muted tiny">PNG, JPG or SVG · max 1.5MB</span>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="field"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Address</label><input className="input" value={form.addr} onChange={(e) => setForm({ ...form, addr: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Default currency</label>
              <select className="input" value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.label}</option>)}
              </select>
            </div>
          </div>
          <button className="btn violet mt-16" onClick={() => { updateBusiness(form); store.toast("Profile saved", "ok"); }}>Save changes</button>
        </div>

        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Account</h3></div>
            <div className="row gap-12">
              <Avatar name={account ? account.name : "Guest"} src={account ? account.picture : ""} color="#5e6ad2" size={38} />
              <div style={{ minWidth: 0 }}>
                <div className="semibold truncate">{account ? account.name : "Guest"}</div>
                <div className="muted tiny truncate">{account && account.email ? account.email : "Local guest workspace"}</div>
              </div>
            </div>
            <div className="muted tiny mt-16 mb-16">Data is scoped to this account on this device. {account && account.provider === "google" ? "Signed in with Google." : "Sign in with Google to use a separate account-scoped workspace."}</div>
            <button className="btn ghost sm" onClick={signOut}><Icon name="back" size={13} /> Sign out</button>
          </div>

          <div className="card">
            <div className="card-head"><h3>Payment methods</h3></div>
            <div className="col gap-8 mb-16">
              {business.paymentMethods.map((m) => (
                <div key={m} className="spread" style={{ padding: "6px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="row gap-8"><Icon name="dollar" size={14} color="#8a8f98" /> {m}</span>
                  <button className="icon-btn" onClick={() => removePaymentMethod(m)}><Icon name="close" size={13} /></button>
                </div>
              ))}
              {business.paymentMethods.length === 0 && <span className="muted small">No methods. Add one below.</span>}
            </div>
            <div className="row gap-8">
              <input className="input" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="e.g. Crypto, Cheque…"
                onKeyDown={(e) => { if (e.key === "Enter" && newMethod.trim()) { addPaymentMethod(newMethod); setNewMethod(""); } }} />
              <button className="btn violet" onClick={() => { if (newMethod.trim()) { addPaymentMethod(newMethod); setNewMethod(""); store.toast("Method added", "ok"); } }}><Icon name="plus" size={14} /></button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Data</h3></div>
            <div className="muted small mb-16">All data lives in your browser, scoped to your account. Nothing is sent to a server.</div>
            <div className="row gap-8 wrap">
              <button className="btn ghost" onClick={() => { loadDemo(); }}><Icon name="sparkle" size={14} /> Load demo data</button>
              <button className="btn danger" onClick={() => setReset(true)}><Icon name="trash" size={14} /> Reset (clear all)</button>
            </div>
          </div>
        </div>
      </div>
      {reset && (
        <Modal title="Clear all data?" desc="Sets every invoice, client, project and service to zero."
          onClose={() => setReset(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setReset(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { resetData(); setReset(false); }}>Clear everything</button>
          </>}>
          <div className="muted small">Your workspace becomes empty (all counts → 0). Payment methods and default currency are kept. This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Shell ---------- */
const ROUTE_LABELS = {
  dashboard: "Dashboard", invoices: "Invoices", "invoice-detail": "Invoice",
  editor: "Editor", projects: "Projects", "project-detail": "Project",
  clients: "Clients", services: "Services", settings: "Settings",
};

function Shell({ route, id }) {
  const store = useStore();
  const { account, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const counts = {
    invoices: store.invoices.length,
    projects: store.projects.length,
    clients: store.clients.length,
    services: store.services.length,
  };

  const onNav = (name, opts) => { nav(name, opts); setNavOpen(false); };
  const params = { id };

  const crumbs = [{ label: "MyDesk", onClick: () => onNav("dashboard") }];
  if (route === "invoice-detail") {
    const inv = store.getInvoice(id);
    crumbs.push({ label: "Invoices", onClick: () => onNav("invoices") });
    crumbs.push({ label: inv ? inv.number : "Invoice" });
  } else if (route === "editor") {
    const inv = id ? store.getInvoice(id) : null;
    crumbs.push({ label: "Invoices", onClick: () => onNav("invoices") });
    crumbs.push({ label: inv ? "Edit " + inv.number : "New invoice" });
  } else if (route === "project-detail") {
    const p = store.getProject(id);
    crumbs.push({ label: "Projects", onClick: () => onNav("projects") });
    crumbs.push({ label: p ? p.name : "Project" });
  } else {
    crumbs.push({ label: ROUTE_LABELS[route] || "Dashboard" });
  }

  let Screen = null;
  switch (route) {
    case "dashboard": Screen = <DashboardScreen onNav={onNav} />; break;
    case "invoices": Screen = <InvoicesScreen onNav={onNav} search={search} />; break;
    case "invoice-detail": Screen = <InvoiceDetailScreen onNav={onNav} params={params} />; break;
    case "editor": Screen = <InvoiceEditorScreen onNav={onNav} params={params} />; break;
    case "projects": Screen = <ProjectsScreen onNav={onNav} />; break;
    case "project-detail": Screen = <ProjectDetailScreen onNav={onNav} params={params} />; break;
    case "clients": Screen = <ClientsScreen onNav={onNav} />; break;
    case "services": Screen = <ServicesScreen onNav={onNav} />; break;
    case "settings": Screen = <SettingsScreen />; break;
    default: Screen = <DashboardScreen onNav={onNav} />;
  }

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")}>
      <Sidebar route={route} onNav={onNav} counts={counts} account={account} onSignOut={signOut} open={navOpen} />
      {navOpen && <div className="nav-overlay" onClick={() => setNavOpen(false)} />}
      <div className="main">
        <Topbar crumbs={crumbs} search={search} onMenu={() => setNavOpen(true)}
          onSearch={(v) => { setSearch(v); if (route !== "invoices" && v) onNav("invoices"); }} />
        {Screen}
      </div>
    </div>
  );
}

/* ---------- Auth gate: landing -> login -> app ---------- */
function AuthedApp({ route, id }) {
  const { account } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  if (!account) {
    return showLogin
      ? <LoginScreen onBack={() => setShowLogin(false)} />
      : <LandingScreen onStart={() => setShowLogin(true)} />;
  }
  return (
    <StoreProvider key={account.id} accountId={account.id}>
      <Shell route={route} id={id} />
    </StoreProvider>
  );
}

/* ---------- App (routing root) ---------- */
function App() {
  const [{ route, id }, setRoute] = useState(parseHash());
  useEffect(() => {
    const h = () => setRoute(parseHash());
    window.addEventListener("hashchange", h);
    if (!window.location.hash) window.location.hash = "#/dashboard";
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return (
    <AuthProvider>
      <AuthedApp route={route} id={id} />
    </AuthProvider>
  );
}

/* ---------- Mount ---------- */
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
