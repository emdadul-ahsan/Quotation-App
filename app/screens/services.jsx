/* ============================================================
   services.jsx — global service catalog CRUD
   ============================================================ */
function ServicesScreen({ onNav }) {
  const store = useStore();
  const { services, createService, updateService, deleteService, business, invoices } = store;
  const [modal, setModal] = React.useState(null); // {mode, svc}
  const [del, setDel] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", description: "", rate: 0, currency: business.defaultCurrency });

  const open = (mode, svc) => {
    setForm(svc ? { name: svc.name, description: svc.description, rate: svc.rate, currency: svc.currency } : { name: "", description: "", rate: 0, currency: business.defaultCurrency });
    setModal({ mode, svc });
  };
  const save = () => {
    if (!form.name.trim()) { store.toast("Service name required", "warn"); return; }
    if (modal.mode === "add") { createService(form); store.toast("Service added", "ok"); }
    else { updateService(modal.svc.id, { ...form, rate: Number(form.rate) }); store.toast("Service updated", "ok"); }
    setModal(null);
  };
  const usage = (svc) => invoices.reduce((c, i) => c + i.items.filter((it) => it.desc === svc.name).length, 0);

  return (
    <div className="screen">
      <div className="page-head">
        <div><h1>Services</h1><div className="sub">{services.length} reusable services · pull into any invoice</div></div>
        <button className="btn violet" onClick={() => open("add")}><Icon name="plus" size={15} /> Add service</button>
      </div>

      <div className="card flush">
        <table className="table">
          <thead><tr><th>Service</th><th>Description</th><th className="right">Default rate</th><th>Currency</th><th className="right">Used</th><th></th></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} onClick={() => open("edit", s)}>
                <td className="semibold">{s.name}</td>
                <td className="muted truncate" style={{ maxWidth: 320 }}>{s.description || "—"}</td>
                <td className="right mono semibold">{fmtMoney(s.rate, s.currency)}</td>
                <td className="mono">{s.currency}</td>
                <td className="right mono muted">{usage(s)}×</td>
                <td className="right">
                  <RowMenu items={[
                    { icon: "edit", label: "Edit", onClick: () => open("edit", s) },
                    { icon: "trash", label: "Delete", danger: true, onClick: () => setDel(s) },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <div className="empty"><div className="e-icon"><Icon name="sparkle" size={22} /></div>
            <div><div className="semibold" style={{ color: "var(--porcelain)" }}>No services yet</div><div className="small">Add a service to reuse it across invoices.</div></div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add service" : "Edit service"} desc="Reusable across all invoices and clients."
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn violet" onClick={save}>{modal.mode === "add" ? "Add service" : "Save"}</button>
          </>}>
          <div className="field"><label>Service name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Discovery sprint" /></div>
          <div className="field"><label>Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's included…" /></div>
          <div className="grid grid-2">
            <div className="field"><label>Default rate</label><input className="input" type="number" min="0" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div>
            <div className="field"><label>Currency</label>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.sym}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Delete service?" desc={"Remove " + del.name + " from your catalog."}
          onClose={() => setDel(null)}
          footer={<>
            <button className="btn ghost" onClick={() => setDel(null)}>Cancel</button>
            <button className="btn danger" onClick={() => { deleteService(del.id); store.toast("Service deleted", "warn"); setDel(null); }}>Delete</button>
          </>}>
          <div className="muted small">Existing invoice line items are unaffected. This cannot be undone.</div>
        </Modal>
      )}
    </div>
  );
}
window.ServicesScreen = ServicesScreen;
