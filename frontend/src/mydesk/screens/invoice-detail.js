import React, { useState } from "react";
import { fmtDate, fmtMoney, useStore, daysBetween } from "../store";
import {
  ClientCell,
  Icon,
  Modal,
  StatusPill,
  activityColor,
  activityLabel,
  downloadInvoice,
} from "../ui";

const activityTypeLabel = {
  created: "Created",
  sent: "Sent",
  opened: "Opened",
  reminder: "Reminder",
  paid: "Paid",
};

export const InvoiceDetailScreen = ({ id, onNav }) => {
  const store = useStore();
  const invoice = store.getInvoice(id);
  const client = invoice ? store.getClient(invoice.clientId) : null;
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [paymentRef, setPaymentRef] = useState("");

  const clientStats = (() => {
    if (!client) {
      return { total: 0, count: 0 };
    }
    const all = store.invoicesByClient(client.id);
    return {
      total: all.reduce((sum, inv) => sum + store.invoiceTotal(inv), 0),
      count: all.length,
    };
  })();

  if (!invoice) {
    return (
      <section className="page" data-testid="invoice-detail-not-found">
        <div className="empty">
          <h2>Invoice not found</h2>
          <button className="btn ghost" onClick={() => onNav("invoices")} data-testid="invoice-detail-back-button">
            Back to invoices
          </button>
        </div>
      </section>
    );
  }

  const total = store.invoiceTotal(invoice);
  const overdueDays = daysBetween(new Date().toISOString().slice(0, 10), invoice.due);
  const openedActivity = [...invoice.activity].reverse().find((entry) => entry.type === "opened");

  return (
    <section className="page" data-testid="invoice-detail-screen">
      <div className="page-head" data-testid="invoice-detail-header">
        <div>
          <h1 className="page-title">{invoice.number}</h1>
          <p className="muted">Issued {fmtDate(invoice.issued)} · Due {fmtDate(invoice.due)}</p>
        </div>
        <div className="row gap-8">
          <button
            className="btn ghost"
            onClick={() => downloadInvoice(invoice, client, store.business, store.invoiceTotal)}
            data-testid="invoice-detail-download-button"
          >
            <Icon name="download" size={15} />
            Download PDF
          </button>
          {invoice.status !== "paid" && (
            <button className="btn ok" onClick={() => setShowPaidModal(true)} data-testid="invoice-detail-mark-paid-button">
              <Icon name="check" size={15} />
              Mark paid
            </button>
          )}
          <button className="btn danger" onClick={() => setShowDeleteModal(true)} data-testid="invoice-detail-delete-button">
            Delete
          </button>
        </div>
      </div>

      {invoice.status === "paid" && (
        <div className="banner ok" data-testid="invoice-detail-paid-banner">
          <div className="row gap-8">
            <Icon name="check" size={15} />
            <strong>{fmtMoney(total)} paid</strong>
          </div>
          <span>{invoice.paidOn ? fmtDate(invoice.paidOn) : ""}</span>
          <span>{invoice.method || "Bank transfer"}</span>
          {invoice.ref && <span className="mono">{invoice.ref}</span>}
        </div>
      )}

      {invoice.status === "overdue" && (
        <div className="banner warn" data-testid="invoice-detail-overdue-banner">
          <strong>Overdue by {overdueDays} days</strong>
          <span>Due {fmtDate(invoice.due)}</span>
          {openedActivity && <span>Opened {fmtDate(openedActivity.when)}</span>}
        </div>
      )}

      <div className="grid detail-grid" data-testid="invoice-detail-main-grid">
        <article className="card inv-paper" data-testid="invoice-paper">
          {invoice.status === "paid" && <span className="paid-stamp">PAID</span>}
          {invoice.status === "overdue" && <span className="overdue-stamp">OVERDUE</span>}

          <div className="inv-head">
            <div>
              <h2>Invoice</h2>
              <p className="muted mono">{invoice.number}</p>
            </div>
            <div className="align-right">
              {store.business.logo ? (
                <img src={store.business.logo} alt="Business logo" className="logo-preview" data-testid="invoice-paper-logo" />
              ) : (
                <div className="semibold">{store.business.name}</div>
              )}
              <p className="tiny muted">{store.business.email}</p>
            </div>
          </div>

          <div className="inv-party-grid">
            <div>
              <div className="tiny muted">Bill from</div>
              <div className="semibold">{store.business.name}</div>
              <div className="small muted">{store.business.addr}</div>
            </div>
            <div>
              <div className="tiny muted">Bill to</div>
              <div className="semibold">{client?.name || "Unlinked client"}</div>
              <div className="small muted">{client?.addr || "No address"}</div>
            </div>
          </div>

          <table className="table compact" data-testid="invoice-paper-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} data-testid={`invoice-paper-item-${item.id}`}>
                  <td>{item.desc}</td>
                  <td>{item.qty}</td>
                  <td>{fmtMoney(item.rate)}</td>
                  <td>{fmtMoney(Number(item.qty) * Number(item.rate))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals" data-testid="invoice-paper-totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span className="mono">{fmtMoney(total)}</span>
            </div>
            <div className="totals-row">
              <span>Tax</span>
              <span className="mono">{fmtMoney(0)}</span>
            </div>
            <div className="totals-row strong">
              <span>Total</span>
              <span className="mono">{fmtMoney(total)}</span>
            </div>
          </div>

          <p className="small muted" data-testid="invoice-paper-notes">
            {invoice.notes || "Thank you for your business."}
          </p>
        </article>

        <aside className="stack" data-testid="invoice-detail-sidebar">
          <article className="card" data-testid="invoice-detail-timeline-card">
            <h3>Timeline</h3>
            <div className="timeline">
              {[...invoice.activity]
                .reverse()
                .map((entry) => (
                  <div className="tl-item" key={entry.id} data-testid={`invoice-activity-${entry.id}`}>
                    <span className="tl-dot" style={{ backgroundColor: activityColor(entry.type) }} />
                    <div className="tl-content">
                      <div className="semibold">{activityTypeLabel[entry.type] || entry.type}</div>
                      <div className="tiny muted">{activityLabel(entry)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </article>

          <article className="card" data-testid="invoice-detail-client-card">
            <h3>Client</h3>
            <ClientCell client={client} testId="invoice-detail-client-cell" />
            <div className="stat-grid">
              <div>
                <div className="tiny muted">Lifetime billed</div>
                <div className="mono semibold">{fmtMoney(clientStats.total)}</div>
              </div>
              <div>
                <div className="tiny muted">Invoice count</div>
                <div className="mono semibold">{clientStats.count}</div>
              </div>
            </div>
            <StatusPill status={invoice.status} testId="invoice-detail-status-pill" />
          </article>
        </aside>
      </div>

      {showPaidModal && (
        <Modal
          title="Mark invoice paid"
          desc="Capture payment details for your audit trail."
          onClose={() => setShowPaidModal(false)}
          testId="mark-paid-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setShowPaidModal(false)} data-testid="mark-paid-cancel-button">
                Cancel
              </button>
              <button
                className="btn ok"
                onClick={() => {
                  store.markPaid(invoice.id, { method: paymentMethod, ref: paymentRef });
                  setShowPaidModal(false);
                }}
                data-testid="mark-paid-confirm-button"
              >
                Confirm payment
              </button>
            </>
          }
        >
          <div className="stack">
            <label className="field" data-testid="mark-paid-method-field">
              <span className="tiny muted">Payment method</span>
              <select
                className="input"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                data-testid="mark-paid-method-select"
              >
                <option>Bank transfer</option>
                <option>Stripe · •• 4242</option>
                <option>Wise</option>
                <option>PayPal</option>
              </select>
            </label>
            <label className="field" data-testid="mark-paid-ref-field">
              <span className="tiny muted">Reference</span>
              <input
                className="input"
                value={paymentRef}
                onChange={(event) => setPaymentRef(event.target.value)}
                placeholder="ex: ch_3PqRf2hzL"
                data-testid="mark-paid-reference-input"
              />
            </label>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title={`Delete ${invoice.number}?`}
          desc="This removes the invoice from your workspace."
          onClose={() => setShowDeleteModal(false)}
          testId="invoice-detail-delete-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setShowDeleteModal(false)} data-testid="invoice-detail-delete-cancel">
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  store.deleteInvoice(invoice.id);
                  setShowDeleteModal(false);
                  onNav("invoices");
                }}
                data-testid="invoice-detail-delete-confirm"
              >
                Delete invoice
              </button>
            </>
          }
        >
          <p className="small muted" data-testid="invoice-detail-delete-warning">
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </section>
  );
};
