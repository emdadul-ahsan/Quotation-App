import React, { useRef, useState } from "react";
import { useStore } from "../store";
import { Icon, Modal } from "../ui";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

export const SettingsScreen = () => {
  const store = useStore();
  const [form, setForm] = useState({ ...store.business });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef(null);

  const save = () => {
    store.updateBusiness(form);
  };

  const pickLogo = () => fileRef.current?.click();

  const onLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      store.toast("Logo must be 1.5MB or smaller", "warn");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setForm((prev) => ({ ...prev, logo: value }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="page" data-testid="settings-screen">
      <div className="page-head" data-testid="settings-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="muted">Business profile and local demo controls.</p>
        </div>
      </div>

      <div className="grid settings-grid" data-testid="settings-grid">
        <article className="card" data-testid="business-info-card">
          <h2>Business info</h2>
          <div className="logo-row" data-testid="business-logo-row">
            {form.logo ? (
              <img src={form.logo} alt="Business logo" className="logo-preview" data-testid="business-logo-preview" />
            ) : (
              <div className="logo-fallback" data-testid="business-logo-fallback">
                <Icon name="receipt" size={18} />
              </div>
            )}
            <div className="row gap-8">
              <button className="btn ghost" onClick={pickLogo} data-testid="business-logo-upload-button">
                {form.logo ? "Replace logo" : "Upload logo"}
              </button>
              {form.logo && (
                <button
                  className="btn danger"
                  onClick={() => setForm((prev) => ({ ...prev, logo: "" }))}
                  data-testid="business-logo-remove-button"
                >
                  Remove
                </button>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                ref={fileRef}
                className="hidden"
                onChange={onLogoChange}
                data-testid="business-logo-file-input"
              />
            </div>
          </div>

          <div className="grid grid-2">
            <label className="field" data-testid="business-name-field">
              <span className="tiny muted">Name</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                data-testid="business-name-input"
              />
            </label>

            <label className="field" data-testid="business-email-field">
              <span className="tiny muted">Email</span>
              <input
                className="input"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                data-testid="business-email-input"
              />
            </label>

            <label className="field" data-testid="business-phone-field">
              <span className="tiny muted">Phone</span>
              <input
                className="input"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                data-testid="business-phone-input"
              />
            </label>

            <label className="field" data-testid="business-address-field">
              <span className="tiny muted">Address</span>
              <input
                className="input"
                value={form.addr}
                onChange={(event) => setForm((prev) => ({ ...prev, addr: event.target.value }))}
                data-testid="business-address-input"
              />
            </label>
          </div>

          <div className="row-end">
            <button className="btn violet" onClick={save} data-testid="business-save-button">
              Save business profile
            </button>
          </div>
        </article>

        <article className="card" data-testid="demo-data-card">
          <h2>Demo data</h2>
          <p className="small muted" data-testid="demo-data-description">
            Your data is stored locally in this browser under key <code>mydesk_invoicing_v1</code>.
          </p>
          <button className="btn danger" onClick={() => setShowResetConfirm(true)} data-testid="demo-data-reset-button">
            Reset demo data
          </button>
        </article>
      </div>

      {showResetConfirm && (
        <Modal
          title="Reset demo data?"
          desc="This clears current local data and restores seeded records."
          onClose={() => setShowResetConfirm(false)}
          testId="reset-demo-modal"
          footer={
            <>
              <button className="btn ghost" onClick={() => setShowResetConfirm(false)} data-testid="reset-demo-cancel-button">
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  store.resetData();
                  setShowResetConfirm(false);
                }}
                data-testid="reset-demo-confirm-button"
              >
                Reset now
              </button>
            </>
          }
        >
          <p className="small muted" data-testid="reset-demo-modal-copy">
            You will lose all edits made in this browser.
          </p>
        </Modal>
      )}
    </section>
  );
};
