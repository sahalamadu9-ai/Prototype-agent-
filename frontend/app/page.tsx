const modules = [
  ['Content', 'Research, ideas, scripts, and captions'],
  ['Creative Studio', 'Write-ups, thumbnails, and scene images'],
  ['Video Maker', 'Create, render, and export videos'],
  ['Brand Brain', 'Keep every asset aligned with your brand'],
  ['Products', 'Manage your digital products'],
  ['Campaigns', 'Plan and coordinate marketing campaigns'],
];

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">zapcart <span>agent</span></div>
        <nav>
          {['Dashboard', 'Content', 'Creative Studio', 'Video Maker', 'Brand Brain', 'Products', 'Campaigns', 'Calendar', 'Publishing', 'Analytics'].map((item, index) => (
            <a className={index === 0 ? 'active' : ''} href="#" key={item}>{item}</a>
          ))}
        </nav>
      </aside>
      <section className="content">
        <header className="header">
          <div>
            <p className="eyebrow">WORKSPACE OVERVIEW</p>
            <h1>Good morning, creator.</h1>
            <p className="muted">Build, manage, and publish your next campaign from one workspace.</p>
          </div>
          <button className="primary">Ask AI Orchestrator</button>
        </header>
        <div className="stats">
          <div><span>Draft content</span><strong>12</strong></div>
          <div><span>Scheduled posts</span><strong>08</strong></div>
          <div><span>Active campaigns</span><strong>04</strong></div>
          <div><span>Audience reach</span><strong>24.8K</strong></div>
        </div>
        <h2>Workspace modules</h2>
        <div className="grid">
          {modules.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p><a href="#">Open module →</a></article>)}
        </div>
      </section>
    </main>
  );
}
