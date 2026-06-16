/* ============================================================
   ui.jsx — shared primitives. Attaches to window.
   ============================================================ */
const { useState: _useState, useEffect: _useEffect, useRef: _useRef } = React;

/* ---------- Icon set (inline SVG) ---------- */
const ICONS = {
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
  invoice: "M6 2h9l5 5v15H6zM14 2v6h6",
  project: "M3 7h5l2 2h11v11H3zM3 7V5h5l2 2",
  client: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  arrow: "M5 12h14M13 5l7 7-7 7",
  chevron: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  back: "M19 12H5M12 19l-7-7 7-7",
  check: "M20 6L9 17l-5-5",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  dot: "M12 12h.01",
  sparkle: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17l-1.9-5.1L4.5 10l5.6-1.4z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  close: "M18 6L6 18M6 6l12 12",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  receipt: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1zM8 7h8M8 11h8M8 15h5",
  menu: "M3 6h18M3 12h18M3 18h18",
  zap: "M13 2L3 14h9l-1 8 10-12h-9z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function Icon({ name, size = 16, color }) {
  const d = ICONS[name] || ICONS.dot;
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ---------- StatusPill ---------- */
function StatusPill({ status }) {
  return <span className={"pill " + status}>{String(status).replace("_", " ")}</span>;
}

/* ---------- Avatar / ClientCell ---------- */
function Avatar({ name, color, size = 28, src }) {
  if (src) return <img className="avatar" src={src} alt={name || ""} style={{ width: size, height: size, objectFit: "cover" }} />;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className="avatar" style={{ background: color || "#5e6ad2", width: size, height: size, fontSize: size * 0.42 }}>{initials}</span>;
}

function ClientCell({ client, sub }) {
  return (
    <div className="client-cell">
      <Avatar name={client ? client.name : "?"} color={client ? client.color : "#444"} />
      <div className="meta">
        <div className="semibold">{client ? client.name : "Unknown client"}</div>
        {sub && <div className="sub truncate">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ route, onNav, counts, account, onSignOut, open }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "invoices", label: "Invoices", icon: "invoice", count: counts.invoices },
    { key: "projects", label: "Projects", icon: "project", count: counts.projects },
    { key: "clients", label: "Clients", icon: "client", count: counts.clients },
    { key: "services", label: "Services", icon: "sparkle", count: counts.services },
    { key: "settings", label: "Settings", icon: "settings" },
  ];
  const active = (k) =>
    route === k ||
    (k === "invoices" && (route === "invoice-detail" || route === "editor")) ||
    (k === "projects" && route === "project-detail");
  const acct = account || { name: "Guest", email: "", picture: "" };
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="logo">M</div>
        <div className="name">MyDesk <span>· Invoicing</span></div>
      </div>
      <button className="cta-new" onClick={() => onNav("editor")}>
        <Icon name="plus" size={15} /> New invoice
      </button>
      {items.map((it) => (
        <button key={it.key} className={"nav-item" + (active(it.key) ? " active" : "")} onClick={() => onNav(it.key)}>
          <Icon name={it.icon} size={16} />
          {it.label}
          {it.count != null && <span className="count">{it.count}</span>}
        </button>
      ))}
      <div className="side-foot">
        <div className="user-card">
          <Avatar name={acct.name} color="#5e6ad2" src={acct.picture} size={30} />
          <div className="meta" style={{ minWidth: 0 }}>
            <div className="semibold truncate">{acct.name}</div>
            <div className="muted tiny truncate">{acct.email || (acct.provider === "guest" ? "Local guest" : "")}</div>
          </div>
          <button className="icon-btn" title="Sign out" onClick={onSignOut} style={{ marginLeft: "auto", flexShrink: 0 }}><Icon name="back" size={14} /></button>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ crumbs, search, onSearch, onMenu }) {
  return (
    <div className="topbar">
      <button className="menu-btn icon-btn" onClick={onMenu} title="Menu"><Icon name="menu" size={18} /></button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={"crumb" + (i === crumbs.length - 1 ? " last" : "")}
              onClick={() => i < crumbs.length - 1 && c.onClick && c.onClick()}>{c.label}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="search-box">
        <Icon name="search" size={15} color="#8a8f98" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search invoices, clients…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="icon-btn"><Icon name="bell" size={16} /></button>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ title, desc, children, footer, onClose }) {
  _useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div className="spread">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose}><Icon name="close" size={15} /></button>
          </div>
          {desc && <div className="desc">{desc}</div>}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Row menu (dropdown) ---------- */
function RowMenu({ items }) {
  const [open, setOpen] = _useState(false);
  const ref = _useRef(null);
  _useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <span className="row-menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)}><Icon name="more" size={16} /></button>
      {open && (
        <div className="row-menu">
          {items.map((it, i) => (
            <button key={i} className={it.danger ? "danger" : ""} onClick={() => { setOpen(false); it.onClick(); }}>
              <Icon name={it.icon} size={14} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

/* ---------- Invoice paper (shared render) ---------- */
function InvoicePaper({ inv, client, business, total, stamp }) {
  const cur = inv.currency || "USD";
  const sub = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  return (
    <div className="inv-paper">
      {stamp === "paid" && <div className="paid-stamp">Paid</div>}
      {stamp === "overdue" && <div className="overdue-stamp">Overdue</div>}
      <div className="ip-head">
        <div className="row gap-12">
          {business.logo
            ? <img className="ip-logo" src={business.logo} alt="logo" />
            : <div className="ip-logo">{(business.name || "M")[0]}</div>}
          <div>
            <div className="ip-biz-name">{business.name}</div>
            <div className="ip-muted">{business.email}<br />{business.addr}</div>
          </div>
        </div>
        <div>
          <h2 className="ip-title">Invoice</h2>
          <div className="ip-num">{inv.number} · {cur}</div>
        </div>
      </div>
      <div className="ip-parties">
        <div>
          <div className="ip-label">Bill to</div>
          <div className="semibold">{client ? client.name : "—"}</div>
          <div className="ip-muted">{client ? client.email : ""}<br />{client ? client.addr : ""}</div>
        </div>
        <div className="right">
          <div className="ip-label">Details</div>
          <div className="ip-muted">
            <div><b>Project:</b> {inv.project || "—"}</div>
            <div><b>Issued:</b> {fmtDate(inv.issued)}</div>
            <div><b>Due:</b> {fmtDate(inv.due)}</div>
          </div>
        </div>
      </div>
      <table className="ip-items">
        <thead>
          <tr><th>Description</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr>
        </thead>
        <tbody>
          {(inv.items || []).map((it) => (
            <tr key={it.id}>
              <td>{it.desc || "—"}</td>
              <td className="r mono">{it.qty}</td>
              <td className="r mono">{fmtMoney(it.rate, cur)}</td>
              <td className="r mono">{fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ip-totals">
        <div className="tr"><span>Subtotal</span><span className="mono">{fmtMoney(sub, cur)}</span></div>
        <div className="tr"><span>Tax (0%)</span><span className="mono">{fmtMoney(0, cur)}</span></div>
        <div className="tr grand"><span>Total</span><span className="mono">{fmtMoney(total != null ? total : sub, cur)}</span></div>
      </div>
      {inv.notes && <div className="ip-notes">{inv.notes}</div>}
    </div>
  );
}

/* ---------- downloadInvoice: print-ready window ---------- */
function downloadInvoice(inv, client, business, invoiceTotalFn) {
  const cur = inv.currency || "USD";
  const total = invoiceTotalFn ? invoiceTotalFn(inv) : (inv.items || []).reduce((s, it) => s + it.qty * it.rate, 0);
  const rows = (inv.items || []).map((it) => `
    <tr>
      <td>${esc(it.desc)}</td>
      <td class="r m">${it.qty}</td>
      <td class="r m">${fmtMoney(it.rate, cur)}</td>
      <td class="r m">${fmtMoney((Number(it.qty)||0)*(Number(it.rate)||0), cur)}</td>
    </tr>`).join("");
  const stamp = inv.status === "paid" ? `<div class="stamp paid">PAID</div>`
    : inv.status === "overdue" ? `<div class="stamp overdue">OVERDUE</div>` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Inter,sans-serif;color:#1a1a1a;padding:48px;max-width:760px;margin:0 auto;position:relative}
    .m{font-family:'JetBrains Mono',monospace}
    .head{display:flex;justify-content:space-between;margin-bottom:36px}
    .biz{font-weight:700;font-size:16px}.muted{color:#6b7280;font-size:12px;line-height:1.6}
    h1{font-size:30px;text-align:right}.num{font-family:'JetBrains Mono',monospace;color:#6b7280;text-align:right}
    .parties{display:flex;justify-content:space-between;margin:28px 0}
    .label{text-transform:uppercase;font-size:10px;letter-spacing:.05em;color:#9ca3af;font-weight:600;margin-bottom:5px}
    table{width:100%;border-collapse:collapse;margin:18px 0}
    th{text-align:left;font-size:10.5px;text-transform:uppercase;color:#9ca3af;border-bottom:1.5px solid #e5e7eb;padding:8px 0}
    td{padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px}.r{text-align:right}
    .totals{margin-left:auto;width:260px;margin-top:10px}
    .tr{display:flex;justify-content:space-between;padding:6px 0}
    .grand{border-top:1.5px solid #e5e7eb;margin-top:6px;padding-top:12px;font-weight:700;font-size:18px}
    .notes{margin-top:30px;padding-top:18px;border-top:1px solid #f0f0f0;color:#4b5563;font-size:12px}
    .stamp{position:absolute;top:120px;right:60px;font-size:46px;font-weight:800;border:6px solid;border-radius:12px;padding:8px 22px;transform:rotate(-14deg);opacity:.16}
    .stamp.paid{color:#27a644}.stamp.overdue{color:#eb5757}
    @media print{body{padding:24px}}
  </style></head><body>
  ${stamp}
  <div class="head">
    <div><div class="biz">${esc(business.name)}</div><div class="muted">${esc(business.email)}<br>${esc(business.addr)}<br>${esc(business.phone||"")}</div></div>
    <div><h1>Invoice</h1><div class="num">${esc(inv.number)}</div></div>
  </div>
  <div class="parties">
    <div><div class="label">Bill to</div><div style="font-weight:600">${esc(client?client.name:"")}</div><div class="muted">${esc(client?client.email:"")}<br>${esc(client?client.addr:"")}</div></div>
    <div style="text-align:right"><div class="label">Details</div><div class="muted">Project: ${esc(inv.project)}<br>Issued: ${fmtDate(inv.issued)}<br>Due: ${fmtDate(inv.due)}</div></div>
  </div>
  <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="tr"><span>Subtotal</span><span class="m">${fmtMoney(total, cur)}</span></div>
    <div class="tr"><span>Tax (0%)</span><span class="m">${fmtMoney(0, cur)}</span></div>
    <div class="tr grand"><span>Total · ${esc(cur)}</span><span class="m">${fmtMoney(total, cur)}</span></div>
  </div>
  ${inv.notes?`<div class="notes">${esc(inv.notes)}</div>`:""}
  <script>setTimeout(function(){window.print()},350)</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Allow pop-ups to download the invoice."); return; }
  w.document.write(html); w.document.close();
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* expose */
window.Icon = Icon;
window.StatusPill = StatusPill;
window.Avatar = Avatar;
window.ClientCell = ClientCell;
window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.Modal = Modal;
window.RowMenu = RowMenu;
window.InvoicePaper = InvoicePaper;
window.downloadInvoice = downloadInvoice;
