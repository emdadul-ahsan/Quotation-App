import React, { useMemo } from "react";
import { useStore, fmtMoney, fmtDateShort, daysBetween } from "../store";
import { Icon, activityColor, activityLabel } from "../ui";

const monthKey = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
  });
};

export const DashboardScreen = ({ onNav, search }) => {
  const store = useStore();

  const invoices = useMemo(() => {
    if (!search.trim()) {
      return store.invoices;
    }
    const query = search.toLowerCase();
    return store.invoices.filter((invoice) => {
      const client = store.getClient(invoice.clientId);
      return [invoice.number, invoice.project, client?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [search, store]);

  const kpis = useMemo(() => {
    const paidAllTime = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);
    const awaiting = invoices
      .filter((invoice) => invoice.status === "pending")
      .reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);
    const overdue = invoices
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);

    const paidThisMonth = invoices
      .filter((invoice) => {
        if (invoice.status !== "paid" || !invoice.paidOn) {
          return false;
        }
        return daysBetween(new Date().toISOString().slice(0, 10), invoice.paidOn) <= 30;
      })
      .reduce((sum, invoice) => sum + store.invoiceTotal(invoice), 0);

    return {
      paidAllTime,
      awaiting,
      paidThisMonth,
      overdue,
    };
  }, [invoices, store]);

  const chart = useMemo(() => {
    const now = new Date();
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const sums = Object.fromEntries(keys.map((k) => [k, 0]));
    invoices.forEach((invoice) => {
      if (invoice.status === "paid" && invoice.paidOn) {
        const key = monthKey(invoice.paidOn);
        if (sums[key] !== undefined) {
          sums[key] += store.invoiceTotal(invoice);
        }
      }
    });

    const max = Math.max(...Object.values(sums), 1);
    return keys.map((key) => ({
      key,
      label: monthLabel(key),
      amount: sums[key],
      ratio: Math.max((sums[key] / max) * 100, 7),
    }));
  }, [invoices, store]);

  const upcoming = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 4),
    [invoices],
  );

  const recentActivity = useMemo(() => {
    const entries = [];
    store.invoices.forEach((invoice) => {
      invoice.activity.forEach((entry) => {
        entries.push({ ...entry, invoiceId: invoice.id, invoiceNumber: invoice.number });
      });
    });
    return entries.sort((a, b) => b.when.localeCompare(a.when)).slice(0, 5);
  }, [store.invoices]);

  return (
    <section className="page" data-testid="dashboard-screen">
      <div className="page-head" data-testid="dashboard-header">
        <div>
          <h1 className="page-title">What needs your attention today</h1>
          <p className="muted">Revenue, collections, and next payment actions in one view.</p>
        </div>
        <div className="row gap-8">
          <button
            className="btn ghost"
            onClick={() => onNav("invoices")}
            data-testid="dashboard-view-all-invoices-button"
          >
            View all invoices
          </button>
          <button
            className="btn violet"
            onClick={() => onNav("editor")}
            data-testid="dashboard-new-invoice-button"
          >
            <Icon name="plus" size={15} />
            New invoice
          </button>
        </div>
      </div>

      <div className="grid grid-4" data-testid="dashboard-kpi-grid">
        <article className="card kpi" data-testid="kpi-total-earned">
          <span className="label">Total earned</span>
          <span className="value mono">{fmtMoney(kpis.paidAllTime)}</span>
          <span className="trend">All-time paid invoices</span>
        </article>
        <article className="card kpi" data-testid="kpi-awaiting-payment">
          <span className="label">Awaiting payment</span>
          <span className="value mono">{fmtMoney(kpis.awaiting)}</span>
          <span className="trend">Pending invoices</span>
        </article>
        <article className="card kpi" data-testid="kpi-paid-this-month">
          <span className="label">Paid this month</span>
          <span className="value mono">{fmtMoney(kpis.paidThisMonth)}</span>
          <span className="trend">Last 30 days</span>
        </article>
        <article className="card kpi" data-testid="kpi-overdue">
          <span className="label">Overdue</span>
          <span className={`value mono ${kpis.overdue > 0 ? "warn" : ""}`}>{fmtMoney(kpis.overdue)}</span>
          <span className="trend">Needs follow-up</span>
        </article>
      </div>

      <div className="grid grid-2" data-testid="dashboard-middle-grid">
        <article className="card" data-testid="cashflow-chart-card">
          <div className="card-head">
            <h2>Cashflow · Last 6 months</h2>
          </div>
          <div className="bars" data-testid="cashflow-bars">
            {chart.map((entry) => (
              <div className="bar-col" key={entry.key} data-testid={`cashflow-bar-${entry.key}`}>
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ height: `${entry.ratio}%` }} />
                </div>
                <span className="tiny muted">{entry.label}</span>
                <span className="tiny mono">{fmtMoney(entry.amount)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card" data-testid="upcoming-payments-card">
          <div className="card-head">
            <h2>Upcoming payments</h2>
          </div>
          <div className="stack">
            {upcoming.length === 0 ? (
              <p className="muted" data-testid="upcoming-empty">
                No pending invoices. You’re clear right now.
              </p>
            ) : (
              upcoming.map((invoice) => {
                const client = store.getClient(invoice.clientId);
                const lateBy = daysBetween(new Date().toISOString().slice(0, 10), invoice.due);
                return (
                  <button
                    key={invoice.id}
                    className="row card-sub"
                    onClick={() => onNav("invoice-detail", { id: invoice.id })}
                    data-testid={`upcoming-invoice-${invoice.id}`}
                  >
                    <div>
                      <div className="semibold">{invoice.number}</div>
                      <div className="tiny muted">{client?.name || "Unlinked client"}</div>
                    </div>
                    <div className="row gap-12">
                      <span className="mono">{fmtMoney(store.invoiceTotal(invoice))}</span>
                      <span className={`tiny ${lateBy > 0 ? "warn" : "muted"}`}>
                        {lateBy > 0 ? `${lateBy}d overdue` : `due ${fmtDateShort(invoice.due)}`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </article>
      </div>

      <article className="card" data-testid="recent-activity-card">
        <div className="card-head">
          <h2>Recent activity</h2>
        </div>
        <div className="timeline" data-testid="recent-activity-list">
          {recentActivity.map((entry) => (
            <button
              className="tl-item"
              key={entry.id}
              onClick={() => onNav("invoice-detail", { id: entry.invoiceId })}
              data-testid={`recent-activity-${entry.id}`}
            >
              <span className="tl-dot" style={{ backgroundColor: activityColor(entry.type) }} />
              <div className="tl-content">
                <div className="semibold">{entry.invoiceNumber}</div>
                <div className="tiny muted">{activityLabel(entry)}</div>
              </div>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
};
