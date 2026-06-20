/* ============================================================
   store.jsx — persistence, seed, selectors, mutations, helpers.
   Data is namespaced per signed-in account.
   Attaches shared symbols to window.
   ============================================================ */
const { createContext, useContext, useState, useMemo, useCallback, useEffect } = React;

const LS_BASE = "mydesk_invoicing_v1";
function lsKey(accountId) { return LS_BASE + "::" + (accountId || "guest"); }

/* ---------- Format helpers ---------- */
const _fmtCache = {};
function fmtMoney(n, cur) {
  cur = cur || "USD";
  if (!_fmtCache[cur]) {
    try { _fmtCache[cur] = new Intl.NumberFormat("en-US", { style: "currency", currency: cur }); }
    catch (e) { _fmtCache[cur] = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }); }
  }
  return _fmtCache[cur].format(Number(n) || 0);
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function _toISO(d) { return d.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return _toISO(d); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return _toISO(d); }
function todayISO() { return _toISO(new Date()); }

window.fmtMoney = fmtMoney;
window.fmtDate = fmtDate;
window.fmtDateShort = fmtDateShort;
window.daysBetween = daysBetween;
window.daysFromNow = daysFromNow;
window.daysAgo = daysAgo;
window.todayISO = todayISO;

/* ---------- Seed data ---------- */
function seed() {
  const clients = [
    { id: "c1", name: "Acme Co.",     email: "billing@acme.io",     addr: "350 Mission St, San Francisco CA", description: "Enterprise SaaS client. Net-30 terms, quarterly retainer.", color: "#5e6ad2" },
    { id: "c2", name: "Beta Studio",  email: "ap@betastudio.com",   addr: "12 Hoxton Sq, London",             description: "Boutique brand agency. Project-based work.", color: "#02b8cc" },
    { id: "c3", name: "Gamma Inc.",   email: "finance@gamma.com",   addr: "500 Park Ave, New York NY",        description: "Fintech startup. Design retainer.", color: "#27a644" },
    { id: "c4", name: "Delta & Co",   email: "pay@deltaco.eu",      addr: "Rue Lafayette 9, Paris",           description: "EU marketing firm. Bills in EUR.", color: "#d4a017" },
    { id: "c5", name: "Epsilon Labs", email: "invoices@epsilon.dev",addr: "1 Infinite Loop, Cupertino CA",    description: "R&D lab. One-off audits.", color: "#eb5757" },
  ];

  const line = (id, desc, qty, rate) => ({ id, desc, qty, rate });
  const invoices = [
    { id: "inv-0141", number: "INV-0141", clientId: "c1", projectId: "p1", project: "Website redesign · phase 1", currency: "USD",
      issued: daysAgo(40), due: daysAgo(10), status: "paid", paidOn: daysAgo(8), method: "Stripe", ref: "ch_3PqRf2hzL",
      items: [line("l1", "Discovery sprint", 1, 1800), line("l2", "Wireframes", 1, 1200)],
      notes: "Thank you for your business. Payment terms: net 30.",
      activity: [
        { id: "a1", type: "created", when: daysAgo(42), note: "Invoice created" },
        { id: "a2", type: "sent", when: daysAgo(40), note: "Sent to billing@acme.io" },
        { id: "a3", type: "opened", when: daysAgo(38), note: "Client opened invoice" },
        { id: "a4", type: "paid", when: daysAgo(8), note: "Paid via Stripe" },
      ] },
    { id: "inv-0142", number: "INV-0142", clientId: "c2", projectId: "p2", project: "Brand identity kit", currency: "GBP",
      issued: daysAgo(20), due: daysFromNow(10), status: "pending", method: "Bank transfer",
      items: [line("l1", "Logo suite", 1, 2400), line("l2", "Brand guidelines", 1, 900)],
      notes: "Net 30. Bank transfer details on file.",
      activity: [
        { id: "a1", type: "created", when: daysAgo(21), note: "Invoice created" },
        { id: "a2", type: "sent", when: daysAgo(20), note: "Sent to ap@betastudio.com" },
        { id: "a3", type: "opened", when: daysAgo(18), note: "Client opened invoice" },
      ] },
    { id: "inv-0143", number: "INV-0143", clientId: "c3", project: "Q2 retainer", currency: "USD",
      issued: daysAgo(35), due: daysAgo(5), status: "overdue", method: "Stripe",
      items: [line("l1", "Design retainer — April", 1, 3500)],
      notes: "Net 30. Late fees apply after 15 days.",
      activity: [
        { id: "a1", type: "created", when: daysAgo(36), note: "Invoice created" },
        { id: "a2", type: "sent", when: daysAgo(35), note: "Sent to finance@gamma.com" },
        { id: "a3", type: "opened", when: daysAgo(33), note: "Client opened invoice" },
        { id: "a4", type: "reminder", when: daysAgo(2), note: "Reminder sent" },
      ] },
    { id: "inv-0144", number: "INV-0144", clientId: "c4", projectId: "p3", project: "Marketing site build", currency: "EUR",
      issued: daysAgo(6), due: daysFromNow(24), status: "pending", method: "Wise",
      items: [line("l1", "Frontend build", 40, 110), line("l2", "CMS integration", 1, 1500)],
      notes: "Net 30.",
      activity: [
        { id: "a1", type: "created", when: daysAgo(7), note: "Invoice created" },
        { id: "a2", type: "sent", when: daysAgo(6), note: "Sent to pay@deltaco.eu" },
      ] },
    { id: "inv-0145", number: "INV-0145", clientId: "c5", project: "Design system audit", currency: "USD",
      issued: daysAgo(50), due: daysAgo(20), status: "paid", paidOn: daysAgo(22), method: "Bank transfer", ref: "wire-88412",
      items: [line("l1", "Audit & report", 1, 2200)],
      notes: "Thanks!",
      activity: [
        { id: "a1", type: "created", when: daysAgo(52), note: "Invoice created" },
        { id: "a2", type: "sent", when: daysAgo(50), note: "Sent to invoices@epsilon.dev" },
        { id: "a3", type: "paid", when: daysAgo(22), note: "Paid via bank transfer" },
      ] },
    { id: "inv-0146", number: "INV-0146", clientId: "c1", projectId: "p1", project: "Website redesign · phase 2", currency: "USD",
      issued: todayISO(), due: daysFromNow(30), status: "draft", method: "Stripe",
      items: [line("l1", "Visual design", 1, 2600)],
      notes: "Net 30.",
      activity: [{ id: "a1", type: "created", when: todayISO(), note: "Draft created" }] },
  ];

  const ms = (id, title, amount, status, due, invoiceId) => ({ id, title, amount, status, due, invoiceId });
  const projects = [
    { id: "p1", name: "Website Redesign", clientId: "c1", total: 8000, currency: "USD",
      milestones: [
        ms("m1", "Discovery sprint", 1800, "done", daysAgo(38), "inv-0141"),
        ms("m2", "Wireframes", 1200, "done", daysAgo(30), "inv-0141"),
        ms("m3", "Visual design", 2600, "in_progress", daysFromNow(8)),
        ms("m4", "Build & handoff", 2400, "todo", daysFromNow(28)),
      ] },
    { id: "p2", name: "Brand Identity Kit", clientId: "c2", total: 4500, currency: "GBP",
      milestones: [
        ms("m1", "Logo suite", 2400, "done", daysAgo(18), "inv-0142"),
        ms("m2", "Brand guidelines", 900, "in_progress", daysFromNow(6)),
        ms("m3", "Asset delivery", 1200, "todo", daysFromNow(20)),
      ] },
    { id: "p3", name: "Marketing Site", clientId: "c4", total: 6000, currency: "EUR",
      milestones: [
        ms("m1", "Frontend build", 2900, "in_progress", daysFromNow(4)),
        ms("m2", "CMS integration", 1500, "todo", daysFromNow(14)),
        ms("m3", "Launch & QA", 1600, "todo", daysFromNow(26)),
      ] },
  ];

  const services = [
    { id: "s1", name: "Discovery sprint", description: "1-week research & scoping engagement", rate: 1800, currency: "USD" },
    { id: "s2", name: "Wireframes", description: "Low-fidelity screen flows", rate: 1200, currency: "USD" },
    { id: "s3", name: "Visual design", description: "Hi-fidelity UI design per project", rate: 2600, currency: "USD" },
    { id: "s4", name: "Frontend build", description: "Hourly frontend development", rate: 110, currency: "USD" },
    { id: "s5", name: "Brand identity", description: "Logo suite + guidelines", rate: 3300, currency: "USD" },
    { id: "s6", name: "Design retainer", description: "Monthly ongoing design support", rate: 3500, currency: "USD" },
  ];

  const business = {
    name: "Jane Doe Studio", email: "hello@janedoe.co",
    addr: "221B Baker St, London", phone: "+1 555 0117", logo: "",
    defaultCurrency: "USD",
    paymentMethods: (window.DEFAULT_PAYMENT_METHODS || ["Stripe", "Bank transfer", "PayPal", "Cash"]).slice(),
  };

  return { business, clients, invoices, projects, services, nextInvoiceNum: 147 };
}

/* Empty workspace — used by "Reset data" so every count goes to 0.
   Keeps payment methods + default currency so the app stays usable. */
function emptyState() {
  return {
    business: {
      name: "", email: "", addr: "", phone: "", logo: "",
      defaultCurrency: "USD",
      paymentMethods: (window.DEFAULT_PAYMENT_METHODS || ["Stripe", "Bank transfer", "PayPal", "Cash"]).slice(),
    },
    clients: [], invoices: [], projects: [], services: [], nextInvoiceNum: 1,
  };
}

/* ---------- Migration / load ---------- */
function refreshOverdue(state) {
  const t = todayISO();
  (state.invoices || []).forEach((inv) => { if (inv.status === "pending" && inv.due < t) inv.status = "overdue"; });
  return state;
}
function migrate(state) {
  if (!state.services) state.services = seed().services;
  if (!state.business.paymentMethods) state.business.paymentMethods = (window.DEFAULT_PAYMENT_METHODS || []).slice();
  if (!state.business.defaultCurrency) state.business.defaultCurrency = "USD";
  state.invoices.forEach((i) => { if (!i.currency) i.currency = state.business.defaultCurrency; if (i.projectId == null) i.projectId = ""; });
  state.clients.forEach((c) => { if (c.description == null) c.description = ""; });
  return state;
}
function load(accountId) {
  try {
    const raw = localStorage.getItem(lsKey(accountId));
    if (raw) return refreshOverdue(migrate(JSON.parse(raw)));
  } catch (e) {}
  return refreshOverdue(seed());
}

/* ---------- Context ---------- */
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);
window.useStore = () => useContext(StoreCtx);

function StoreProvider({ accountId, children }) {
  const [state, setState] = useState(() => load(accountId));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try { localStorage.setItem(lsKey(accountId), JSON.stringify(state)); } catch (e) {}
  }, [state, accountId]);

  const toast = useCallback((msg, variant = "info") => {
    const id = "t-" + Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* selectors */
  const getClient = useCallback((id) => state.clients.find((c) => c.id === id), [state]);
  const getInvoice = useCallback((id) => state.invoices.find((i) => i.id === id), [state]);
  const getProject = useCallback((id) => state.projects.find((p) => p.id === id), [state]);
  const getService = useCallback((id) => state.services.find((s) => s.id === id), [state]);
  const invoiceTotal = useCallback((inv) => (inv?.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0), []);
  const invoicesByClient = useCallback((cid) => state.invoices.filter((i) => i.clientId === cid), [state]);
  const projectsByClient = useCallback((cid) => state.projects.filter((p) => p.clientId === cid), [state]);
  const invoicesByProject = useCallback((pid) => state.invoices.filter((i) => i.projectId === pid), [state]);
  const projectProgress = useCallback((p) => {
    const total = p.milestones.length, done = p.milestones.filter((m) => m.status === "done").length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, []);
  /* Amount-based billing tracker, driven by invoices linked to the project. */
  const projectAmounts = useCallback((p) => {
    const linked = state.invoices.filter((i) => i.projectId === p.id);
    const invoiceSum = (inv) => (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    const invoiced = linked.reduce((s, i) => s + invoiceSum(i), 0);
    const paid = linked.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceSum(i), 0);
    const total = p.total || 0;
    return {
      total, invoiced, paid,
      outstanding: invoiced - paid,        // billed but not yet paid
      remaining: Math.max(0, total - invoiced), // valuation left to invoice
      pct: total ? Math.min(100, Math.round((invoiced / total) * 100)) : 0,
      paidPct: total ? Math.min(100, Math.round((paid / total) * 100)) : 0,
    };
  }, [state]);

  const mut = (fn) => setState((s) => { const n = JSON.parse(JSON.stringify(s)); fn(n); return n; });

  /* invoices */
  const createInvoice = useCallback((draft) => {
    let created;
    setState((s) => {
      const n = JSON.parse(JSON.stringify(s));
      const num = n.nextInvoiceNum; n.nextInvoiceNum = num + 1;
      const id = "inv-" + String(num).padStart(4, "0");
      created = {
        id, number: "INV-" + String(num).padStart(4, "0"),
        clientId: draft.clientId || "", projectId: draft.projectId || "", project: draft.project || "",
        currency: draft.currency || n.business.defaultCurrency || "USD",
        method: draft.method || (n.business.paymentMethods[0] || ""),
        issued: draft.issued || todayISO(), due: draft.due || daysFromNow(30),
        status: draft.status || "draft",
        items: draft.items && draft.items.length ? draft.items : [{ id: "l1", desc: "", qty: 1, rate: 0 }],
        notes: draft.notes || "",
        activity: [{ id: "a1", type: "created", when: todayISO(), note: "Invoice created" }],
      };
      if (draft.status === "pending") created.activity.push({ id: "a2", type: "sent", when: todayISO(), note: "Invoice sent" });
      n.invoices.unshift(created);
      return n;
    });
    return created;
  }, []);

  const updateInvoice = useCallback((id, patch) => mut((n) => {
    const inv = n.invoices.find((i) => i.id === id); if (inv) Object.assign(inv, patch);
  }), []);
  const deleteInvoice = useCallback((id) => mut((n) => { n.invoices = n.invoices.filter((i) => i.id !== id); }), []);

  const sendInvoice = useCallback((id) => {
    mut((n) => {
      const inv = n.invoices.find((i) => i.id === id); if (!inv) return;
      inv.status = "pending";
      inv.activity.push({ id: "a-" + Date.now(), type: "sent", when: todayISO(), note: "Invoice sent" });
    });
    toast("Invoice sent", "ok");
  }, [toast]);

  const markPaid = useCallback((id, { method, ref } = {}) => {
    mut((n) => {
      const inv = n.invoices.find((i) => i.id === id); if (!inv) return;
      inv.status = "paid"; inv.paidOn = todayISO(); inv.method = method || inv.method || "Manual"; inv.ref = ref || "";
      inv.activity.push({ id: "a-" + Date.now(), type: "paid", when: todayISO(), note: "Marked paid via " + (method || inv.method || "Manual") });
    });
    toast("Marked as paid", "ok");
  }, [toast]);

  const sendReminder = useCallback((id) => {
    mut((n) => { const inv = n.invoices.find((i) => i.id === id); if (inv) inv.activity.push({ id: "a-" + Date.now(), type: "reminder", when: todayISO(), note: "Reminder sent" }); });
    toast("Reminder sent", "info");
  }, [toast]);

  const duplicateInvoice = useCallback((id) => {
    let created;
    setState((s) => {
      const n = JSON.parse(JSON.stringify(s));
      const src = n.invoices.find((i) => i.id === id); if (!src) return s;
      const num = n.nextInvoiceNum; n.nextInvoiceNum = num + 1;
      created = JSON.parse(JSON.stringify(src));
      created.id = "inv-" + String(num).padStart(4, "0");
      created.number = "INV-" + String(num).padStart(4, "0");
      created.status = "draft"; delete created.paidOn; delete created.ref;
      created.issued = todayISO(); created.due = daysFromNow(30);
      created.activity = [{ id: "a1", type: "created", when: todayISO(), note: "Duplicated from " + src.number }];
      n.invoices.unshift(created);
      return n;
    });
    toast("Invoice duplicated", "ok");
    return created;
  }, [toast]);

  /* projects */
  const updateProject = useCallback((id, patch) => mut((n) => { const p = n.projects.find((x) => x.id === id); if (p) Object.assign(p, patch); }), []);
  const toggleMilestone = useCallback((pid, mid) => mut((n) => {
    const p = n.projects.find((x) => x.id === pid); const m = p && p.milestones.find((x) => x.id === mid);
    if (m) m.status = m.status === "done" ? "in_progress" : "done";
  }), []);
  const invoiceMilestone = useCallback((pid, mid) => {
    let created;
    setState((s) => {
      const n = JSON.parse(JSON.stringify(s));
      const p = n.projects.find((x) => x.id === pid); const m = p && p.milestones.find((x) => x.id === mid);
      if (!m) return s;
      const num = n.nextInvoiceNum; n.nextInvoiceNum = num + 1;
      const id = "inv-" + String(num).padStart(4, "0");
      created = {
        id, number: "INV-" + String(num).padStart(4, "0"), clientId: p.clientId, projectId: p.id, project: p.name + " · " + m.title,
        currency: p.currency || n.business.defaultCurrency, method: n.business.paymentMethods[0] || "",
        issued: todayISO(), due: daysFromNow(30), status: "pending",
        items: [{ id: "l1", desc: m.title, qty: 1, rate: m.amount }], notes: "Net 30.",
        activity: [{ id: "a1", type: "created", when: todayISO(), note: "Created from milestone" }, { id: "a2", type: "sent", when: todayISO(), note: "Invoice sent" }],
      };
      n.invoices.unshift(created); m.invoiceId = id; if (m.status !== "done") m.status = "done";
      return n;
    });
    toast("Invoice generated & sent", "ok");
    return created;
  }, [toast]);

  const createProject = useCallback((draft) => {
    let created;
    setState((s) => {
      const n = JSON.parse(JSON.stringify(s));
      created = {
        id: "p-" + Date.now(),
        name: draft.name || "New project",
        clientId: draft.clientId || (n.clients[0] && n.clients[0].id) || "",
        total: Number(draft.total) || 0,
        currency: draft.currency || n.business.defaultCurrency || "USD",
        milestones: [],
      };
      n.projects.push(created);
      return n;
    });
    return created;
  }, []);

  const deleteProject = useCallback((id) => mut((n) => {
    n.projects = n.projects.filter((p) => p.id !== id);
    n.invoices.forEach((i) => { if (i.projectId === id) i.projectId = ""; });
  }), []);

  /* Generate an invoice for a custom amount billed against a project's remaining valuation. */
  const generateProjectInvoice = useCallback((pid, { amount, desc, status } = {}) => {
    let created;
    setState((s) => {
      const n = JSON.parse(JSON.stringify(s));
      const p = n.projects.find((x) => x.id === pid);
      if (!p) return s;
      const num = n.nextInvoiceNum; n.nextInvoiceNum = num + 1;
      const id = "inv-" + String(num).padStart(4, "0");
      const st = status || "pending";
      created = {
        id, number: "INV-" + String(num).padStart(4, "0"),
        clientId: p.clientId, projectId: p.id, project: p.name,
        currency: p.currency || n.business.defaultCurrency, method: n.business.paymentMethods[0] || "",
        issued: todayISO(), due: daysFromNow(30), status: st,
        items: [{ id: "l1", desc: desc || (p.name + " — progress billing"), qty: 1, rate: Number(amount) || 0 }],
        notes: "Net 30.",
        activity: [{ id: "a1", type: "created", when: todayISO(), note: "Billed against project" }],
      };
      if (st === "pending") created.activity.push({ id: "a2", type: "sent", when: todayISO(), note: "Invoice sent" });
      n.invoices.unshift(created);
      return n;
    });
    toast(status === "draft" ? "Draft invoice created" : "Invoice generated & sent", "ok");
    return created;
  }, [toast]);

  /* clients */
  const createClient = useCallback((draft) => mut((n) => {
    n.clients.push({ id: "c-" + Date.now(), name: draft.name || "New client", email: draft.email || "", addr: draft.addr || "", description: draft.description || "", color: draft.color || "#5e6ad2" });
  }), []);
  const updateClient = useCallback((id, patch) => mut((n) => { const c = n.clients.find((x) => x.id === id); if (c) Object.assign(c, patch); }), []);
  const deleteClient = useCallback((id) => mut((n) => { n.clients = n.clients.filter((c) => c.id !== id); }), []);

  /* services */
  const createService = useCallback((draft) => mut((n) => {
    n.services.push({ id: "s-" + Date.now(), name: draft.name || "New service", description: draft.description || "", rate: Number(draft.rate) || 0, currency: draft.currency || n.business.defaultCurrency || "USD" });
  }), []);
  const updateService = useCallback((id, patch) => mut((n) => { const s = n.services.find((x) => x.id === id); if (s) Object.assign(s, patch); }), []);
  const deleteService = useCallback((id) => mut((n) => { n.services = n.services.filter((s) => s.id !== id); }), []);

  /* business / payment methods */
  const updateBusiness = useCallback((patch) => mut((n) => { Object.assign(n.business, patch); }), []);
  const addPaymentMethod = useCallback((name) => mut((n) => {
    const v = (name || "").trim(); if (v && !n.business.paymentMethods.includes(v)) n.business.paymentMethods.push(v);
  }), []);
  const removePaymentMethod = useCallback((name) => mut((n) => { n.business.paymentMethods = n.business.paymentMethods.filter((m) => m !== name); }), []);

  const resetData = useCallback(() => {
    setState(emptyState());
    toast("All data cleared", "info");
  }, [toast]);

  const loadDemo = useCallback(() => {
    setState(refreshOverdue(seed()));
    toast("Demo data loaded", "ok");
  }, [toast]);

  const value = useMemo(() => ({
    ...state,
    getClient, getInvoice, getProject, getService, invoiceTotal, invoicesByClient, projectsByClient, invoicesByProject, projectProgress, projectAmounts,
    createInvoice, updateInvoice, deleteInvoice, sendInvoice, markPaid, sendReminder, duplicateInvoice,
    updateProject, toggleMilestone, invoiceMilestone, createProject, deleteProject, generateProjectInvoice,
    createClient, updateClient, deleteClient,
    createService, updateService, deleteService,
    updateBusiness, addPaymentMethod, removePaymentMethod, resetData, loadDemo, toast,
  }), [state, getClient, getInvoice, getProject, getService, invoiceTotal, invoicesByClient, projectsByClient, invoicesByProject, projectProgress, projectAmounts,
    createInvoice, updateInvoice, deleteInvoice, sendInvoice, markPaid, sendReminder, duplicateInvoice,
    updateProject, toggleMilestone, invoiceMilestone, createProject, deleteProject, generateProjectInvoice, createClient, updateClient, deleteClient,
    createService, updateService, deleteService, updateBusiness, addPaymentMethod, removePaymentMethod, resetData, loadDemo, toast]);

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (<div key={t.id} className={"toast " + t.variant}><span className="dot" />{t.msg}</div>))}
      </div>
    </StoreCtx.Provider>
  );
}

window.StoreProvider = StoreProvider;
