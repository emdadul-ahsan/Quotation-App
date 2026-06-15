import React, { useMemo, useState } from "react";
import {
  addMonthsIso,
  daysBetween,
  fmtDate,
  fmtDateShort,
  fmtMoney,
  useStore,
} from "../store";
import { Icon, Modal, StatusPill } from "../ui";

export const RecurringScreen = ({ onNav, search }) => {
  const store = useStore();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [setupModal, setSetupModal] = useState(false);
  const [statusOnGenerate, setStatusOnGenerate] = useState("draft");
  const [dueOffset, setDueOffset] = useState(14);
  const [nextRunAt, setNextRunAt] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const candidateInvoices = useMemo(
    () =>
      store.invoices
        .filter((invoice) => !invoice.recurringTemplateId)
        .sort((a, b) => b.issued.localeCompare(a.issued)),
    [store.invoices],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return store.recurringTemplates || [];
    }
    return (store.recurringTemplates || []).filter((template) => {
      const client = store.getClient(template.clientId);
      return [template.project, template.sourceNumber, client?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [search, store]);

  const recentGenerated = useMemo(
    () =>
      store.invoices
        .filter((invoice) => invoice.recurringTemplateId)
        .sort((a, b) => b.issued.localeCompare(a.issued))
        .slice(0, 8),
    [store.invoices],
  );

  const onPickInvoice = (invoiceId) => {
    const source = store.getInvoice(invoiceId);
    if (!source) {
      return;
    }
    setSelectedInvoiceId(invoiceId);
    setStatusOnGenerate("draft");
    setDueOffset(Math.max(daysBetween(source.due, source.issued), 1));
    setNextRunAt(addMonthsIso(source.issued, 1));
    setSetupModal(true);
  };

  const createTemplate = () => {
    const template = store.createRecurringTemplate(selectedInvoiceId, {
      statusOnGenerate,
      dueOffsetDays: Number(dueOffset),
      nextRunAt,
      startDate: store.getInvoice(selectedInvoiceId)?.issued || new Date().toISOString().slice(0, 10),
    });
    if (template) {
      setSetupModal(false);
      setSelectedInvoiceId("");
    }
  };

  return (
    <section className="page" data-testid="recurring-screen">
      <div className="page-head" data-testid="recurring-header">
        <div>
          <h1 className="page-title">Recurring invoices</h1>
          <p className="muted">Monthly recurring billing templates and quick generation.</p>
        </div>
        <button
          className="btn ghost"
          onClick={() => onNav("invoices")}
          data-testid="recurring-back-invoices-button"
        >
          <Icon name="back" size={14} />
          Back to invoices
        </button>
      </div>

      <div className="grid recurring-grid" data-testid="recurring-grid-layout">
        <article className="card" data-testid="recurring-create-card">
          <h2>Create monthly recurring template</h2>
          <p className="small muted">Pick any existing invoice as the base blueprint.</p>

          <label className="field" data-testid="recurring-source-field">
            <span className="tiny muted">Source invoice</span>
            <select
              className="input"
              value={selectedInvoiceId}
              onChange={(event) => setSelectedInvoiceId(event.target.value)}
              data-testid="recurring-source-select"
            >
              <option value="">Choose invoice</option>
              {candidateInvoices.map((invoice) => {
                const client = store.getClient(invoice.clientId);
                return (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number} · {client?.name || "Unlinked"} · {invoice.project}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="row gap-8">
            <button
              className="btn violet"
              disabled={!selectedInvoiceId}
              onClick={() => onPickInvoice(selectedInvoiceId)}
              data-testid="recurring-setup-button"
            >
              Setup monthly recurring
            </button>
            <span className="tiny muted" data-testid="recurring-candidate-count">
              {candidateInvoices.length} eligible invoices
            </span>
          </div>
        </article>

        <article className="card" data-testid="recurring-templates-card">
          <div className="row between">
            <h2>Active templates</h2>
            <span className="tiny muted" data-testid="recurring-template-count">
              {(store.recurringTemplates || []).length} total
            </span>
          </div>

          <div className="stack">
            {filteredTemplates.length === 0 ? (
              <p className="small muted" data-testid="recurring-empty-state">
                No recurring templates yet.
              </p>
            ) : (
              filteredTemplates.map((template) => {
                const client = store.getClient(template.clientId);
                return (
                  <div className="recurring-item" key={template.id} data-testid={`recurring-template-${template.id}`}>
                    <div>
                      <div className="semibold">{template.project || "Recurring invoice"}</div>
                      <div className="tiny muted">
                        {client?.name || "Unlinked client"} · Next run {fmtDateShort(template.nextRunAt)}
                      </div>
                      <div className="tiny muted">
                        Source {template.sourceNumber} · Monthly · {template.statusOnGenerate} on generate
                      </div>
                    </div>
                    <div className="recurring-item-actions">
                      <button
                        className="btn small"
                        onClick={() => {
                          const generated = store.runRecurringNow(template.id);
                          if (generated) {
                            onNav("invoice-detail", { id: generated.id });
                          }
                        }}
                        data-testid={`recurring-run-now-${template.id}`}
                      >
                        Generate now
                      </button>

                      <button
                        className="btn ghost small"
                        onClick={() => store.toggleRecurringTemplate(template.id)}
                        data-testid={`recurring-toggle-${template.id}`}
                      >
                        {template.active ? "Pause" : "Resume"}
                      </button>

                      <button
                        className="btn ghost small"
                        onClick={() => setSelectedTemplate(template)}
                        data-testid={`recurring-edit-${template.id}`}
                      >
                        Edit
                      </button>

                      <button
                        className="btn danger small"
                        onClick={() => store.deleteRecurringTemplate(template.id)}
                        data-testid={`recurring-delete-${template.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>

      <article className="card" data-testid="recurring-generated-history-card">
        <h2>Recent generated recurring invoices</h2>
        {recentGenerated.length === 0 ? (
          <p className="small muted" data-testid="recurring-generated-empty">
            Generated recurring invoices will appear here.
          </p>
        ) : (
          <table className="table" data-testid="recurring-generated-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client / Project</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentGenerated.map((invoice) => {
                const client = store.getClient(invoice.clientId);
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => onNav("invoice-detail", { id: invoice.id })}
                    className="click-row"
                    data-testid={`recurring-generated-row-${invoice.id}`}
                  >
                    <td className="mono">{invoice.number}</td>
                    <td>{client?.name || "Unlinked"} · {invoice.project}</td>
                    <td>{fmtDate(invoice.issued)}</td>
                    <td>{fmtDate(invoice.due)}</td>
                    <td className="mono">{fmtMoney(store.invoiceTotal(invoice))}</td>
                    <td><StatusPill status={invoice.status} testId={`recurring-generated-status-${invoice.id}`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </article>

      {setupModal && (
        <Modal
          title="Recurring template setup"
          desc="Monthly recurrence with configurable due offset and generated status."
          onClose={() => setSetupModal(false)}
          testId="recurring-setup-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setSetupModal(false)} data-testid="recurring-setup-cancel">
                Cancel
              </button>
              <button className="btn violet" onClick={createTemplate} data-testid="recurring-setup-confirm">
                Create template
              </button>
            </>
          }
        >
          <div className="stack">
            <label className="field" data-testid="recurring-next-run-field">
              <span className="tiny muted">First run date</span>
              <input
                className="input"
                type="date"
                value={nextRunAt}
                onChange={(event) => setNextRunAt(event.target.value)}
                data-testid="recurring-next-run-input"
              />
            </label>

            <label className="field" data-testid="recurring-due-offset-field">
              <span className="tiny muted">Due offset (days from issued)</span>
              <input
                className="input"
                type="number"
                min="1"
                value={dueOffset}
                onChange={(event) => setDueOffset(Number(event.target.value || 1))}
                data-testid="recurring-due-offset-input"
              />
            </label>

            <label className="field" data-testid="recurring-status-field">
              <span className="tiny muted">Generated invoice status</span>
              <select
                className="input"
                value={statusOnGenerate}
                onChange={(event) => setStatusOnGenerate(event.target.value)}
                data-testid="recurring-status-select"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending (auto-sent)</option>
              </select>
            </label>
          </div>
        </Modal>
      )}

      {selectedTemplate && (
        <EditRecurringModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSave={(patch) => {
            store.updateRecurringTemplate(selectedTemplate.id, patch);
            setSelectedTemplate(null);
          }}
        />
      )}
    </section>
  );
};

const EditRecurringModal = ({ template, onClose, onSave }) => {
  const [nextRunAt, setNextRunAt] = useState(template.nextRunAt || new Date().toISOString().slice(0, 10));
  const [dueOffsetDays, setDueOffsetDays] = useState(Number(template.dueOffsetDays || 14));
  const [statusOnGenerate, setStatusOnGenerate] = useState(template.statusOnGenerate || "draft");

  return (
    <Modal
      title="Edit recurring template"
      desc="Adjust next run date and invoice behavior."
      onClose={onClose}
      testId="recurring-edit-modal"
      footer={
        <>
          <button className="btn ghost" onClick={onClose} data-testid="recurring-edit-cancel">
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => onSave({ nextRunAt, dueOffsetDays, statusOnGenerate })}
            data-testid="recurring-edit-save"
          >
            Save changes
          </button>
        </>
      }
    >
      <div className="stack">
        <label className="field" data-testid="recurring-edit-next-run-field">
          <span className="tiny muted">Next run</span>
          <input
            className="input"
            type="date"
            value={nextRunAt}
            onChange={(event) => setNextRunAt(event.target.value)}
            data-testid="recurring-edit-next-run-input"
          />
        </label>

        <label className="field" data-testid="recurring-edit-due-offset-field">
          <span className="tiny muted">Due offset days</span>
          <input
            className="input"
            type="number"
            min="1"
            value={dueOffsetDays}
            onChange={(event) => setDueOffsetDays(Number(event.target.value || 1))}
            data-testid="recurring-edit-due-offset-input"
          />
        </label>

        <label className="field" data-testid="recurring-edit-status-field">
          <span className="tiny muted">Generated status</span>
          <select
            className="input"
            value={statusOnGenerate}
            onChange={(event) => setStatusOnGenerate(event.target.value)}
            data-testid="recurring-edit-status-select"
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending (auto-sent)</option>
          </select>
        </label>
      </div>
    </Modal>
  );
};
