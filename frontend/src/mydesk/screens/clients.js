import React, { useMemo, useState } from "react";
import { fmtMoney, useStore } from "../store";
import { Icon, Modal } from "../ui";

const initialForm = { name: "", email: "", addr: "" };

export const ClientsScreen = ({ onNav, search }) => {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [form, setForm] = useState(initialForm);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return store.clients;
    }
    return store.clients.filter((client) =>
      [client.name, client.email, client.addr]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, store.clients]);

  const openAdd = () => {
    setForm(initialForm);
    setShowAdd(true);
  };

  const openEdit = (client) => {
    setForm({ name: client.name || "", email: client.email || "", addr: client.addr || "" });
    setEditClient(client);
  };

  const saveNew = () => {
    if (!form.name.trim()) {
      store.toast("Company name is required", "warn");
      return;
    }
    store.createClient(form);
    setShowAdd(false);
  };

  const saveEdit = () => {
    if (!editClient || !form.name.trim()) {
      store.toast("Company name is required", "warn");
      return;
    }
    store.updateClient(editClient.id, form);
    setEditClient(null);
  };

  return (
    <section className="page" data-testid="clients-screen">
      <div className="page-head" data-testid="clients-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="muted">Manage contacts, billing details, and invoice relationships.</p>
        </div>
        <button className="btn violet" onClick={openAdd} data-testid="clients-add-button">
          <Icon name="plus" size={14} />
          Add client
        </button>
      </div>

      <div className="grid grid-3" data-testid="clients-grid">
        {filtered.map((client) => {
          const invoices = store.invoicesByClient(client.id);
          const lifetime = invoices.reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);
          const outstanding = invoices
            .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
            .reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);

          return (
            <article key={client.id} className="card client-card" data-testid={`client-card-${client.id}`}>
              <div className="row between">
                <div className="client-cell">
                  <span className="avatar-dot" style={{ backgroundColor: client.color }} />
                  <div>
                    <div className="semibold">{client.name}</div>
                    <div className="tiny muted">{client.email || "No billing email"}</div>
                  </div>
                </div>
                <div className="row gap-6">
                  <button className="icon-btn" onClick={() => openEdit(client)} data-testid={`client-edit-${client.id}`}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    className="icon-btn danger-txt"
                    onClick={() => setDeleteClient(client)}
                    data-testid={`client-delete-${client.id}`}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>

              <p className="small muted" data-testid={`client-address-${client.id}`}>{client.addr || "No address"}</p>

              <div className="three-stats">
                <div>
                  <span className="tiny muted">Lifetime billed</span>
                  <strong className="mono">{fmtMoney(lifetime)}</strong>
                </div>
                <div>
                  <span className="tiny muted">Outstanding</span>
                  <strong className={`mono ${outstanding > 0 ? "violet" : ""}`}>{fmtMoney(outstanding)}</strong>
                </div>
                <div>
                  <span className="tiny muted">Invoices</span>
                  <strong className="mono">{invoices.length}</strong>
                </div>
              </div>

              <button
                className="btn ghost block"
                onClick={() => onNav("editor", { clientId: client.id })}
                data-testid={`client-new-invoice-${client.id}`}
              >
                New invoice for {client.name}
              </button>
            </article>
          );
        })}
      </div>

      {showAdd && (
        <Modal
          title="Add client"
          desc="Create a billing profile for a new customer."
          onClose={() => setShowAdd(false)}
          testId="add-client-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setShowAdd(false)} data-testid="add-client-cancel-button">
                Cancel
              </button>
              <button className="btn violet" onClick={saveNew} data-testid="add-client-save-button">
                Save client
              </button>
            </>
          }
        >
          <ClientForm form={form} setForm={setForm} baseId="add-client" />
        </Modal>
      )}

      {editClient && (
        <Modal
          title={`Edit ${editClient.name}`}
          desc="Update billing contact details."
          onClose={() => setEditClient(null)}
          testId="edit-client-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setEditClient(null)} data-testid="edit-client-cancel-button">
                Cancel
              </button>
              <button className="btn" onClick={saveEdit} data-testid="edit-client-save-button">
                Save changes
              </button>
            </>
          }
        >
          <ClientForm form={form} setForm={setForm} baseId="edit-client" />
        </Modal>
      )}

      {deleteClient && (
        <Modal
          title={`Delete ${deleteClient.name}?`}
          desc="Attached invoices stay in place but become unlinked."
          onClose={() => setDeleteClient(null)}
          testId="delete-client-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setDeleteClient(null)} data-testid="delete-client-cancel-button">
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  store.deleteClient(deleteClient.id);
                  setDeleteClient(null);
                }}
                data-testid="delete-client-confirm-button"
              >
                Delete client
              </button>
            </>
          }
        >
          <p className="small muted" data-testid="delete-client-modal-copy">
            This cannot be undone and future invoices will no longer be tied to this client.
          </p>
        </Modal>
      )}
    </section>
  );
};

const ClientForm = ({ form, setForm, baseId }) => (
  <div className="stack">
    <label className="field" data-testid={`${baseId}-name-field`}>
      <span className="tiny muted">Company name *</span>
      <input
        className="input"
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        data-testid={`${baseId}-name-input`}
      />
    </label>
    <label className="field" data-testid={`${baseId}-email-field`}>
      <span className="tiny muted">Billing email</span>
      <input
        className="input"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        data-testid={`${baseId}-email-input`}
      />
    </label>
    <label className="field" data-testid={`${baseId}-address-field`}>
      <span className="tiny muted">Address</span>
      <textarea
        className="input textarea"
        rows={3}
        value={form.addr}
        onChange={(event) => setForm((prev) => ({ ...prev, addr: event.target.value }))}
        data-testid={`${baseId}-address-input`}
      />
    </label>
  </div>
);
