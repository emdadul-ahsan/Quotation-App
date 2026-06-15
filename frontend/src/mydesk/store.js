import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "mydesk_invoicing_v1";
const StoreContext = createContext(null);

const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isoDate = (date) => date.toISOString().slice(0, 10);
const todayDate = () => isoDate(new Date());

export const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
};

const fromIso = (value) => new Date(`${value}T00:00:00`);

export const daysBetween = (dateA, dateB) => {
  const diffMs = fromIso(dateA).getTime() - fromIso(dateB).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const fmtMoney = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const fmtDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(fromIso(value));

export const fmtDateShort = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(fromIso(value));

const invoiceTotalFn = (invoice) =>
  (invoice?.items || []).reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0),
    0,
  );

const baseClients = [
  {
    id: "c1",
    name: "Acme Co.",
    email: "billing@acme.io",
    addr: "350 Mission St, San Francisco CA",
    color: "#5e6ad2",
  },
  {
    id: "c2",
    name: "Beta Studio",
    email: "accounts@betastudio.design",
    addr: "12 Howard St, Brooklyn NY",
    color: "#02b8cc",
  },
  {
    id: "c3",
    name: "Gamma Inc.",
    email: "finance@gammainc.com",
    addr: "88 Wacker Dr, Chicago IL",
    color: "#27a644",
  },
  {
    id: "c4",
    name: "Delta & Co",
    email: "payables@delta.co",
    addr: "100 Congress Ave, Austin TX",
    color: "#d4a017",
  },
  {
    id: "c5",
    name: "Epsilon Labs",
    email: "ops@epsilonlabs.ai",
    addr: "420 King St W, Toronto ON",
    color: "#eb5757",
  },
];

const activity = (id, type, when, note) => ({ id, type, when, note });

const seedState = () => ({
  business: {
    name: "Jane Doe Studio",
    email: "hello@janedoe.co",
    addr: "221B Baker St, London",
    phone: "+1 555 0117",
    logo: "",
  },
  clients: baseClients,
  invoices: [
    {
      id: "inv-0141",
      number: "INV-0141",
      clientId: "c1",
      project: "Website redesign · discovery sprint",
      issued: daysAgo(42),
      due: daysAgo(28),
      status: "paid",
      paidOn: daysAgo(27),
      method: "Stripe · •• 4242",
      ref: "ch_3PqRf2hzL",
      items: [
        { id: "l141-1", desc: "Discovery sprint", qty: 1, rate: 1800 },
        { id: "l141-2", desc: "Stakeholder workshop", qty: 2, rate: 600 },
      ],
      notes: "Net 15. Thank you for the smooth kickoff.",
      activity: [
        activity("a141-1", "created", daysAgo(42), "Invoice INV-0141 created"),
        activity("a141-2", "sent", daysAgo(41), "Invoice INV-0141 sent"),
        activity("a141-3", "opened", daysAgo(40), "Client opened invoice"),
        activity("a141-4", "paid", daysAgo(27), "Paid via Stripe · •• 4242"),
      ],
    },
    {
      id: "inv-0142",
      number: "INV-0142",
      clientId: "c1",
      project: "Website redesign · wireframes",
      issued: daysAgo(20),
      due: daysAgo(6),
      status: "paid",
      paidOn: daysAgo(4),
      method: "Bank transfer",
      ref: "TRX-83291",
      items: [{ id: "l142-1", desc: "Wireframes package", qty: 1, rate: 2500 }],
      notes: "Includes desktop + mobile key flows.",
      activity: [
        activity("a142-1", "created", daysAgo(20), "Invoice INV-0142 created"),
        activity("a142-2", "sent", daysAgo(19), "Invoice INV-0142 sent"),
        activity("a142-3", "opened", daysAgo(18), "Client opened invoice"),
        activity("a142-4", "paid", daysAgo(4), "Paid via Bank transfer"),
      ],
    },
    {
      id: "inv-0143",
      number: "INV-0143",
      clientId: "c2",
      project: "Monthly product design retainer",
      issued: daysAgo(12),
      due: daysFromNow(4),
      status: "pending",
      items: [{ id: "l143-1", desc: "Retainer · April", qty: 1, rate: 3200 }],
      notes: "Due on receipt. Late fee of 2% after due date.",
      activity: [
        activity("a143-1", "created", daysAgo(12), "Invoice INV-0143 created"),
        activity("a143-2", "sent", daysAgo(11), "Invoice INV-0143 sent"),
      ],
    },
    {
      id: "inv-0144",
      number: "INV-0144",
      clientId: "c3",
      project: "Analytics dashboard implementation",
      issued: daysAgo(25),
      due: daysAgo(3),
      status: "overdue",
      items: [
        { id: "l144-1", desc: "Frontend development", qty: 24, rate: 120 },
        { id: "l144-2", desc: "API integration", qty: 10, rate: 140 },
      ],
      notes: "Please include invoice number in transfer details.",
      activity: [
        activity("a144-1", "created", daysAgo(25), "Invoice INV-0144 created"),
        activity("a144-2", "sent", daysAgo(24), "Invoice INV-0144 sent"),
        activity("a144-3", "opened", daysAgo(22), "Client opened invoice"),
        activity("a144-4", "reminder", daysAgo(2), "Payment reminder sent"),
      ],
    },
    {
      id: "inv-0145",
      number: "INV-0145",
      clientId: "c4",
      project: "Brand strategy workshop",
      issued: daysAgo(2),
      due: daysFromNow(12),
      status: "draft",
      items: [{ id: "l145-1", desc: "Workshop prep + facilitation", qty: 1, rate: 1800 }],
      notes: "Draft for review.",
      activity: [
        activity("a145-1", "created", daysAgo(2), "Invoice INV-0145 created"),
      ],
    },
    {
      id: "inv-0146",
      number: "INV-0146",
      clientId: "c5",
      project: "Brand sprint · concept exploration",
      issued: daysAgo(8),
      due: daysFromNow(8),
      status: "pending",
      items: [
        { id: "l146-1", desc: "Concept routes", qty: 3, rate: 650 },
        { id: "l146-2", desc: "Presentation deck", qty: 1, rate: 420 },
      ],
      notes: "Thank you for your partnership.",
      activity: [
        activity("a146-1", "created", daysAgo(8), "Invoice INV-0146 created"),
        activity("a146-2", "sent", daysAgo(7), "Invoice INV-0146 sent"),
      ],
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Website Redesign",
      clientId: "c1",
      total: 12000,
      currency: "USD",
      milestones: [
        {
          id: "m1",
          title: "Discovery sprint",
          amount: 3000,
          status: "done",
          invoiceId: "inv-0141",
          due: daysAgo(35),
        },
        {
          id: "m2",
          title: "Wireframes",
          amount: 2500,
          status: "done",
          invoiceId: "inv-0142",
          due: daysAgo(14),
        },
        {
          id: "m3",
          title: "Visual design",
          amount: 3000,
          status: "in_progress",
          due: daysFromNow(6),
        },
        {
          id: "m4",
          title: "Build QA",
          amount: 3500,
          status: "todo",
          due: daysFromNow(20),
        },
      ],
    },
    {
      id: "p2",
      name: "Product Design Retainer",
      clientId: "c2",
      total: 9600,
      currency: "USD",
      milestones: [
        {
          id: "m5",
          title: "April cycle",
          amount: 3200,
          status: "done",
          invoiceId: "inv-0143",
          due: daysAgo(1),
        },
        {
          id: "m6",
          title: "May cycle",
          amount: 3200,
          status: "in_progress",
          due: daysFromNow(23),
        },
        {
          id: "m7",
          title: "June cycle",
          amount: 3200,
          status: "todo",
          due: daysFromNow(51),
        },
      ],
    },
    {
      id: "p3",
      name: "Brand Sprint",
      clientId: "c5",
      total: 7800,
      currency: "USD",
      milestones: [
        {
          id: "m8",
          title: "Research & positioning",
          amount: 2100,
          status: "done",
          invoiceId: "inv-0146",
          due: daysAgo(7),
        },
        {
          id: "m9",
          title: "Concept design",
          amount: 2900,
          status: "in_progress",
          due: daysFromNow(11),
        },
        {
          id: "m10",
          title: "System rollout",
          amount: 2800,
          status: "todo",
          due: daysFromNow(30),
        },
      ],
    },
  ],
  nextInvoiceNum: 147,
});

const refreshOverdue = (state) => {
  const today = todayDate();
  return {
    ...state,
    invoices: (state.invoices || []).map((invoice) => {
      if (invoice.status === "pending" && daysBetween(today, invoice.due) > 0) {
        return { ...invoice, status: "overdue" };
      }
      return invoice;
    }),
  };
};

const loadState = () => {
  const fallback = seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...refreshOverdue(fallback), toasts: [] };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.invoices) || !Array.isArray(parsed.clients)) {
      return { ...refreshOverdue(fallback), toasts: [] };
    }
    return {
      ...refreshOverdue({
        business: parsed.business || fallback.business,
        clients: parsed.clients || fallback.clients,
        invoices: parsed.invoices || fallback.invoices,
        projects: parsed.projects || fallback.projects,
        nextInvoiceNum: parsed.nextInvoiceNum || fallback.nextInvoiceNum,
      }),
      toasts: [],
    };
  } catch (_error) {
    return { ...refreshOverdue(fallback), toasts: [] };
  }
};

export const StoreProvider = ({ children }) => {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const persistable = {
      business: state.business,
      clients: state.clients,
      invoices: state.invoices,
      projects: state.projects,
      nextInvoiceNum: state.nextInvoiceNum,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [
    state.business,
    state.clients,
    state.invoices,
    state.projects,
    state.nextInvoiceNum,
  ]);

  const toast = useCallback((msg, variant = "info") => {
    const id = uid("toast");
    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, { id, msg, variant }],
    }));
    window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        toasts: prev.toasts.filter((item) => item.id !== id),
      }));
    }, 3600);
  }, []);

  const getClient = useCallback(
    (id) => state.clients.find((client) => client.id === id),
    [state.clients],
  );

  const getInvoice = useCallback(
    (id) => state.invoices.find((invoice) => invoice.id === id),
    [state.invoices],
  );

  const getProject = useCallback(
    (id) => state.projects.find((project) => project.id === id),
    [state.projects],
  );

  const invoicesByClient = useCallback(
    (clientId) => state.invoices.filter((invoice) => invoice.clientId === clientId),
    [state.invoices],
  );

  const projectsByClient = useCallback(
    (clientId) => state.projects.filter((project) => project.clientId === clientId),
    [state.projects],
  );

  const projectProgress = useCallback((project) => {
    const total = project?.milestones?.length || 0;
    const done = (project?.milestones || []).filter(
      (milestone) => milestone.status === "done",
    ).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, []);

  const projectAmounts = useCallback(
    (project) => {
      const total = Number(project?.total || 0);
      const paid = (project?.milestones || []).reduce((sum, milestone) => {
        if (!milestone.invoiceId) {
          return sum;
        }
        const linked = state.invoices.find(
          (invoice) => invoice.id === milestone.invoiceId,
        );
        if (linked?.status === "paid") {
          return sum + Number(milestone.amount || 0);
        }
        return sum;
      }, 0);
      return { paid, remaining: Math.max(total - paid, 0), total };
    },
    [state.invoices],
  );

  const createInvoice = useCallback(
    (draft) => {
      const num = state.nextInvoiceNum;
      const number = `INV-${String(num).padStart(4, "0")}`;
      const id = `inv-${String(num).padStart(4, "0")}`;
      const issued = draft.issued || todayDate();
      const status = draft.status || "draft";
      const created = {
        id,
        number,
        clientId: draft.clientId || null,
        project: draft.project || "",
        issued,
        due: draft.due || daysFromNow(14),
        status,
        paidOn: draft.paidOn,
        method: draft.method,
        ref: draft.ref,
        items: (draft.items?.length
          ? draft.items
          : [{ id: uid("l"), desc: "Service", qty: 1, rate: 0 }]
        ).map((item) => ({
          id: item.id || uid("l"),
          desc: item.desc || "",
          qty: Number(item.qty || 0),
          rate: Number(item.rate || 0),
        })),
        notes: draft.notes || "",
        activity: [
          {
            id: uid("a"),
            type: "created",
            when: issued,
            note: `Invoice ${number} created`,
          },
        ],
      };

      if (status === "pending") {
        created.activity.push({
          id: uid("a"),
          type: "sent",
          when: issued,
          note: `Invoice ${number} sent`,
        });
      }

      setState((prev) => ({
        ...prev,
        invoices: [created, ...prev.invoices],
        nextInvoiceNum: prev.nextInvoiceNum + 1,
      }));

      return created;
    },
    [state.nextInvoiceNum],
  );

  const updateInvoice = useCallback((id, patch) => {
    const normalizedPatch = { ...patch };
    if (normalizedPatch.items) {
      normalizedPatch.items = normalizedPatch.items.map((item) => ({
        ...item,
        qty: Number(item.qty || 0),
        rate: Number(item.rate || 0),
      }));
    }
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, ...normalizedPatch } : invoice,
      ),
    }));
  }, []);

  const deleteInvoice = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.filter((invoice) => invoice.id !== id),
        projects: prev.projects.map((project) => ({
          ...project,
          milestones: project.milestones.map((milestone) =>
            milestone.invoiceId === id ? { ...milestone, invoiceId: undefined } : milestone,
          ),
        })),
      }));
      toast("Invoice deleted", "warn");
    },
    [toast],
  );

  const sendInvoice = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((invoice) => {
          if (invoice.id !== id || invoice.status === "paid") {
            return invoice;
          }
          return {
            ...invoice,
            status: "pending",
            activity: [
              ...invoice.activity,
              {
                id: uid("a"),
                type: "sent",
                when: todayDate(),
                note: `Invoice ${invoice.number} sent`,
              },
            ],
          };
        }),
      }));
      toast("Invoice sent", "ok");
    },
    [toast],
  );

  const markPaid = useCallback(
    (id, payment = {}) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((invoice) => {
          if (invoice.id !== id) {
            return invoice;
          }
          return {
            ...invoice,
            status: "paid",
            paidOn: todayDate(),
            method: payment.method || "Bank transfer",
            ref: payment.ref || "",
            activity: [
              ...invoice.activity,
              {
                id: uid("a"),
                type: "paid",
                when: todayDate(),
                note: `Paid via ${payment.method || "Bank transfer"}`,
              },
            ],
          };
        }),
      }));
      toast("Invoice marked as paid", "ok");
    },
    [toast],
  );

  const sendReminder = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((invoice) => {
          if (invoice.id !== id) {
            return invoice;
          }
          return {
            ...invoice,
            activity: [
              ...invoice.activity,
              {
                id: uid("a"),
                type: "reminder",
                when: todayDate(),
                note: "Payment reminder sent",
              },
            ],
          };
        }),
      }));
      toast("Reminder sent", "info");
    },
    [toast],
  );

  const duplicateInvoice = useCallback(
    (id) => {
      const invoice = state.invoices.find((item) => item.id === id);
      if (!invoice) {
        return null;
      }
      const cloned = createInvoice({
        clientId: invoice.clientId,
        project: `${invoice.project} (Copy)`,
        issued: todayDate(),
        due: daysFromNow(14),
        status: "draft",
        items: invoice.items.map((item) => ({
          desc: item.desc,
          qty: item.qty,
          rate: item.rate,
        })),
        notes: invoice.notes,
      });
      toast(`${invoice.number} duplicated`, "info");
      return cloned;
    },
    [createInvoice, state.invoices, toast],
  );

  const updateProject = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    }));
  }, []);

  const toggleMilestone = useCallback((projectId, milestoneId) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        return {
          ...project,
          milestones: project.milestones.map((milestone) => {
            if (milestone.id !== milestoneId) {
              return milestone;
            }
            const nextStatus = milestone.status === "done" ? "in_progress" : "done";
            return { ...milestone, status: nextStatus };
          }),
        };
      }),
    }));
  }, []);

  const invoiceMilestone = useCallback(
    (projectId, milestoneId) => {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) {
        return null;
      }

      const milestone = project.milestones.find((item) => item.id === milestoneId);
      if (!milestone || milestone.status !== "done" || milestone.invoiceId) {
        return null;
      }

      const num = state.nextInvoiceNum;
      const number = `INV-${String(num).padStart(4, "0")}`;
      const id = `inv-${String(num).padStart(4, "0")}`;
      const issued = todayDate();

      const created = {
        id,
        number,
        clientId: project.clientId,
        project: `${project.name} · ${milestone.title}`,
        issued,
        due: daysFromNow(14),
        status: "pending",
        items: [
          {
            id: uid("l"),
            desc: `Milestone · ${milestone.title}`,
            qty: 1,
            rate: Number(milestone.amount || 0),
          },
        ],
        notes: `Milestone invoice generated from ${project.name}.`,
        activity: [
          {
            id: uid("a"),
            type: "created",
            when: issued,
            note: `Invoice ${number} created`,
          },
          {
            id: uid("a"),
            type: "sent",
            when: issued,
            note: `Invoice ${number} sent`,
          },
        ],
      };

      setState((prev) => ({
        ...prev,
        invoices: [created, ...prev.invoices],
        nextInvoiceNum: prev.nextInvoiceNum + 1,
        projects: prev.projects.map((item) => {
          if (item.id !== projectId) {
            return item;
          }
          return {
            ...item,
            milestones: item.milestones.map((entry) =>
              entry.id === milestoneId ? { ...entry, invoiceId: created.id } : entry,
            ),
          };
        }),
      }));

      toast(`Milestone invoiced as ${created.number}`, "ok");
      return created;
    },
    [state.nextInvoiceNum, state.projects, toast],
  );

  const createClient = useCallback(
    (draft) => {
      const palette = ["#5e6ad2", "#02b8cc", "#27a644", "#d4a017", "#eb5757"];
      const client = {
        id: `c-${Date.now()}`,
        name: draft.name || "Untitled Client",
        email: draft.email || "",
        addr: draft.addr || "",
        color: draft.color || palette[Math.floor(Math.random() * palette.length)],
      };
      setState((prev) => ({ ...prev, clients: [client, ...prev.clients] }));
      toast("Client added", "ok");
      return client;
    },
    [toast],
  );

  const updateClient = useCallback(
    (id, patch) => {
      setState((prev) => ({
        ...prev,
        clients: prev.clients.map((client) =>
          client.id === id ? { ...client, ...patch } : client,
        ),
      }));
      toast("Client updated", "info");
    },
    [toast],
  );

  const deleteClient = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        clients: prev.clients.filter((client) => client.id !== id),
        invoices: prev.invoices.map((invoice) =>
          invoice.clientId === id ? { ...invoice, clientId: null } : invoice,
        ),
      }));
      toast("Client removed. Existing invoices were unlinked.", "warn");
    },
    [toast],
  );

  const updateBusiness = useCallback(
    (patch) => {
      setState((prev) => ({
        ...prev,
        business: { ...prev.business, ...patch },
      }));
      toast("Business profile saved", "ok");
    },
    [toast],
  );

  const resetData = useCallback(() => {
    const fresh = refreshOverdue(seedState());
    window.localStorage.removeItem(STORAGE_KEY);
    setState({
      ...fresh,
      toasts: [{ id: uid("toast"), msg: "Demo data reset", variant: "warn" }],
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      getClient,
      getInvoice,
      getProject,
      invoiceTotal: invoiceTotalFn,
      invoicesByClient,
      projectsByClient,
      projectProgress,
      projectAmounts,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      sendInvoice,
      markPaid,
      sendReminder,
      duplicateInvoice,
      updateProject,
      toggleMilestone,
      invoiceMilestone,
      createClient,
      updateClient,
      deleteClient,
      updateBusiness,
      resetData,
      toast,
    }),
    [
      state,
      getClient,
      getInvoice,
      getProject,
      invoicesByClient,
      projectsByClient,
      projectProgress,
      projectAmounts,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      sendInvoice,
      markPaid,
      sendReminder,
      duplicateInvoice,
      updateProject,
      toggleMilestone,
      invoiceMilestone,
      createClient,
      updateClient,
      deleteClient,
      updateBusiness,
      resetData,
      toast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
};
