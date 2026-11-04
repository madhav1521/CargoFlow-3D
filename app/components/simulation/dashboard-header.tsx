import Icon from "../svg-icon";

export default function DashboardHeader() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Cargo Studio home">
          <span className="brand-mark">C</span>
          <span className="brand-name">CARGO<span>STUDIO</span></span>
        </a>
        <div className="topbar-meta">
          <span className="topbar-status"><i /> SIMULATION ONLINE</span>
          <span className="topbar-divider" />
          <span className="topbar-model">
            MODEL 001 <b>·</b> LOADING BAY
          </span>
        </div>
      </header>

      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow"><span>01</span> &nbsp; LOGISTICS SIMULATOR</p>
          <h1>Make every move <em>count.</em></h1>
          <p>
            A live look at the people, parcels, and process behind a perfectly
            packed load.
          </p>
        </div>
        <div className="intro-note">
          <Icon name="worker" />
          <span>WAREHOUSE FLOOR<br /><b>SHIFT A · ACTIVE</b></span>
        </div>
      </section>
    </>
  );
}
