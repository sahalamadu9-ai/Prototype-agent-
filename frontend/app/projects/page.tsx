const projects = [
  { name: 'Launch Content Kit', status: 'In Review', owner: 'Brand Team', progress: 72 },
  { name: 'Ingredient Story', status: 'Draft', owner: 'Copy Team', progress: 46 },
  { name: 'New Reel Campaign', status: 'Queued', owner: 'Video Team', progress: 58 },
  { name: 'UGC Collection', status: 'Ready', owner: 'Creator Team', progress: 88 },
];

export default function ProjectsPage() {
  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h1>Campaign and content projects</h1>
        </div>
        <button className="primary">New project</button>
      </header>

      <div className="project-list">
        {projects.map((project) => (
          <div key={project.name} className="project-row">
            <div>
              <strong>{project.name}</strong>
              <small>{project.owner}</small>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${project.progress}%` }} />
            </div>
            <span className={project.status === 'Ready' ? 'status-badge success' : project.status === 'In Review' ? 'status-badge warning' : 'status-badge info'}>{project.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
