import React, { useMemo } from "react";
import { fmtDateShort, fmtMoney, useStore } from "../store";
import { Icon, StatusPill } from "../ui";

export const ProjectsScreen = ({ onNav, search }) => {
  const store = useStore();
  const projects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return store.projects;
    }
    return store.projects.filter((project) => {
      const client = store.getClient(project.clientId);
      return [project.name, client?.name].filter(Boolean).some((value) => value.toLowerCase().includes(query));
    });
  }, [search, store]);

  return (
    <section className="page" data-testid="projects-screen">
      <div className="page-head" data-testid="projects-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="muted">Milestones, earned amount, and linked invoices.</p>
        </div>
      </div>

      <div className="grid grid-3" data-testid="projects-grid">
        {projects.map((project) => {
          const client = store.getClient(project.clientId);
          const progress = store.projectProgress(project);
          const amounts = store.projectAmounts(project);
          return (
            <button
              key={project.id}
              className="card project-card"
              onClick={() => onNav("project-detail", { id: project.id })}
              data-testid={`project-card-${project.id}`}
            >
              <div className="row between">
                <div className="client-cell">
                  <span className="avatar-dot" style={{ backgroundColor: client?.color || "#5e6ad2" }} />
                  <div>
                    <div className="semibold">{project.name}</div>
                    <div className="tiny muted">{client?.name || "Unlinked client"}</div>
                  </div>
                </div>
                <span className="pill draft" data-testid={`project-progress-pill-${project.id}`}>
                  {progress.done}/{progress.total}
                </span>
              </div>

              <div className="progress" data-testid={`project-progress-bar-${project.id}`}>
                <span className="bar" style={{ width: `${progress.pct}%` }} />
              </div>

              <div className="three-stats" data-testid={`project-amounts-${project.id}`}>
                <div>
                  <span className="tiny muted">Paid</span>
                  <strong className="mono">{fmtMoney(amounts.paid)}</strong>
                </div>
                <div>
                  <span className="tiny muted">Remaining</span>
                  <strong className="mono">{fmtMoney(amounts.remaining)}</strong>
                </div>
                <div>
                  <span className="tiny muted">Total</span>
                  <strong className="mono">{fmtMoney(amounts.total)}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export const ProjectDetailScreen = ({ id, onNav }) => {
  const store = useStore();
  const project = store.getProject(id);

  if (!project) {
    return (
      <section className="page" data-testid="project-detail-not-found">
        <div className="empty">
          <h2>Project not found</h2>
          <button className="btn ghost" onClick={() => onNav("projects")} data-testid="project-detail-back-button">
            Back to projects
          </button>
        </div>
      </section>
    );
  }

  const client = store.getClient(project.clientId);
  const progress = store.projectProgress(project);
  const amounts = store.projectAmounts(project);
  const linkedInvoices = project.milestones
    .filter((milestone) => milestone.invoiceId)
    .map((milestone) => ({ milestone, invoice: store.getInvoice(milestone.invoiceId) }))
    .filter((item) => item.invoice);

  return (
    <section className="page" data-testid="project-detail-screen">
      <div className="page-head" data-testid="project-detail-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="muted">{client?.name || "Unlinked client"}</p>
        </div>
        <button className="btn ghost" onClick={() => onNav("projects")} data-testid="project-detail-back-list-button">
          <Icon name="back" size={14} />
          All projects
        </button>
      </div>

      <div className="grid detail-grid" data-testid="project-detail-main-grid">
        <div className="stack">
          <article className="card" data-testid="project-progress-card">
            <h2>Progress</h2>
            <div className="row between">
              <strong className="mono">{progress.pct}% complete</strong>
              <span className="tiny muted">{progress.done}/{progress.total} milestones</span>
            </div>
            <div className="progress" data-testid="project-detail-progress-bar">
              <span className="bar" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="row between">
              <span className="ok">Earned {fmtMoney(amounts.paid)}</span>
              <span className="muted">Remaining {fmtMoney(amounts.remaining)}</span>
            </div>
          </article>

          <article className="card" data-testid="project-milestones-card">
            <h2>Milestones</h2>
            <div className="stack">
              {project.milestones.map((milestone, idx) => {
                const linked = milestone.invoiceId ? store.getInvoice(milestone.invoiceId) : null;
                return (
                  <div className="milestone-row" key={milestone.id} data-testid={`milestone-row-${milestone.id}`}>
                    <button
                      className={`checkbox ${milestone.status === "done" ? "on" : ""}`}
                      onClick={() => store.toggleMilestone(project.id, milestone.id)}
                      data-testid={`milestone-toggle-${milestone.id}`}
                    >
                      {milestone.status === "done" && <Icon name="check" size={13} />}
                    </button>

                    <div className="milestone-main">
                      <div className="semibold">M{idx + 1} · {milestone.title}</div>
                      <div className="tiny muted">Due {fmtDateShort(milestone.due)}</div>
                    </div>

                    <div className="milestone-actions">
                      <span className="mono">{fmtMoney(milestone.amount)}</span>

                      {linked ? (
                        <button
                          className="btn ghost small"
                          onClick={() => onNav("invoice-detail", { id: linked.id })}
                          data-testid={`milestone-linked-invoice-${milestone.id}`}
                        >
                          <StatusPill status={linked.status} testId={`milestone-status-${milestone.id}`} />
                        </button>
                      ) : milestone.status === "done" ? (
                        <button
                          className="btn small"
                          onClick={() => {
                            const created = store.invoiceMilestone(project.id, milestone.id);
                            if (created) {
                              onNav("invoice-detail", { id: created.id });
                            }
                          }}
                          data-testid={`milestone-send-invoice-${milestone.id}`}
                        >
                          Send invoice
                        </button>
                      ) : (
                        <button
                          className="btn ghost small"
                          onClick={() => store.toggleMilestone(project.id, milestone.id)}
                          data-testid={`milestone-mark-done-${milestone.id}`}
                        >
                          Mark done
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <aside className="stack" data-testid="project-detail-sidebar">
          <article className="card" data-testid="project-summary-card">
            <h3>Summary</h3>
            <div className="stack tiny">
              <div className="row between"><span>Total contract</span><strong className="mono">{fmtMoney(amounts.total)}</strong></div>
              <div className="row between"><span>Paid</span><strong className="mono ok">{fmtMoney(amounts.paid)}</strong></div>
              <div className="row between"><span>Remaining</span><strong className="mono">{fmtMoney(amounts.remaining)}</strong></div>
              <div className="row between"><span>Client</span><strong>{client?.name || "Unlinked"}</strong></div>
              <div className="row between"><span>Milestones</span><strong>{project.milestones.length}</strong></div>
            </div>
          </article>

          <article className="card" data-testid="project-linked-invoices-card">
            <h3>Linked invoices</h3>
            <div className="stack">
              {linkedInvoices.length === 0 ? (
                <p className="tiny muted" data-testid="project-linked-empty">No invoices yet</p>
              ) : (
                linkedInvoices.map(({ milestone, invoice }) => (
                  <button
                    className="row between card-sub"
                    key={milestone.id}
                    onClick={() => onNav("invoice-detail", { id: invoice.id })}
                    data-testid={`project-linked-invoice-${invoice.id}`}
                  >
                    <div>
                      <div className="semibold">{invoice.number}</div>
                      <div className="tiny muted">{milestone.title}</div>
                    </div>
                    <StatusPill status={invoice.status} testId={`project-linked-status-${invoice.id}`} />
                  </button>
                ))
              )}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
};
