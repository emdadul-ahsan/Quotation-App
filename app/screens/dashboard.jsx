/* ============================================================
   dashboard.jsx — KPIs, cashflow chart, upcoming, activity
   ============================================================ */
function DashboardScreen({ onNav }) {
  const store = useStore();
  const { invoices, invoiceTotal, getClient, projects, projectAmounts } = store;
  const t = todayISO();

  const projAgg = projects.reduce((acc, p) => {
    const a = projectAmounts(p);
    acc.valuation += a.total; acc.invoiced += a.invoiced; acc.paid += a.paid; acc.remaining += a.remaining;
    return acc;
  }, { valuation: 0, invoiced: 0, paid: 0, remaining: 0 });
  const topProjects = [...projects].sort((a, b) => projectAmounts(b).remaining - projectAmounts(a).remaining).slice(0, 5);

  const paid = invoices.filter((i) => i.status === "paid");
  const totalEarned = paid.reduce((s, i) => s + invoiceTotal(i), 0);
  const awaiting = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + invoiceTotal(i), 0);
  const paidThisMonth = paid.filter((i) => i.paidOn && daysBetween(i.paidOn, t) <= 30).reduce((s, i) => s + invoiceTotal(i), 0);
  const overdueInvs = invoices.filter((i) => i.status === "overdue");
  const overdueSum = overdueInvs.reduce((s, i) => s + invoiceTotal(i), 0);

  /* cashflow: last 6 months of paid */
  const months = React.useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      arr.push({ key: d.getFullYear() + "-" + d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }), total: 0 });
    }
    paid.forEach((i) => {
      if (!i.paidOn) return;
      const d = new Date(i.paidOn + "T00:00:00");
      const key = d.getFullYear() + "-" + d.getMonth();
      const m = arr.find((x) => x.key === key);
      if (m) m.total += invoiceTotal(i);
    });
    return arr;
  }, [invoices]);
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  const upcoming = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);

  const recent = React.useMemo(() => {
    const all = [];
    invoices.forEach((i) => i.activity.forEach((a) => all.push({ ...a, inv: i })));
    return all.sort((a, b) => b.when.localeCompare(a.when)).slice(0, 5);
  }, [invoices]);

  return (
    <div className="screen">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Here's what needs your attention today.</div>
        </div>
        <div className="row gap-8">
          <button className="btn ghost" onClick={() => onNav("invoices")}>View all invoices</button>
          <button className="btn violet" onClick={() => onNav("editor")}><Icon name="plus" size={15} /> New invoice</button>
        </div>
      </div>

      <div className="grid grid-4 mb-24">
        <div className="kpi"><div className="label">Total earned</div><div className="value">{fmtMoney(totalEarned)}</div><div className="trend">All-time paid</div></div>
        <div className="kpi"><div className="label">Awaiting payment</div><div className="value">{fmtMoney(awaiting)}</div><div className="trend">{invoices.filter(i=>i.status==="pending"||i.status==="overdue").length} open invoices</div></div>
        <div className="kpi ok"><div className="label">Paid this month</div><div className="value">{fmtMoney(paidThisMonth)}</div><div className="trend">Last 30 days</div></div>
        <div className={"kpi" + (overdueSum > 0 ? " warn" : "")}><div className="label">Overdue</div><div className="value">{fmtMoney(overdueSum)}</div><div className="trend">{overdueInvs.length} invoices late</div></div>
      </div>

      <div className="grid grid-asym">
        <div className="card">
          <div className="card-head"><h3>Cashflow</h3><span className="muted small">Last 6 months · paid</span></div>
          <div className="chart">
            {months.map((m) => (
              <div className="col-bar" key={m.key}>
                <div className="bar-val">{m.total ? "$" + Math.round(m.total / 1000) + "k" : ""}</div>
                <div className="bar-fill" style={{ height: (m.total / maxMonth) * 100 + "%" }} />
                <div className="bar-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Upcoming payments</h3></div>
          {upcoming.length === 0 && <div className="muted small">Nothing due. You're all caught up.</div>}
          {upcoming.map((i) => {
            const c = getClient(i.clientId);
            const late = i.status === "overdue";
            return (
              <div key={i.id} className="spread" style={{ padding: "9px 0", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }} onClick={() => onNav("invoice-detail", { id: i.id })}>
                <div className="row gap-12"><Avatar name={c ? c.name : "?"} color={c ? c.color : "#444"} size={26} />
                  <div><div className="semibold">{c ? c.name : "—"}</div><div className="muted tiny mono">{i.number}</div></div>
                </div>
                <div className="right"><div className="semibold mono">{fmtMoney(invoiceTotal(i), i.currency)}</div>
                  <div className={"tiny " + (late ? "warn-text" : "muted")}>{late ? Math.abs(daysBetween(i.due, t)) + "d overdue" : "in " + daysBetween(t, i.due) + "d"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-head">
          <h3>Projects</h3>
          <button className="btn ghost sm" onClick={() => onNav("projects")}>View all</button>
        </div>
        {projects.length === 0 && <div className="muted small">No projects yet. Create one to track billing against a valuation.</div>}
        {projects.length > 0 && (
          <div className="grid grid-4 mb-16">
            <div><div className="muted tiny">Total valuation</div><div className="semibold mono">{fmtMoney(projAgg.valuation)}</div></div>
            <div><div className="muted tiny">Invoiced</div><div className="semibold mono">{fmtMoney(projAgg.invoiced)}</div></div>
            <div><div className="muted tiny">Paid</div><div className="semibold mono ok-text">{fmtMoney(projAgg.paid)}</div></div>
            <div><div className="muted tiny">Remaining to invoice</div><div className="semibold mono violet-text">{fmtMoney(projAgg.remaining)}</div></div>
          </div>
        )}
        {topProjects.map((p) => {
          const c = getClient(p.clientId);
          const a = projectAmounts(p);
          return (
            <div key={p.id} className="proj-row" onClick={() => onNav("project-detail", { id: p.id })}>
              <div className="row gap-12" style={{ minWidth: 0 }}>
                <Avatar name={c ? c.name : "?"} color={c ? c.color : "#444"} size={28} />
                <div style={{ minWidth: 0 }}><div className="semibold truncate">{p.name}</div><div className="muted tiny truncate">{c ? c.name : "—"}</div></div>
              </div>
              <div className="proj-bar">
                <div className="progress"><div className="bar" style={{ width: a.pct + "%" }} /></div>
                <div className="muted tiny mt-4">{fmtMoney(a.invoiced, p.currency)} of {fmtMoney(a.total, p.currency)} · {a.pct}%</div>
              </div>
              <div className="right"><div className="semibold mono violet-text">{fmtMoney(a.remaining, p.currency)}</div><div className="muted tiny">remaining</div></div>
            </div>
          );
        })}
      </div>

      <div className="card mt-24">
        <div className="card-head"><h3>Recent activity</h3></div>
        <div className="timeline">
          {recent.map((a) => (
            <div key={a.inv.id + a.id} className="tl-item" style={{ cursor: "pointer" }} onClick={() => onNav("invoice-detail", { id: a.inv.id })}>
              <span className={"tl-dot " + a.type} />
              <div className="tl-body">
                <div className="note"><span className="mono">{a.inv.number}</span> — {a.note}</div>
                <div className="when">{fmtDate(a.when)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
