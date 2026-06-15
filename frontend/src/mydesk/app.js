import React, { useEffect, useMemo, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { Sidebar, ToastLayer, Topbar } from "./ui";
import { DashboardScreen } from "./screens/dashboard";
import { InvoicesScreen } from "./screens/invoices";
import { InvoiceDetailScreen } from "./screens/invoice-detail";
import { InvoiceEditorScreen } from "./screens/invoice-editor";
import { ClientsScreen } from "./screens/clients";
import { ProjectsScreen, ProjectDetailScreen } from "./screens/projects";
import { SettingsScreen } from "./screens/settings";

const parseHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) {
    return { route: "dashboard", id: null };
  }

  const [path] = hash.split("?");
  const [routeName, id] = path.split("/");

  if (routeName === "invoice-detail") {
    return { route: "invoice-detail", id: id || null };
  }
  if (routeName === "editor") {
    return { route: "editor", id: id || null };
  }
  if (routeName === "project-detail") {
    return { route: "project-detail", id: id || null };
  }
  if (["dashboard", "invoices", "projects", "clients", "settings"].includes(routeName)) {
    return { route: routeName, id: null };
  }
  return { route: "dashboard", id: null };
};

const buildHash = (name, payload = {}) => {
  if (name === "invoice-detail" && payload.id) {
    return `#/invoice-detail/${payload.id}`;
  }
  if (name === "editor" && payload.id) {
    return `#/editor/${payload.id}`;
  }
  if (name === "project-detail" && payload.id) {
    return `#/project-detail/${payload.id}`;
  }
  return `#/${name}`;
};

const appRouteName = (route) => {
  if (route === "invoice-detail" || route === "editor") {
    return "invoices";
  }
  if (route === "project-detail") {
    return "projects";
  }
  return route;
};

const Shell = () => {
  const [location, setLocation] = useState(parseHash());
  const [search, setSearch] = useState("");
  const store = useStore();

  useEffect(() => {
    const onHash = () => setLocation(parseHash());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) {
      window.location.hash = "#/dashboard";
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const onNav = (name, payload = {}) => {
    if (name === "editor" && payload.clientId) {
      window.location.hash = buildHash("editor", payload);
      window.sessionStorage.setItem("mydesk_prefill_client", payload.clientId);
      return;
    }
    window.location.hash = buildHash(name, payload);
  };

  const crumbs = useMemo(() => {
    if (location.route === "invoice-detail") {
      const invoice = store.getInvoice(location.id);
      return [
        { label: "Invoices", clickable: true, onClick: () => onNav("invoices") },
        { label: invoice?.number || "Detail", clickable: false },
      ];
    }
    if (location.route === "editor") {
      const invoice = location.id ? store.getInvoice(location.id) : null;
      return [
        { label: "Invoices", clickable: true, onClick: () => onNav("invoices") },
        { label: invoice ? `Edit ${invoice.number}` : "New invoice", clickable: false },
      ];
    }
    if (location.route === "project-detail") {
      const project = store.getProject(location.id);
      return [
        { label: "Projects", clickable: true, onClick: () => onNav("projects") },
        { label: project?.name || "Detail", clickable: false },
      ];
    }

    const map = {
      dashboard: "Dashboard",
      invoices: "Invoices",
      projects: "Projects",
      clients: "Clients",
      settings: "Settings",
    };
    return [{ label: map[location.route] || "Dashboard", clickable: false }];
  }, [location.id, location.route, store]);

  const screenProps = { onNav, search };

  let content = <DashboardScreen {...screenProps} />;
  if (location.route === "invoices") {
    content = <InvoicesScreen {...screenProps} />;
  }
  if (location.route === "invoice-detail") {
    content = <InvoiceDetailScreen id={location.id} onNav={onNav} />;
  }
  if (location.route === "editor") {
    content = <InvoiceEditorScreen id={location.id} onNav={onNav} />;
  }
  if (location.route === "projects") {
    content = <ProjectsScreen {...screenProps} />;
  }
  if (location.route === "project-detail") {
    content = <ProjectDetailScreen id={location.id} onNav={onNav} />;
  }
  if (location.route === "clients") {
    content = <ClientsScreen {...screenProps} />;
  }
  if (location.route === "settings") {
    content = <SettingsScreen />;
  }

  return (
    <div className="mydesk-app" data-testid="mydesk-root">
      <Sidebar
        route={appRouteName(location.route)}
        onNav={onNav}
        counts={{
          invoices: store.invoices.length,
          projects: store.projects.length,
          clients: store.clients.length,
        }}
      />

      <div className="main-shell">
        <Topbar crumbs={crumbs} search={search} onSearch={setSearch} />
        <main className="main-content" data-testid="main-content-container">
          {content}
        </main>
      </div>

      <ToastLayer />
    </div>
  );
};

export const MyDeskApp = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);
