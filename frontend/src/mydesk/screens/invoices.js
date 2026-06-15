import React, { useMemo, useState } from "react";
import { fmtDateShort, fmtMoney, useStore, daysBetween } from "../store";
import { ClientCell, Icon, Modal, StatusPill, downloadInvoice } from "../ui";

export const InvoicesScreen = ({ onNav, search }) => {
  const store = useStore();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [rowMenu, setRowMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const counts = useMemo(() => {
    const base = { all: store.invoices.length, draft: 0, pending: 0, overdue: 0, paid: 0 };
    store.invoices.forEach((invoice) => {
      base[invoice.status] += 1;
    });
    return base;
  }, [store.invoices]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = store.invoices.filter((invoice) => {
      if (tab !== "all" && invoice.status !== tab) {
        return false;
      }
      if (!query) {
        return true;
      }
      const client = store.getClient(invoice.clientId);
      return [invoice.number, invoice.project, client?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });

    if (sort === "due") {
      list.sort((a, b) => a.due.localeCompare(b.due));
    } else if (sort === "amount") {
      list.sort((a, b) => store.invoiceTotal(b) - store.invoiceTotal(a));
    } else {
      list.sort((a, b) => b.issued.localeCompare(a.issued));
    }
    return list;
  }, [search, sort, store, tab]);

  return (
    <section className="page" data-testid="invoices-screen">
      <div className="page-head" data-testid="invoices-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="muted">Track every bill from draft to paid.</p>
        </div>
        <button className="btn violet" onClick={() => onNav("editor")} data-testid="invoices-new-button">
          <Icon name="plus" size={15} />
          New invoice
        </button>
      </div>

      <div className="card flush" data-testid="invoices-table-card">
        <div className="table-toolbar" data-testid="invoices-toolbar">
          <div className="tabs" data-testid="invoices-filter-tabs">
            {[
              { id: "all", label: "All" },
              { id: "draft", label: "Drafts" },
              { id: "pending", label: "Pending" },
              { id: "overdue", label: "Overdue" },
              { id: "paid", label: "Paid" },
            ].map((entry) => (
              <button
                key={entry.id}
                className={`tab ${tab === entry.id ? "active" : ""}`}
                onClick={() => setTab(entry.id)}
                data-testid={`invoice-filter-${entry.id}`}
              >
                {entry.label}
                <span className="tab-count mono">{counts[entry.id]}</span>
              </button>
            ))}
          </div>
          <label className="row gap-8">
            <span className="tiny muted">Sort</span>
            <select
              className="input small-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              data-testid="invoices-sort-select"
            >
              <option value="newest">Newest</option>
              <option value="due">Due date</option>
              <option value="amount">Amount</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty" data-testid="invoices-empty-state">
            <Icon name="receipt" size={26} />
            <h3>No invoices match</h3>
            <p className="muted">Try another filter or clear your search.</p>
          </div>
        ) : (
          <table className="table" data-testid="invoices-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client / Project</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const client = store.getClient(invoice.clientId);
                const overdueDays = daysBetween(new Date().toISOString().slice(0, 10), invoice.due);

                return (
                  <tr key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                    <td className="mono">{invoice.number}</td>
                    <td>
                      <ClientCell
                        client={client}
                        subtitle={invoice.project}
                        testId={`invoice-row-client-${invoice.id}`}
                      />
                    </td>
                    <td>{fmtDateShort(invoice.issued)}</td>
                    <td>
                      <div className="col gap-2">
                        <span className={invoice.status === "overdue" ? "warn" : ""}>{fmtDateShort(invoice.due)}</span>
                        {overdueDays > 0 && invoice.status !== "paid" && (
                          <span className="tiny warn">{overdueDays}d ago</span>
                        )}
                      </div>
                    </td>
                    <td className="mono">{fmtMoney(store.invoiceTotal(invoice))}</td>
                    <td>
                      <StatusPill status={invoice.status} testId={`invoice-status-${invoice.id}`} />
                    </td>
                    <td>
                      <div className="row-end menu-anchor">
                        <button
                          className="icon-btn"
                          onClick={() => setRowMenu(rowMenu === invoice.id ? null : invoice.id)}
                          data-testid={`invoice-row-menu-button-${invoice.id}`}
                        >
                          <Icon name="more" size={15} />
                        </button>

                        {rowMenu === invoice.id && (
                          <div className="row-menu" data-testid={`invoice-row-menu-${invoice.id}`}>
                            <button
                              onClick={() => {
                                setRowMenu(null);
                                onNav("invoice-detail", { id: invoice.id });
                              }}
                              data-testid={`invoice-row-view-${invoice.id}`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setRowMenu(null);
                                onNav("editor", { id: invoice.id });
                              }}
                              data-testid={`invoice-row-edit-${invoice.id}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setRowMenu(null);
                                downloadInvoice(invoice, client, store.business, store.invoiceTotal);
                              }}
                              data-testid={`invoice-row-download-${invoice.id}`}
                            >
                              Download PDF
                            </button>
                            <button
                              className="danger-txt"
                              onClick={() => {
                                setRowMenu(null);
                                setConfirmDelete(invoice);
                              }}
                              data-testid={`invoice-row-delete-${invoice.id}`}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <Modal
          title={`Delete ${confirmDelete.number}?`}
          desc="This invoice will be removed permanently."
          onClose={() => setConfirmDelete(null)}
          testId="delete-invoice-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirmDelete(null)} data-testid="delete-invoice-cancel-button">
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  store.deleteInvoice(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                data-testid="delete-invoice-confirm-button"
              >
                Delete invoice
              </button>
            </>
          }
        >
          <p className="small muted" data-testid="delete-invoice-modal-copy">
            Action cannot be undone.
          </p>
        </Modal>
      )}
    </section>
  );
};
