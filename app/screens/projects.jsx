/* ============================================================
   projects.jsx — ProjectsScreen + ProjectDetailScreen
   ============================================================ */
function ProjectsScreen({ onNav }) {
  const store = useStore();
  const { projects, getClient, projectProgress, projectAmounts } = store;
  return (
    <div className="screen">
      <div className="page-head">
        <div><h1>Projects</h1><div className="sub">{projects.length} active engagements</div></div>
      </div>
      <div className="grid grid-3">
        {projects.map((p) => {
          const c = getClient(p.clientId);
          const prog = projectProgress(p);
          const amt = projectAmounts(p);
          return (
            <div key={p.id} className="card click" onClick={() => onNav("project-detail", { id: p.id })}>
              <div className="row gap-12 mb-16">
                <Avatar name={c ? c.name : "?"} color={c ? c.color : "#444"} size={34} />
                <div style={{ minWidth: 0 }}><div className="semibold truncate">{p.name}</div><div className="muted small truncate">{c ? c.name : "—"}</div></div>
              </div>
              <div className="spread mb-8"><span className="muted small">{prog.done}/{prog.total} milestones</span><span className="small semibold">{prog.pct}%</span></div>
              <div className={"progress" + (prog.pct === 100 ? " ok" : "")}><div className="bar" style={{ width: prog.pct + "%" }} /></div>
              <div className="grid grid-3 mt-16">
                <div><div className="muted tiny">Paid</div><div className="semibold mono ok-text">{fmtMoney(amt.paid)}</div></div>
                <div><div className="muted tiny">Remaining</div><div className="semibold mono">{fmtMoney(amt.remaining)}</div></div>
                <div><div className="muted tiny">Total</div><div className="semibold mono">{fmtMoney(amt.total)}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetailScreen({ onNav, params }) {
  const store = useStore();
  const { getProject, getClient, getInvoice, projectProgress, projectAmounts, toggleMilestone, invoiceMilestone } = store;
  const p = getProject(params.id);
  if (!p) return <div className="screen"><div className="empty"><div>Project not found.</div><button className="btn ghost" onClick={() => onNav("projects")}>Back</button></div></div>;
  const c = getClient(p.clientId);
  const prog = projectProgress(p);
  const amt = projectAmounts(p);
  const linked = p.milestones.filter((m) => m.invoiceId).map((m) => getInvoice(m.invoiceId)).filter(Boolean);

  return (
    <div className="screen">
      <div className="page-head">
        <div className="row gap-12">
          <button className="icon-btn" onClick={() => onNav("projects")}><Icon name="back" size={16} /></button>
          <div><h1>{p.name}</h1><div className="sub">{c ? c.name : "—"} · {p.currency}</div></div>
        </div>
      </div>

      <div className="grid grid-asym">
        <div className="col gap-16">
          <div className="card">
            <div className="spread mb-16">
              <div><div className="muted small">Progress</div><div style={{ fontSize: 28, fontWeight: 600 }}>{prog.pct}%</div></div>
              <div className="right"><div className="muted small">Earned so far</div><div className="ok-text mono" style={{ fontSize: 24, fontWeight: 600 }}>{fmtMoney(amt.paid)}</div></div>
            </div>
            <div className={"progress" + (prog.pct === 100 ? " ok" : "")}><div className="bar" style={{ width: prog.pct + "%" }} /></div>
            <div className="spread mt-8"><span className="muted tiny">{fmtMoney(amt.paid)} earned</span><span className="muted tiny">{fmtMoney(amt.remaining)} remaining</span></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Milestones</h3></div>
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
                  <span className="ms-amt">{fmtMoney(m.amount)}</span>
                  {linkedInv
                    ? <span onClick={() => onNav("invoice-detail", { id: linkedInv.id })} style={{ cursor: "pointer" }}><StatusPill status={linkedInv.status} /></span>
                    : done
                      ? <button className="btn violet sm" onClick={() => invoiceMilestone(p.id, m.id)}><Icon name="send" size={12} /> Send invoice</button>
                      : <button className="btn ghost sm" onClick={() => toggleMilestone(p.id, m.id)}>Mark done</button>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Summary</h3></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Contract total</span><span className="semibold mono">{fmtMoney(amt.total)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Paid</span><span className="semibold mono ok-text">{fmtMoney(amt.paid)}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Remaining</span><span className="semibold mono">{fmtMoney(amt.remaining)}</span></div>
            <div className="spread" style={{ padding: "7px 0", borderTop: "1px solid var(--border-soft)" }}><span className="muted">Client</span><span className="semibold">{c ? c.name : "—"}</span></div>
            <div className="spread" style={{ padding: "7px 0" }}><span className="muted">Milestones</span><span className="semibold mono">{prog.total}</span></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Linked invoices</h3></div>
            {linked.length === 0 && <div className="muted small">No invoices generated yet.</div>}
            {linked.map((i) => (
              <div key={i.id} className="spread" style={{ padding: "9px 0", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }} onClick={() => onNav("invoice-detail", { id: i.id })}>
                <div><div className="semibold mono">{i.number}</div><div className="muted tiny truncate">{i.project}</div></div>
                <StatusPill status={i.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.ProjectsScreen = ProjectsScreen;
window.ProjectDetailScreen = ProjectDetailScreen;
