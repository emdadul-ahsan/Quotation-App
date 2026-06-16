/* ============================================================
   invoice-detail.jsx — paper view, banners, timeline, actions
   ============================================================ */
function InvoiceDetailScreen({ onNav, params }) {
  const store = useStore();
  const { getInvoice, getClient, invoiceTotal, invoicesByClient, markPaid, sendInvoice, sendReminder, deleteInvoice, business } = store;
  const { useState } = React;
  const [payModal, setPayModal] = useState(false);
  const [del, setDel] = useState(false);
  const [method, setMethod] = useState(business.paymentMethods[0] || "Manual");
  const [ref, setRef] = useState("");

  const inv = getInvoice(params.id);
  if (!inv) return <div className="screen"><div className="empty"><div className="e-icon"><Icon name="receipt" size={22} /></div><div>Invoice not found.</div><button className="btn ghost" onClick={() => onNav("invoices")}>Back to invoices</button></div></div>;

  const c = getClient(inv.clientId);
  const total = invoiceTotal(inv);
  const t = todayISO();
  const clientInvs = invoicesByClient(inv.clientId);
  const lifetime = clientInvs.filter((x) => x.status === "paid").reduce((s, x) => s + invoiceTotal(x), 0);
  const openedAct = inv.activity.find((a) => a.type === "opened");
  const stamp = inv.status === "paid" ? "paid" : inv.status === "overdue" ? "overdue" : null;

  return (
    <div className="screen">
      <div className="page-head">
        <div className="row gap-12">
          <button className="icon-btn" onClick={() => onNav("invoices")}><Icon name="back" size={16} /></button>
          <div><h1 className="mono">{inv.number}</h1><div className="sub">{inv.project || "—"}</div></div>
          <StatusPill status={inv.status} />
        </div>
        <div className="row gap-8">
          {inv.status === "draft" && <button className="btn violet" onClick={() => sendInvoice(inv.id)}><Icon name="send" size={14} /> Send</button>}
          {inv.status === "overdue" && <button className="btn ghost" onClick={() => sendReminder(inv.id)}><Icon name="bell" size={14} /> Send reminder</button>}
          {inv.status !== "paid" && <button className="btn ok" onClick={() => setPayModal(true)}><Icon name="check" size={14} /> Mark paid</button>}
          <button className="btn ghost" onClick={() => downloadInvoice(inv, c, business, invoiceTotal)}><Icon name="download" size={14} /> Download PDF</button>
          <RowMenu items={[
            { icon: "edit", label: "Edit", onClick: () => onNav("editor", { id: inv.id }) },
            { icon: "trash", label: "Delete", danger: true, onClick: () => setDel(true) },
          ]} />
        </div>
      </div>

      {inv.status === "paid" && (
        <div className="banner ok">
          <div className="b-icon"><Icon name="check" size={20} /></div>
          <div><div className="b-title">Paid {fmtMoney(total, inv.currency)} on {fmtDate(inv.paidOn)}</div>
            <div className="b-sub">{inv.method}{inv.ref ? " · " + inv.ref : ""}</div></div>
        </div>
      )}
      {inv.status === "overdue" && (
        <div className="banner warn">
          <div className="b-icon"><Icon name="clock" size={20} /></div>
          <div><div className="b-title">Overdue by {Math.abs(daysBetween(inv.due, t))} days</div>
            <div className="b-sub">Due {fmtDate(inv.due)}{openedAct ? " · opened " + fmtDate(openedAct.when) : ""}</div></div>
        </div>
      )}

      <div className="grid grid-asym">
        <div><InvoicePaper inv={inv} client={c} business={business} total={total} stamp={stamp} /></div>

        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Timeline</h3></div>
            <div className="timeline">
              {inv.activity.slice().reverse().map((a) => (
                <div key={a.id} className="tl-item">
                  <span className={"tl-dot " + a.type} />
                  <div className="tl-body"><div className="note">{a.note}</div><div className="when">{fmtDate(a.when)}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Client</h3></div>
            <ClientCell client={c} sub={c ? c.email : ""} />
            <div className="grid grid-2 mt-16">
              <div><div className="muted tiny">Lifetime billed</div><div className="semibold mono">{fmtMoney(lifetime)}</div></div>
              <div><div className="muted tiny">Invoices</div><div className="semibold mono">{clientInvs.length}</div></div>
            </div>
            <button className="btn ghost sm mt-16" onClick={() => onNav("clients")}>View client</button>
          </div>
        </div>
      </div>

      {payModal && (
        <Modal title="Mark as paid" desc={"Record payment for " + inv.number + " · " + fmtMoney(total, inv.currency)}
          onClose={() => setPayModal(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setPayModal(false)}>Cancel</button>
            <button className="btn ok" onClick={() => { markPaid(inv.id, { method, ref }); setPayModal(false); }}>Confirm payment</button>
          </>}>
          <div className="field"><label>Payment method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {business.paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="Manual">Manual</option>
            </select>
          </div>
          <div className="field"><label>Reference (optional)</label>
            <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ch_3PqRf2hzL" />
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Delete invoice?" desc={"This permanently removes " + inv.number + "."}
          onClose={() => setDel(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setDel(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { deleteInvoice(inv.id); store.toast("Invoice deleted", "warn"); onNav("invoices"); }}>Delete</button>
          </>}>
          <div className="muted small">This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}
window.InvoiceDetailScreen = InvoiceDetailScreen;
