/* ============================================================
   invoices.jsx — filterable / sortable invoice table
   ============================================================ */
function InvoicesScreen({ onNav, search }) {
  const store = useStore();
  const { invoices, invoiceTotal, getClient, deleteInvoice, duplicateInvoice, business } = store;
  const { useState } = React;
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [del, setDel] = useState(null);
  const t = todayISO();

  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    paid: invoices.filter((i) => i.status === "paid").length,
  };

  let rows = invoices.slice();
  if (filter !== "all") rows = rows.filter((i) => i.status === filter);
  const q = (search || "").trim().toLowerCase();
  if (q) rows = rows.filter((i) => {
    const c = getClient(i.clientId);
    return i.number.toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q)) || (i.project || "").toLowerCase().includes(q);
  });
  rows.sort((a, b) => {
    if (sort === "due") return a.due.localeCompare(b.due);
    if (sort === "amount") return invoiceTotal(b) - invoiceTotal(a);
    return b.issued.localeCompare(a.issued) || b.number.localeCompare(a.number);
  });

  const tabs = [["all", "All"], ["draft", "Drafts"], ["pending", "Pending"], ["overdue", "Overdue"], ["paid", "Paid"]];

  return (
    <div className="screen">
      <div className="page-head">
        <div><h1>Invoices</h1><div className="sub">{invoices.length} total · {fmtMoney(invoices.filter(i=>i.status!=="paid"&&i.status!=="draft").reduce((s,i)=>s+invoiceTotal(i),0))} outstanding</div></div>
        <button className="btn violet" onClick={() => startInvoice(onNav)}><Icon name="plus" size={15} /> New invoice</button>
      </div>

      <div className="spread mb-16 wrap gap-12">
        <div className="filter-tabs">
          {tabs.map(([k, label]) => (
            <button key={k} className={"filter-tab" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>
              {label}<span className="badge">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="row gap-8">
          <Icon name="filter" size={14} color="#8a8f98" />
          <select className="input" style={{ width: 150 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="due">Due date</option>
            <option value="amount">Amount</option>
          </select>
        </div>
      </div>

      <div className="card flush">
        <table className="table">
          <thead><tr>
            <th>#</th><th>Client / Project</th><th>Issued</th><th>Due</th><th className="right">Amount</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((i) => {
              const c = getClient(i.clientId);
              const overdue = i.status === "overdue";
              return (
                <tr key={i.id} onClick={() => onNav("invoice-detail", { id: i.id })}>
                  <td className="mono semibold">{i.number}</td>
                  <td><ClientCell client={c} sub={i.project} /></td>
                  <td className="muted">{fmtDateShort(i.issued)}</td>
                  <td className={overdue ? "warn-text" : "muted"}>
                    {fmtDateShort(i.due)}{overdue && <span className="tiny"> · {Math.abs(daysBetween(i.due, t))}d ago</span>}
                  </td>
                  <td className="right mono semibold">{fmtMoney(invoiceTotal(i), i.currency)}</td>
                  <td><StatusPill status={i.status} /></td>
                  <td className="right">
                    <RowMenu items={[
                      { icon: "eye", label: "View", onClick: () => onNav("invoice-detail", { id: i.id }) },
                      { icon: "edit", label: "Edit", onClick: () => onNav("editor", { id: i.id }) },
                      { icon: "copy", label: "Duplicate", onClick: () => duplicateInvoice(i.id) },
                      { icon: "download", label: "Download PDF", onClick: () => downloadInvoice(i, c, business, invoiceTotal) },
                      { icon: "trash", label: "Delete", danger: true, onClick: () => setDel(i) },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty"><div className="e-icon"><Icon name="receipt" size={22} /></div>
            <div><div className="semibold" style={{ color: "var(--porcelain)" }}>No invoices match</div><div className="small">Try a different filter or search term.</div></div>
          </div>
        )}
      </div>

      {del && (
        <Modal title="Delete invoice?" desc={"This permanently removes " + del.number + "."}
          onClose={() => setDel(null)}
          footer={<>
            <button className="btn ghost" onClick={() => setDel(null)}>Cancel</button>
            <button className="btn danger" onClick={() => { deleteInvoice(del.id); store.toast("Invoice deleted", "warn"); setDel(null); }}>Delete</button>
          </>}>
          <div className="muted small">Activity history for this invoice will be lost. This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}
window.InvoicesScreen = InvoicesScreen;
