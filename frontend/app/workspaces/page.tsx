const workspaces = [
  { name: 'Beauty Launch', owner: 'Maya Lee', status: 'Active', members: 12 },
  { name: 'Creator Boost', owner: 'Aisha Reid', status: 'Review', members: 8 },
  { name: 'Product Drop', owner: 'Noah Shaw', status: 'Scheduled', members: 6 },
  { name: 'UGC Sprint', owner: 'Lena Gray', status: 'Planning', members: 4 },
];

export default function WorkspacesPage() {
  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">WORKSPACES</p>
          <h1>Manage client workspaces</h1>
        </div>
        <button className="primary">New workspace</button>
      </header>

      <div className="card-grid">
        {workspaces.map((workspace) => (
          <article key={workspace.name} className="section-card">
            <div className="section-heading">
              <h2>{workspace.name}</h2>
              <span className="status-badge">{workspace.status}</span>
            </div>
            <p className="muted">Owner: {workspace.owner}</p>
            <div className="mini-row">
              <small>{workspace.members} members</small>
              <a href="/projects" className="link-btn">Open →</a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
