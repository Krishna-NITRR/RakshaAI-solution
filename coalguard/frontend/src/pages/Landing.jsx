import { ArrowRight, Camera, CheckCircle2, ChevronRight, CircleAlert, FileCheck2, Gauge, HardHat, Map, Radio, ShieldCheck } from 'lucide-react';

const capabilities = [
  { icon: Radio, eyebrow: '01 / SENSE', title: 'Live mine telemetry', text: 'Watch methane, CO, bearing heat, vibration, and dust move in one operational stream.', href: '/telemetry', tone: 'amber' },
  { icon: Gauge, eyebrow: '02 / PREDICT', title: 'Predictive maintenance', text: 'Turn equipment stress into a health index, remaining useful life, and actionable work.', href: '/telemetry', tone: 'cyan' },
  { icon: Camera, eyebrow: '03 / PROTECT', title: 'Khaan Netra vision', text: 'Run edge PPE checks at the gate and route denied scans into the safety workflow.', href: '/khaan-netra/index.html', tone: 'red' },
  { icon: FileCheck2, eyebrow: '04 / PROVE', title: 'DGMS-ready evidence', text: 'Assemble incident evidence, statutory previews, and signed demo reports in seconds.', href: '/compliance', tone: 'green' },
];

const workflow = [
  ['01', 'Observe', 'A live signal moves outside its normal operating band.'],
  ['02', 'Explain', 'RCA maps the anomaly to equipment impact and regulation.'],
  ['03', 'Act', 'A ticket is created and routed to the workforce queue.'],
  ['04', 'Verify', 'Compliance evidence and field inspections close the loop.'],
];

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Primary navigation">
        <a className="landing-brand" href="/" aria-label="RakshaAI home">
          <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.4} /></span>
          <span>RAKSHA<span className="brand-accent">AI</span></span>
        </a>
        <div className="landing-nav-links">
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <a href="#modules">Modules</a>
        </div>
        <a className="landing-nav-cta" href="/login">Open command center <ArrowRight size={16} /></a>
      </nav>

      <main>
        <section className="landing-hero" id="platform">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-pulse" /> MINE SAFETY / INTELLIGENCE PLATFORM</div>
            <h1>See risk before it becomes <em>an incident.</em></h1>
            <p className="hero-lede">RakshaAI brings underground telemetry, predictive maintenance, computer vision, and statutory evidence into one decisive operating picture.</p>
            <div className="hero-actions">
              <a className="landing-button landing-button-primary" href="/telemetry">Enter live operations <ArrowRight size={17} /></a>
              <a className="landing-button landing-button-quiet" href="#modules">Explore the platform <ChevronRight size={17} /></a>
            </div>
            <div className="hero-proof"><CheckCircle2 size={16} /> Offline-capable demo stack <span /> <CheckCircle2 size={16} /> Built for the mine floor</div>
          </div>
          <div className="hero-console" aria-label="Live operations preview">
            <div className="console-topline"><span><span className="live-dot" /> LIVE / GALLERY B</span><span>20 SEP 2026 · 16:52</span></div>
            <div className="console-title"><div><span className="console-kicker">ASSET HEALTH MONITOR</span><strong>Conveyor 07</strong></div><span className="console-status">WATCH</span></div>
            <div className="console-chart"><div className="chart-labels"><span>BEARING °C</span><strong>54.8</strong></div><svg viewBox="0 0 440 150" preserveAspectRatio="none" role="img" aria-label="Sensor trend preview"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f6ad55" stopOpacity=".28" /><stop offset="1" stopColor="#f6ad55" stopOpacity="0" /></linearGradient></defs><path d="M0 120 C30 118 39 94 65 102 S105 111 126 84 S160 93 184 70 S218 76 244 88 S274 112 299 82 S333 97 357 50 S385 64 410 40 S428 45 440 22 V150 H0Z" fill="url(#chartFill)" /><path d="M0 120 C30 118 39 94 65 102 S105 111 126 84 S160 93 184 70 S218 76 244 88 S274 112 299 82 S333 97 357 50 S385 64 410 40 S428 45 440 22" fill="none" stroke="#f6ad55" strokeWidth="3" /></svg><div className="chart-axis"><span>16:24</span><span>16:36</span><span>16:48</span></div></div>
            <div className="console-metrics"><div><span>METHANE</span><strong>0.42 <small>%</small></strong></div><div><span>VIBRATION</span><strong>2.2 <small>mm/s</small></strong></div><div><span>HEALTH INDEX</span><strong className="metric-green">86.4<small>%</small></strong></div></div>
            <div className="console-alert"><CircleAlert size={16} /><span>Predictive layer ready · 618 hours estimated RUL</span><ChevronRight size={16} /></div>
          </div>
          <div className="hero-scroll">SCROLL TO EXPLORE <span /></div>
        </section>

        <section className="landing-strip" aria-label="Platform summary">
          <div><strong>01</strong><span>Unified source of truth</span></div><div><strong>24/7</strong><span>Edge-ready monitoring</span></div><div><strong>CMR</strong><span>Evidence with context</span></div><div><strong>0 → 1</strong><span>Signal to corrective action</span></div>
        </section>

        <section className="landing-section modules-section" id="modules">
          <div className="section-heading"><div><span className="section-index">THE OPERATING PICTURE</span><h2>One platform.<br /><em>Every critical signal.</em></h2></div><p>From the sensor layer to the compliance file, RakshaAI keeps safety teams close to the facts and faster to the response.</p></div>
          <div className="capability-grid">{capabilities.map(({ icon: Icon, eyebrow, title, text, href, tone }) => <a className={`capability-card capability-${tone}`} href={href} key={title}><div className="capability-icon"><Icon size={21} /></div><span className="card-eyebrow">{eyebrow}</span><h3>{title}</h3><p>{text}</p><span className="card-link">Open module <ArrowRight size={15} /></span></a>)}</div>
        </section>

        <section className="landing-section workflow-section" id="workflow">
          <div className="workflow-intro"><span className="section-index">THE SAFETY LOOP</span><h2>From signal<br />to <em>certainty.</em></h2><p>Every alert has a next step. Every action leaves evidence.</p><a className="text-link" href="/safety-intelligence">See the intelligence layer <ArrowRight size={16} /></a></div>
          <div className="workflow-list">{workflow.map(([number, title, text]) => <div className="workflow-step" key={number}><span className="workflow-number">{number}</span><div><h3>{title}</h3><p>{text}</p></div><ChevronRight size={18} /></div>)}</div>
        </section>

        <section className="landing-section twin-callout"><div className="twin-callout-copy"><span className="section-index">SPATIAL CONTEXT</span><h2>Know what is happening<br /><em>where it matters.</em></h2><p>See galleries, assets, workers, and risk states on a living digital twin of the mine.</p><a className="landing-button landing-button-light" href="/digital-twin">Open digital twin <Map size={16} /></a></div><div className="mini-map" aria-label="Digital twin preview"><div className="mini-gallery mini-gallery-one"><span>GALLERY B</span></div><div className="mini-gallery mini-gallery-two"><span>LONGWALL 3</span></div><div className="mini-node mini-node-green"><span /><b>CONVEYOR 07</b></div><div className="mini-node mini-node-red"><span /><b>SHEARER 02</b></div><div className="mini-worker"><HardHat size={14} /><span>W-104</span></div></div></section>

        <section className="landing-cta"><div><span className="section-index">READY WHEN YOU ARE</span><h2>Put the whole mine<br /><em>in the room.</em></h2></div><div><p>Start with the live operations view, trigger a demo event, and follow the evidence trail from risk to resolution.</p><a className="landing-button landing-button-primary" href="/login">Open RakshaAI <ArrowRight size={17} /></a></div></section>
      </main>

      <footer className="landing-footer"><a className="landing-brand" href="/"><span className="brand-mark"><ShieldCheck size={17} /></span><span>RAKSHA<span className="brand-accent">AI</span></span></a><span>Mining safety intelligence, built for the moments that matter.</span><div><a href="/login">Command center</a><a href="/compliance">Compliance</a><a href="/inspect">Field inspection</a></div><small>© 2026 RakshaAI · Demo environment</small></footer>
    </div>
  );
}