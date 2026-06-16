/* ============================================================
   landing.jsx — marketing landing page (shown before login)
   ============================================================ */
function LandingScreen({ onStart }) {
  const features = [
    { icon: "invoice", title: "Smart invoices", desc: "Create, send and track invoices with a live preview and one-click PDF export." },
    { icon: "project", title: "Projects & milestones", desc: "Break work into milestones and generate invoices the moment one is done." },
    { icon: "client", title: "Client management", desc: "Keep clients, billing details and notes in one place — grid or list view." },
    { icon: "sparkle", title: "Reusable services", desc: "Build a service catalog once, pull line items into any invoice instantly." },
    { icon: "globe", title: "Multi-currency", desc: "Bill in USD, EUR, GBP, BDT and more, with custom payment methods." },
    { icon: "shield", title: "Secure sign-in", desc: "Google login via Firebase. Your data is scoped privately to your account." },
  ];
  const stats = [
    { v: "8", l: "Currencies" },
    { v: "1-click", l: "PDF export" },
    { v: "0", l: "Setup steps" },
  ];

  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-brand">
          <div className="logo">M</div>
          <div className="name">MyDesk <span>· Invoicing</span></div>
        </div>
        <div className="row gap-8">
          <button className="btn ghost" onClick={onStart}>Sign in</button>
          <button className="btn violet" onClick={onStart}>Get started</button>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-badge"><Icon name="zap" size={13} /> Invoicing for freelancers & small studios</span>
          <h1 className="lp-h1">Get paid faster.<br />Run your studio<br /> from one desk.</h1>
          <p className="lp-lead">Create, send and track invoices, manage clients, projects and services — with multi-currency billing and secure Google sign-in. No spreadsheets, no clutter.</p>
          <div className="row gap-12 wrap">
            <button className="btn violet lp-cta-btn" onClick={onStart}><Icon name="arrow" size={15} /> Start free</button>
            <button className="btn ghost lp-cta-btn" onClick={onStart}>Continue as guest</button>
          </div>
          <div className="lp-stats">
            {stats.map((s, i) => (<div key={i} className="lp-stat"><div className="lp-stat-v">{s.v}</div><div className="lp-stat-l">{s.l}</div></div>))}
          </div>
        </div>

        <div className="lp-hero-art" aria-hidden="true">
          <div className="lp-art-card lp-art-main">
            <div className="spread mb-16"><span className="muted small">Total earned</span><span className="pill paid">paid</span></div>
            <div className="lp-art-big mono">$24,800</div>
            <div className="lp-art-bars">
              {[40, 65, 50, 80, 60, 95].map((h, i) => (<span key={i} style={{ height: h + "%" }} />))}
            </div>
          </div>
          <div className="lp-art-card lp-art-float">
            <div className="row gap-8 mb-8"><span className="avatar" style={{ background: "#5e6ad2", width: 22, height: 22, fontSize: 10 }}>AC</span><span className="semibold small">Acme Co.</span></div>
            <div className="spread"><span className="muted tiny mono">INV-0142</span><span className="mono small">$3,300</span></div>
          </div>
          <div className="lp-art-card lp-art-float2">
            <div className="row gap-8"><span className="tl-dot paid" /><span className="small">Payment received</span></div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-sec-head">
          <h2>Everything you need to bill clients</h2>
          <p className="muted">From first quote to paid invoice — without leaving the app.</p>
        </div>
        <div className="lp-features">
          {features.map((f, i) => (
            <div key={i} className="lp-feature">
              <div className="lp-feat-icon"><Icon name={f.icon} size={18} /></div>
              <div className="semibold">{f.title}</div>
              <div className="muted small">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-final">
          <h2>Start invoicing in seconds</h2>
          <p className="muted">No credit card. Try it as a guest or sign in with Google.</p>
          <button className="btn violet lp-cta-btn" onClick={onStart}><Icon name="arrow" size={15} /> Get started</button>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-brand"><div className="logo">M</div><div className="name">MyDesk <span>· Invoicing</span></div></div>
        <span className="muted tiny">© {new Date().getFullYear()} MyDesk · Invoicing — demo app.</span>
      </footer>
    </div>
  );
}
window.LandingScreen = LandingScreen;
