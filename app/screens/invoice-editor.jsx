/* ============================================================
   invoice-editor.jsx — form + live preview
   ============================================================ */
function InvoiceEditorScreen({ onNav, params }) {
  const store = useStore();
  const { getInvoice, clients, projects, business, services, createInvoice, updateInvoice, invoiceTotal } = store;
  const { useState } = React;
  const editing = params.id ? getInvoice(params.id) : null;

  const blank = {
    clientId: clients[0] ? clients[0].id : "",
    projectId: "", project: "", issued: todayISO(), due: daysFromNow(30),
    currency: business.defaultCurrency || "USD",
    method: business.paymentMethods[0] || "",
    items: [{ id: "l1", desc: "", qty: 1, rate: 0 }], notes: "Net 30. Thank you for your business.",
  };
  const [form, setForm] = useState(() => editing
    ? { clientId: editing.clientId, projectId: editing.projectId || "", project: editing.project, issued: editing.issued, due: editing.due, currency: editing.currency || business.defaultCurrency, method: editing.method || business.paymentMethods[0] || "", items: editing.items.map((x) => ({ ...x })), notes: editing.notes }
    : blank);
  const [svcPick, setSvcPick] = useState("");

  /* projects for the chosen client first, then the rest */
  const sortedProjects = [...projects].sort((a, b) => (a.clientId === form.clientId ? -1 : 1) - (b.clientId === form.clientId ? -1 : 1));
  const onProject = (pid) => {
    const p = projects.find((x) => x.id === pid);
    setForm((f) => ({ ...f, projectId: pid, project: p ? p.name : "", currency: p && p.currency ? p.currency : f.currency, clientId: p ? p.clientId : f.clientId }));
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (id, k, v) => setForm((f) => ({ ...f, items: f.items.map((it) => it.id === id ? { ...it, [k]: k === "desc" ? v : Number(v) } : it) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { id: "l-" + Date.now() + Math.random().toString(36).slice(2, 6), desc: "", qty: 1, rate: 0 }] }));
  const removeItem = (id) => setForm((f) => f.items.length > 1 ? { ...f, items: f.items.filter((it) => it.id !== id) } : f);
  const addService = (sid) => {
    const s = services.find((x) => x.id === sid);
    if (!s) return;
    setForm((f) => ({ ...f, currency: f.currency || s.currency, items: [...f.items.filter((it) => it.desc || it.rate), { id: "l-" + Date.now() + Math.random().toString(36).slice(2, 6), desc: s.name, qty: 1, rate: s.rate }] }));
    setSvcPick("");
    store.toast(s.name + " added", "ok");
  };

  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  const client = clients.find((c) => c.id === form.clientId);

  const preview = { number: editing ? editing.number : "INV-DRAFT", ...form };

  const save = (status) => {
    if (editing) {
      updateInvoice(editing.id, { ...form, ...(status === "pending" && editing.status === "draft" ? { status: "pending" } : {}) });
      if (status === "pending" && editing.status === "draft") {
        // append sent activity
        const inv = getInvoice(editing.id);
        updateInvoice(editing.id, { activity: [...inv.activity, { id: "a-" + Date.now(), type: "sent", when: todayISO(), note: "Invoice sent" }] });
      }
      store.toast(status === "pending" ? "Invoice sent" : "Draft saved", "ok");
      onNav("invoice-detail", { id: editing.id });
    } else {
      const created = createInvoice({ ...form, status });
      store.toast(status === "pending" ? "Invoice created & sent" : "Draft saved", "ok");
      onNav("invoice-detail", { id: created.id });
    }
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div className="row gap-12">
          <button className="icon-btn" onClick={() => onNav("invoices")}><Icon name="back" size={16} /></button>
          <div><h1>{editing ? "Edit " + editing.number : "New invoice"}</h1><div className="sub">Form updates the preview live.</div></div>
        </div>
        <div className="row gap-8">
          <button className="btn ghost" onClick={() => onNav(editing ? "invoice-detail" : "invoices", editing ? { id: editing.id } : undefined)}>Cancel</button>
          <button className="btn" onClick={() => save("draft")}>Save draft</button>
          <button className="btn violet" onClick={() => save("pending")}><Icon name="send" size={14} /> Save &amp; send</button>
        </div>
      </div>

      <div className="editor-split">
        {/* FORM */}
        <div className="col gap-16">
          <div className="card">
            <div className="card-head"><h3>Parties &amp; dates</h3></div>
            <div className="grid grid-2">
              <div className="field"><label>Bill to</label>
                <select className="input" value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Project</label>
                <select className="input" value={form.projectId} onChange={(e) => onProject(e.target.value)}>
                  <option value="">— No project —</option>
                  {sortedProjects.map((p) => {
                    const pc = clients.find((c) => c.id === p.clientId);
                    return <option key={p.id} value={p.id}>{p.name}{pc ? " · " + pc.name : ""}</option>;
                  })}
                </select>
              </div>
              <div className="field"><label>Issued</label>
                <input type="date" className="input" value={form.issued} onChange={(e) => set("issued", e.target.value)} />
              </div>
              <div className="field"><label>Due</label>
                <input type="date" className="input" value={form.due} onChange={(e) => set("due", e.target.value)} />
              </div>
              <div className="field"><label>Currency</label>
                <select className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.label}</option>)}
                </select>
              </div>
              <div className="field"><label>Payment method</label>
                <select className="input" value={form.method} onChange={(e) => set("method", e.target.value)}>
                  {business.paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Line items</h3>
              <select className="input" style={{ width: 200 }} value={svcPick} onChange={(e) => addService(e.target.value)}>
                <option value="">+ Add from service…</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} · {fmtMoney(s.rate, s.currency)}</option>)}
              </select>
            </div>
            <div className="line-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span></div>
            {form.items.map((it) => (
              <div className="line-row" key={it.id}>
                <input className="input" value={it.desc} onChange={(e) => setItem(it.id, "desc", e.target.value)} placeholder="Discovery sprint" />
                <input className="input" type="number" min="0" value={it.qty} onChange={(e) => setItem(it.id, "qty", e.target.value)} />
                <input className="input" type="number" min="0" value={it.rate} onChange={(e) => setItem(it.id, "rate", e.target.value)} />
                <span className="lr-amt">{fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), form.currency)}</span>
                <button className="icon-x" onClick={() => removeItem(it.id)}><Icon name="trash" size={14} /></button>
              </div>
            ))}
            <button className="btn ghost sm mt-8" onClick={addItem}><Icon name="plus" size={13} /> Add line</button>

            <div className="totals-box">
              <div className="tr"><span className="muted">Subtotal</span><span className="mono">{fmtMoney(subtotal, form.currency)}</span></div>
              <div className="tr"><span className="muted">Tax (0%)</span><span className="mono">{fmtMoney(0, form.currency)}</span></div>
              <div className="tr grand"><span>Total · {form.currency}</span><span className="mono">{fmtMoney(subtotal, form.currency)}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Notes &amp; terms</h3></div>
            <textarea className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Payment terms, thank-you note…" />
          </div>
        </div>

        {/* PREVIEW */}
        <div className="preview-sticky">
          <div className="muted small mb-8">Live preview</div>
          <InvoicePaper inv={preview} client={client} business={business} total={subtotal} stamp={null} />
        </div>
      </div>
    </div>
  );
}
window.InvoiceEditorScreen = InvoiceEditorScreen;
