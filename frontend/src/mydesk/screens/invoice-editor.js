import React, { useState } from "react";
import { daysFromNow, fmtMoney, useStore } from "../store";
import { Icon } from "../ui";

const makeDraft = (invoice) => {
  if (invoice) {
    return {
      clientId: invoice.clientId || "",
      project: invoice.project || "",
      issued: invoice.issued,
      due: invoice.due,
      items: invoice.items.map((item) => ({ ...item })),
      notes: invoice.notes || "",
    };
  }
  return {
    clientId: "",
    project: "",
    issued: new Date().toISOString().slice(0, 10),
    due: daysFromNow(14),
    items: [{ id: `l-${Date.now()}`, desc: "Service", qty: 1, rate: 0 }],
    notes: "Net 14 · Thank you for your business.",
  };
};

export const InvoiceEditorScreen = ({ id, onNav }) => {
  const store = useStore();
  const sourceInvoice = id ? store.getInvoice(id) : null;
  const [form, setForm] = useState(() => {
    const next = makeDraft(sourceInvoice);
    if (!id) {
      const prefillClientId = window.sessionStorage.getItem("mydesk_prefill_client");
      if (prefillClientId) {
        next.clientId = prefillClientId;
        window.sessionStorage.removeItem("mydesk_prefill_client");
      }
    }
    return next;
  });

  const business = store.business;
  const client = store.getClient(form.clientId);

  const subtotal = form.items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0),
    0,
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const patchLine = (lineId, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === lineId ? { ...item, ...patch } : item)),
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: `l-${Date.now()}`, desc: "", qty: 1, rate: 0 }],
    }));
  };

  const removeLine = (lineId) => {
    setForm((prev) => {
      if (prev.items.length <= 1) {
        return prev;
      }
      return { ...prev, items: prev.items.filter((item) => item.id !== lineId) };
    });
  };

  const saveDraft = () => {
    if (!form.clientId) {
      store.toast("Pick a client before saving", "warn");
      return;
    }

    if (sourceInvoice) {
      store.updateInvoice(sourceInvoice.id, {
        ...form,
        status: sourceInvoice.status === "paid" ? "paid" : "draft",
      });
      store.toast("Draft saved", "ok");
      onNav("invoice-detail", { id: sourceInvoice.id });
      return;
    }

    const created = store.createInvoice({ ...form, status: "draft" });
    onNav("invoice-detail", { id: created.id });
  };

  const saveAndSend = () => {
    if (!form.clientId) {
      store.toast("Pick a client before sending", "warn");
      return;
    }

    if (sourceInvoice) {
      store.updateInvoice(sourceInvoice.id, { ...form });
      store.sendInvoice(sourceInvoice.id);
      onNav("invoice-detail", { id: sourceInvoice.id });
      return;
    }

    const created = store.createInvoice({ ...form, status: "pending" });
    store.toast("Invoice created and sent", "ok");
    onNav("invoice-detail", { id: created.id });
  };

  return (
    <section className="page" data-testid="invoice-editor-screen">
      <div className="page-head" data-testid="invoice-editor-header">
        <div>
          <h1 className="page-title">{sourceInvoice ? `Edit ${sourceInvoice.number}` : "New invoice"}</h1>
          <p className="muted">Form on the left, live paper preview on the right.</p>
        </div>
        <div className="row gap-8">
          <button className="btn ghost" onClick={() => onNav("invoices")} data-testid="editor-cancel-button">
            Cancel
          </button>
          <button className="btn" onClick={saveDraft} data-testid="editor-save-draft-button">
            Save draft
          </button>
          <button className="btn violet" onClick={saveAndSend} data-testid="editor-save-send-button">
            <Icon name="send" size={14} />
            Save & send
          </button>
        </div>
      </div>

      <div className="grid editor-grid" data-testid="editor-grid-layout">
        <article className="card" data-testid="editor-form-card">
          <h2>Parties & dates</h2>
          <div className="grid grid-2">
            <label className="field" data-testid="editor-client-field">
              <span className="tiny muted">Bill to</span>
              <select
                className="input"
                value={form.clientId}
                onChange={(event) => setField("clientId", event.target.value)}
                data-testid="editor-client-select"
              >
                <option value="">Select client</option>
                {store.clients.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" data-testid="editor-project-field">
              <span className="tiny muted">Project</span>
              <input
                className="input"
                value={form.project}
                onChange={(event) => setField("project", event.target.value)}
                placeholder="Website redesign · phase 1"
                data-testid="editor-project-input"
              />
            </label>

            <label className="field" data-testid="editor-issued-field">
              <span className="tiny muted">Issued</span>
              <input
                type="date"
                className="input"
                value={form.issued}
                onChange={(event) => setField("issued", event.target.value)}
                data-testid="editor-issued-date"
              />
            </label>

            <label className="field" data-testid="editor-due-field">
              <span className="tiny muted">Due</span>
              <input
                type="date"
                className="input"
                value={form.due}
                onChange={(event) => setField("due", event.target.value)}
                data-testid="editor-due-date"
              />
            </label>
          </div>

          <div className="section" data-testid="editor-line-items-section">
            <div className="row between">
              <h2>Line items</h2>
              <button className="btn ghost" onClick={addLine} data-testid="editor-add-line-button">
                <Icon name="plus" size={14} />
                Add line
              </button>
            </div>

            <div className="stack">
              {form.items.map((item) => (
                <div className="line-row" key={item.id} data-testid={`editor-line-item-${item.id}`}>
                  <input
                    className="input"
                    placeholder="Description"
                    value={item.desc}
                    onChange={(event) => patchLine(item.id, { desc: event.target.value })}
                    data-testid={`editor-line-desc-${item.id}`}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={item.qty}
                    onChange={(event) => patchLine(item.id, { qty: Number(event.target.value) })}
                    data-testid={`editor-line-qty-${item.id}`}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => patchLine(item.id, { rate: Number(event.target.value) })}
                    data-testid={`editor-line-rate-${item.id}`}
                  />
                  <div className="line-amount mono" data-testid={`editor-line-amount-${item.id}`}>
                    {fmtMoney(Number(item.qty || 0) * Number(item.rate || 0))}
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => removeLine(item.id)}
                    data-testid={`editor-line-remove-${item.id}`}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="totals-inline" data-testid="editor-totals-inline">
              <div>
                <span className="muted">Subtotal</span>
                <strong className="mono">{fmtMoney(subtotal)}</strong>
              </div>
              <div>
                <span className="muted">Tax</span>
                <strong className="mono">{fmtMoney(0)}</strong>
              </div>
              <div>
                <span className="muted">Total</span>
                <strong className="mono">{fmtMoney(subtotal)}</strong>
              </div>
            </div>
          </div>

          <label className="field" data-testid="editor-notes-field">
            <span className="tiny muted">Notes & terms</span>
            <textarea
              className="input textarea"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              rows={5}
              data-testid="editor-notes-input"
            />
          </label>
        </article>

        <article className="card inv-paper sticky" data-testid="editor-live-preview">
          <div className="inv-head">
            <div>
              <h2>Invoice Preview</h2>
              <p className="tiny muted mono">{sourceInvoice?.number || "Auto number on save"}</p>
            </div>
            <div className="align-right">
              {business.logo ? (
                <img src={business.logo} alt="Business logo" className="logo-preview" data-testid="editor-preview-logo" />
              ) : (
                <strong>{business.name}</strong>
              )}
              <span className="tiny muted">{business.email}</span>
            </div>
          </div>

          <div className="inv-party-grid">
            <div>
              <div className="tiny muted">From</div>
              <div className="semibold">{business.name}</div>
              <div className="tiny muted">{business.addr}</div>
            </div>
            <div>
              <div className="tiny muted">Bill to</div>
              <div className="semibold">{client?.name || "Select a client"}</div>
              <div className="tiny muted">{client?.addr || ""}</div>
            </div>
          </div>

          <table className="table compact" data-testid="editor-preview-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item) => (
                <tr key={item.id} data-testid={`editor-preview-row-${item.id}`}>
                  <td>{item.desc || "Service"}</td>
                  <td>{item.qty}</td>
                  <td>{fmtMoney(item.rate || 0)}</td>
                  <td>{fmtMoney(Number(item.qty || 0) * Number(item.rate || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals" data-testid="editor-preview-totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span className="mono">{fmtMoney(subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>Tax</span>
              <span className="mono">{fmtMoney(0)}</span>
            </div>
            <div className="totals-row strong">
              <span>Total</span>
              <span className="mono">{fmtMoney(subtotal)}</span>
            </div>
          </div>

          <p className="small muted" data-testid="editor-preview-notes">
            {form.notes}
          </p>
        </article>
      </div>
    </section>
  );
};
