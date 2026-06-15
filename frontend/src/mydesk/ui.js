import React, { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  ChevronsUpDown,
  Circle,
  Copy,
  Download,
  Eye,
  FileText,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  fmtDate,
  fmtDateShort,
  fmtMoney,
  useStore,
  daysBetween,
} from "./store";

const iconMap = {
  dashboard: Gauge,
  invoice: FileText,
  project: Wallet,
  client: Users,
  settings: Settings,
  plus: Plus,
  search: Search,
  arrow: ArrowLeft,
  chevron: ChevronsUpDown,
  chevronDown: ChevronsUpDown,
  back: ArrowLeft,
  check: Check,
  download: Download,
  send: Send,
  bell: Bell,
  copy: Copy,
  trash: Trash2,
  dollar: Wallet,
  dot: Circle,
  sparkle: Sparkles,
  calendar: Calendar,
  filter: ChevronsUpDown,
  more: MoreHorizontal,
  close: X,
  eye: Eye,
  clock: Calendar,
  edit: Pencil,
  receipt: Receipt,
};

export const Icon = ({ name, size = 16, className = "" }) => {
  const Comp = iconMap[name] || Circle;
  return <Comp size={size} className={className} />;
};

export const StatusPill = ({ status, testId }) => {
  const normalized = status || "draft";
  const labels = {
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    draft: "Draft",
    partial: "Partial",
    sent: "Sent",
  };
  return (
    <span className={`pill ${normalized}`} data-testid={testId || `status-pill-${normalized}`}>
      {labels[normalized] || normalized}
    </span>
  );
};

export const ClientCell = ({ client, subtitle, testId }) => (
  <div className="client-cell" data-testid={testId || "client-cell"}>
    <span className="avatar-dot" style={{ backgroundColor: client?.color || "#5e6ad2" }} />
    <div className="client-meta">
      <div className="semibold">{client?.name || "Unlinked client"}</div>
      <div className="muted tiny">{subtitle || client?.email || "No billing email"}</div>
    </div>
  </div>
);

export const Sidebar = ({ route, onNav, counts }) => {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "invoices", label: "Invoices", icon: "invoice", count: counts?.invoices },
    { id: "projects", label: "Projects", icon: "project", count: counts?.projects },
    { id: "clients", label: "Clients", icon: "client", count: counts?.clients },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className="sidebar" data-testid="sidebar-nav">
      <div className="sidebar-top">
        <button
          className="btn violet block"
          onClick={() => onNav("editor")}
          data-testid="sidebar-new-invoice-button"
        >
          <Icon name="plus" size={15} />
          New invoice
        </button>
      </div>

      <nav className="sidebar-links" data-testid="sidebar-links-list">
        {items.map((item) => {
          const active = route === item.id;
          return (
            <button
              key={item.id}
              className={`side-link ${active ? "active" : ""}`}
              onClick={() => onNav(item.id)}
              data-testid={`sidebar-link-${item.id}`}
            >
              <span className="side-link-main">
                <Icon name={item.icon} size={16} />
                {item.label}
              </span>
              {typeof item.count === "number" && <span className="side-count mono">{item.count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-user" data-testid="sidebar-user-card">
        <div className="avatar-dot" />
        <div>
          <div className="semibold">Jane Doe</div>
          <div className="tiny muted">Freelancer account</div>
        </div>
      </div>
    </aside>
  );
};

export const Topbar = ({ crumbs, search, onSearch }) => (
  <header className="topbar" data-testid="topbar-header">
    <div className="breadcrumbs" data-testid="topbar-breadcrumbs">
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.label}>
          {idx > 0 && <span className="crumb-sep">/</span>}
          <button
            className={`crumb ${crumb.clickable ? "link" : ""}`}
            onClick={crumb.onClick}
            disabled={!crumb.clickable}
            data-testid={`breadcrumb-${crumb.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>

    <div className="top-actions" data-testid="topbar-actions">
      <label className="search-wrap" data-testid="global-search-wrapper">
        <Icon name="search" size={14} className="muted" />
        <input
          className="input search-input"
          placeholder="Search invoices, clients, projects"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          data-testid="global-search-input"
        />
        <span className="kbd">⌘K</span>
      </label>
      <button className="icon-btn" data-testid="topbar-notification-button">
        <Icon name="bell" size={16} />
      </button>
    </div>
  </header>
);

export const Modal = ({ title, desc, children, onClose, footer, testId }) => {
  const ref = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} data-testid={testId || "modal-overlay"}>
      <div
        className="modal"
        ref={ref}
        onClick={(event) => event.stopPropagation()}
        data-testid="modal-content"
      >
        <div className="modal-head">
          <div>
            <h3 className="modal-title" data-testid="modal-title">
              {title}
            </h3>
            {desc && (
              <p className="muted small" data-testid="modal-description">
                {desc}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} data-testid="modal-close-button">
            <Icon name="close" size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const ToastLayer = () => {
  const store = useStore();
  return (
    <div className="toast-wrap" data-testid="toast-container">
      {store.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.variant || "info"}`}
          data-testid={`toast-${toast.variant || "info"}`}
        >
          <span className="toast-dot" />
          <span>{toast.msg}</span>
        </div>
      ))}
    </div>
  );
};

export const daysLabel = (due) => {
  const diff = daysBetween(new Date().toISOString().slice(0, 10), due);
  if (diff <= 0) {
    return `${Math.abs(diff)}d left`;
  }
  return `${diff}d ago`;
};

const stamp = (status) => {
  if (status === "paid") {
    return `<div class="stamp paid">PAID</div>`;
  }
  if (status === "overdue") {
    return `<div class="stamp overdue">OVERDUE</div>`;
  }
  return "";
};

export const downloadInvoice = (invoice, client, business, invoiceTotalFn) => {
  const subtotal = invoiceTotalFn(invoice);
  const amountRows = (invoice.items || [])
    .map(
      (item) => `
      <tr>
        <td>${item.desc || "Service"}</td>
        <td>${Number(item.qty || 0)}</td>
        <td>${fmtMoney(item.rate || 0)}</td>
        <td>${fmtMoney(Number(item.qty || 0) * Number(item.rate || 0))}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
  <html>
    <head>
      <title>${invoice.number}</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
        .paper { max-width: 820px; margin: 0 auto; border: 1px solid #eee; padding: 40px; position: relative; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 30px; }
        h1 { margin:0; font-size:32px; }
        .muted { color:#666; font-size:13px; }
        table { width:100%; border-collapse:collapse; margin: 24px 0; }
        th, td { text-align:left; border-bottom: 1px solid #ececec; padding: 12px 8px; font-size:14px; }
        .totals { margin-left:auto; width: 280px; }
        .totals-row { display:flex; justify-content:space-between; padding: 8px 0; border-bottom:1px solid #eee; }
        .totals-row.total { font-weight:700; font-size:18px; }
        .stamp { position:absolute; top:120px; right:40px; border: 3px solid; padding: 6px 14px; font-size:28px; font-weight:700; transform: rotate(-14deg); opacity:.75; }
        .stamp.paid { color:#0f8b3a; border-color:#0f8b3a; }
        .stamp.overdue { color:#b93d3d; border-color:#b93d3d; }
      </style>
    </head>
    <body>
      <div class="paper">
        ${stamp(invoice.status)}
        <div class="head">
          <div>
            <h1>Invoice</h1>
            <div class="muted">${invoice.number}</div>
            <div class="muted">Issued ${fmtDate(invoice.issued)}</div>
            <div class="muted">Due ${fmtDate(invoice.due)}</div>
          </div>
          <div style="text-align:right; max-width:280px;">
            <div style="font-weight:700; font-size:18px;">${business.name || "Business"}</div>
            <div class="muted">${business.email || ""}</div>
            <div class="muted">${business.phone || ""}</div>
            <div class="muted">${business.addr || ""}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
          <div>
            <div class="muted">Bill to</div>
            <div style="font-weight:600; margin-top:4px;">${client?.name || "Unlinked client"}</div>
            <div class="muted">${client?.email || ""}</div>
            <div class="muted">${client?.addr || ""}</div>
          </div>
          <div>
            <div class="muted">Project</div>
            <div style="font-weight:600; margin-top:4px;">${invoice.project || "General services"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>${amountRows}</tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
          <div class="totals-row"><span>Tax</span><span>${fmtMoney(0)}</span></div>
          <div class="totals-row total"><span>Total</span><span>${fmtMoney(subtotal)}</span></div>
        </div>
        <p class="muted" style="margin-top:24px;">${invoice.notes || "Thank you for your business."}</p>
      </div>
      <script>setTimeout(() => window.print(), 350)</script>
    </body>
  </html>
  `;

  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }
};

export const activityColor = (type) => {
  if (type === "paid") {
    return "#27a644";
  }
  if (type === "overdue") {
    return "#eb5757";
  }
  if (type === "sent") {
    return "#5e6ad2";
  }
  if (type === "reminder") {
    return "#d4a017";
  }
  return "#02b8cc";
};

export const activityLabel = (entry) => `${fmtDateShort(entry.when)} · ${entry.note}`;
