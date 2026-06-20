/* ============================================================
   projects.jsx — ProjectsScreen + ProjectDetailScreen
   Amount-based billing tracker: valuation -> invoiced -> paid -> remaining.
   ============================================================ */
function ProjectsScreen({ onNav }) {
  const store = useStore();
  const { projects, clients, getClient, projectAmounts, createProject } = store;
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", clientId: clients[0] ? clients[0].id : "", total: 0, currency: store.business.defaultCurrency });

  const save = () => {
    if (!form.name.trim()) { store.toast("Project name required", "warn"); return; }
    const p = createProject(form);
    setModal(false);
    onNav("project-detail", { id: p.id });
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div><h1>Projects</h1><div className="sub">{projects.length} engagements · track valuation, billing & payments</div></div>
        <button className="btn violet" onClick={() => { setForm({ name: "", clientId: clients[0] ? clients[0].id : "", total: 0, currency: store.business.defaultCurrency }); setModal(true); }}>
          <Icon name="plus" size={15} /> New project
        </button>
      </div>

      {projects.length === 0 && (
        <div className="card"><div className="empty"><div className="e-icon"><Icon name="project" size={22} /></div>
          <div><div className="semibold" style={{ color: "var(--porcelain)" }}>No projects yet</div><div className="small">Create a project, set its valuation, then bill against it.</div></div>
        </div></div>
      )}

      <div className="grid grid-3">
        {projects.map((p) => {
          const c = getClient(p.clientId);
          const a = projectAmounts(p);
          return (
            <div key={p.id} className="card click" onClick={() => onNav("project-detail", { id: p.id })}>
              <div className="row gap-12 mb-16">
                <Avatar name={c ? c.name : "?"} color={c ? c.color : "#444"} size={34} />
                <div style={{ minWidth: 0 }}><div className="semibold truncate">{p.name}</div><div className="muted small truncate">{c ? c.name : "—"}</div></div>
              </div>
              <div className="spread mb-8"><span className="muted small">Invoiced</span><span className="small semibold">{a.pct}% of valuation</span></div>
              <div className="progress"><div className="bar" style={{ width: a.pct + "%" }} /></div>
              <div className="grid grid-3 mt-16">
                <div><div className="muted tiny">Invoiced</div><div className="semibold mono">{fmtMoney(a.invoiced, p.currency)}</div></div>
                <div><div className="muted tiny">Paid</div><div className="semibold mono ok-text">{fmtMoney(a.paid, p.currency)}</div></div>
                <div><div className="muted tiny">Remaining</div><div className="semibold mono violet-text">{fmtMoney(a.remaining, p.currency)}</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="New project" desc="Set the contract valuation. Bill against it over time."
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn violet" onClick={save}>Create project</button>
          </>}>
          <div className="field"><label>Project name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website Redesign" /></div>
          <div className="field"><label>Client</label>
            <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              {clients.length === 0 && <option value="">No clients — add one first</option>}
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-2">
            <div className="field"><label>Valuation (total)</label><input className="input" type="number" min="0" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="8000" /></div>
            <div className="field"><label>Currency</label>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.sym}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProjectDetailScreen({ onNav, params }) {
  const store = useStore();
  const { getProject, getClient, getInvoice, invoicesByProject, projectProgress, projectAmounts, toggleMilestone, invoiceMilestone, generateProjectInvoice, deleteProject } = store;
  const p = getProject(params.id);
  if (!p) return <div className="screen"><div className="empty"><div>Project not found.</div><button className="btn ghost" onClick={() => onNav("projects")}>Back</button></div></div>;
  const c = getClient(p.clientId);
  const a = projectAmounts(p);
  const prog = projectProgress(p);
  const linked = invoicesByProject(p.id);
  const cur = p.currency;

  const [gen, setGen] = React.useState(false);
  const [del, setDel] = React.useState(false);
  const [amt, setAmt] = React.useState(a.remaining);
  const [desc, setDesc] = React.useState("");

  const openGen = () => { setAmt(a.remaining); setDesc(p.name + " — progress billing"); setGen(true); };
  const doGen = (status) => {
    const v = Number(amt) || 0;
    if (v <= 0) { store.toast("Enter an amount", "warn"); return; }
    if (v > a.remaining) { store.toast("Amount exceeds remaining valuation", "warn"); return; }
    const inv = generateProjectInvoice(p.id, { amount: v, desc, status });
    setGen(false);
    onNav("invoice-detail", { id: inv.id });
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div className="row gap-12">
          <button className="icon-btn" onClick={() => onNav("projects")}><Icon name="back" size={16} /></button>
          <div><h1>{p.name}</h1><div className="sub">{c ? c.name : "—"} · {cur} · valuation {fmtMoney(a.total, cur)}</div></div>
        </div>
        <div className="row gap-8">
          <button className="btn violet" onClick={openGen} disabled={a.remaining <= 0}><Icon name="receipt" size={14} /> Generate invoice</button>
          <RowMenu items={[{ icon: "trash", label: "Delete project", danger: true, onClick: () => setDel(true) }]} />
        </div>
      </div>

      {/* Billing tracker */}
      <div className="grid grid-4 mb-24">
        <div className="kpi"><div className="label">Valuation</div><div className="value">{fmtMoney(a.total, cur)}</div><div className="trend">Contract total</div></div>
        <div className="kpi"><div className="label">Invoiced</div><div className="value">{fmtMoney(a.invoiced, cur)}</div><div className="trend">{a.pct}% billed</div></div>
        <div className="kpi ok"><div className="label">Paid</div><div className="value">{fmtMoney(a.paid, cur)}</div><div className="trend">{fmtMoney(a.outstanding, cur)} outstanding</div></div>
        <div className="kpi"><div className="label">Remaining to invoice</div><div className="value violet-text">{fmtMoney(a.remaining, cur)}</div><div className="trend">Left of valuation</div></div>
      </div>

      <div className="grid grid-asym">
        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Billing progress</h3><span className="muted small">{a.pct}% invoiced · {a.paidPct}% paid</span></div>
            <div className="track-row">
              <span className="track-label">Invoiced</span>
              <div className="progress"><div className="bar" style={{ width: a.pct + "%" }} /></div>
              <span className="track-val mono">{fmtMoney(a.invoiced, cur)}</span>
            </div>
            <div className="track-row">
              <span className="track-label">Paid</span>
              <div className="progress ok"><div className="bar" style={{ width: a.paidPct + "%" }} /></div>
              <span className="track-val mono">{fmtMoney(a.paid, cur)}</span>
            </div>
            <div className="track-row">
              <span className="track-label">Remaining</span>
              <div className="progress"><div className="bar" style={{ width: (a.total ? (a.remaining / a.total) * 100 : 0) + "%", background: "var(--violet-600)", opacity: .5 }} /></div>
              <span className="track-val mono violet-text">{fmtMoney(a.remaining, cur)}</span>
            </div>
            <button className="btn violet mt-16" onClick={openGen} disabled={a.remaining <= 0}>
              <Icon name="receipt" size={14} /> {a.remaining > 0 ? "Bill " + fmtMoney(a.remaining, cur) + " remaining" : "Fully invoiced"}
            </button>
          </div>

          {p.milestones.length > 0 && (
            <div className="card">
              <div className="card-head"><h3>Milestones</h3><span className="muted small">{prog.done}/{prog.total} done</span></div>
              {p.milestones.map((m, idx) => {
                const linkedInv = m.invoiceId ? getInvoice(m.invoiceId) : null;
                const done = m.status === "done";
                return (
                  <div className="ms-row" key={m.id}>
                    <button className={"ms-check" + (done ? " done" : "")} onClick={() => toggleMilestone(p.id, m.id)}><Icon name="check" size={13} /></button>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="semibold">M{idx + 1} · {m.title}</div>
                      <div className="muted tiny">Due {fmtDate(m.due)}</div>
                    </div>
                    <span className="ms-amt">{fmtMoney(m.amount, cur)}</span>
                    {linkedInv
                      ? <span onClick={() => onNav("invoice-detail", { id: linkedInv.id })} style={{ cursor: "pointer" }}><StatusPill status={linkedInv.status} /></span>
                      : done
                        ? <button className="btn violet sm" onClick={() => invoiceMilestone(p.id, m.id)}><Icon name="send" size={12} /> Invoice</button>
                        : <button className="btn ghost sm" onClick={() => toggleMilestone(p.id, m.id)}>Mark done</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Summary</h3></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Valuation</span><span className="semibold mono">{fmtMoney(a.total, cur)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Invoiced</span><span className="semibold mono">{fmtMoney(a.invoiced, cur)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Paid</span><span className="semibold mono ok-text">{fmtMoney(a.paid, cur)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Outstanding</span><span className="semibold mono">{fmtMoney(a.outstanding, cur)}</span></div>
            <div className="spread" style={{ padding: "7px 0", borderTop: "1px solid var(--border-soft)" }}><span className="muted">Remaining to invoice</span><span className="semibold mono violet-text">{fmtMoney(a.remaining, cur)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Client</span><span className="semibold">{c ? c.name : "—"}</span></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Invoices</h3><span className="muted small">{linked.length}</span></div>
            {linked.length === 0 && <div className="muted small">No invoices billed against this project yet.</div>}
            {linked.map((i) => (
              <div key={i.id} className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }} onClick={() => onNav("invoice-detail", { id: i.id })}>
                <div style={{ minWidth: 0 }}><div className="semibold mono">{i.number}</div><div className="muted tiny">{fmtDateShort(i.issued)}</div></div>
                <div className="right"><div className="mono semibold">{fmtMoney((i.items || []).reduce((s, it) => s + it.qty * it.rate, 0), i.currency)}</div><StatusPill status={i.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {gen && (
        <Modal title="Generate invoice" desc={"Bill against " + p.name + " · " + fmtMoney(a.remaining, cur) + " remaining"}
          onClose={() => setGen(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setGen(false)}>Cancel</button>
            <button className="btn" onClick={() => doGen("draft")}>Save draft</button>
            <button className="btn violet" onClick={() => doGen("pending")}><Icon name="send" size={14} /> Create &amp; send</button>
          </>}>
          <div className="field"><label>Amount ({cur})</label>
            <input className="input" type="number" min="0" max={a.remaining} value={amt} onChange={(e) => setAmt(e.target.value)} />
            <div className="row gap-8 mt-8 wrap">
              {[0.25, 0.5, 1].map((f) => (
                <button key={f} className="btn ghost sm" onClick={() => setAmt(Math.round(a.remaining * f))}>{f === 1 ? "All remaining" : (f * 100) + "%"}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Description</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Milestone 2 — design phase" /></div>
          <div className="muted tiny">After this invoice, remaining to invoice will be {fmtMoney(Math.max(0, a.remaining - (Number(amt) || 0)), cur)}.</div>
        </Modal>
      )}
      {del && (
        <Modal title="Delete project?" desc={"Remove " + p.name + "."}
          onClose={() => setDel(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setDel(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { deleteProject(p.id); store.toast("Project deleted", "warn"); onNav("projects"); }}>Delete</button>
          </>}>
          <div className="muted small">Invoices stay but unlink from this project. This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}
window.ProjectsScreen = ProjectsScreen;
window.ProjectDetailScreen = ProjectDetailScreen;
