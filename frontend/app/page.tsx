const modules = [
  ['Content', 'Research, ideas, scripts, and captions'],
  ['Creative Studio', 'Write-ups, thumbnails, and scene images'],
  ['Video Maker', 'Create, render, and export videos'],
  ['Brand Brain', 'Keep every asset aligned with your brand'],
  ['Products', 'Manage your digital products'],
  ['Campaigns', 'Plan and coordinate marketing campaigns'],
];

const workspaces = [
  { name: 'Beauty Launch', members: 12, status: 'Active', progress: 78 },
  { name: 'Creator Boost', members: 8, status: 'Review', progress: 52 },
  { name: 'Product Drop', members: 6, status: 'Scheduled', progress: 64 },
];

const recentTasks = [
  { title: 'Generate 3 launch captions', owner: 'AI Orchestrator', time: '2 min ago', status: 'Running' },
  { title: 'Render hero reel', owner: 'Video Pipeline', time: '12 min ago', status: 'Queued' },
  { title: 'Create campaign brief', owner: 'Brand Brain', time: '31 min ago', status: 'Completed' },
];

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">zapcart <span>agent</span></div>
        <nav className="nav-links">
          {['Dashboard', 'Content', 'Creative Studio', 'Video Maker', 'Brand Brain', 'Products', 'Campaigns', 'Calendar', 'Publishing', 'Analytics'].map((item, index) => (
            <a className={index === 0 ? 'active' : ''} href={index === 0 ? '/' : '#'} key={item}>{item}</a>
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

        <div className="section-blocks">
          <div className="section-card wide">
            <div className="section-heading">
              <h2>Workspace modules</h2>
              <a href="/workspaces" className="link-btn">View all →</a>
            </div>
            <div className="grid">
              {modules.map(([title, description]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a href="#">Open module →</a>
                </article>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-heading">
              <h2>Workspaces</h2>
              <a href="/workspaces" className="link-btn">Manage →</a>
            </div>
            <div className="workspace-list">
              {workspaces.map((workspace) => (
                <div key={workspace.name} className="mini-card">
                  <div className="mini-row">
                    <strong>{workspace.name}</strong>
                    <span className="status-badge">{workspace.status}</span>
                  </div>
                  <small>{workspace.members} members</small>
                  <div className="progress-bar">
                    <span style={{ width: `${workspace.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-card full-width">
          <div className="section-heading">
            <h2>Recent orchestration tasks</h2>
            <a href="/tasks" className="link-btn">See all tasks →</a>
          </div>

          <div className="task-list">
            {recentTasks.map((task) => (
              <div key={task.title} className="task-row">
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.owner}</small>
                </div>
                <span className="time-label">{task.time}</span>
                <span className={task.status === 'Completed' ? 'status-badge success' : task.status === 'Running' ? 'status-badge warning' : 'status-badge info'}>{task.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
