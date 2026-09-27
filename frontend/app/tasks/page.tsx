const tasks = [
  { title: 'Generate product launch copy', status: 'Running', owner: 'OpenAI', time: '2m ago' },
  { title: 'Render social reel', status: 'Queued', owner: 'Runway', time: '8m ago' },
  { title: 'Schedule campaign email', status: 'Completed', owner: 'Mailing', time: '23m ago' },
  { title: 'Extract audience insights', status: 'Completed', owner: 'Research', time: '1h ago' },
];

export default function TasksPage() {
  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">TASKS</p>
          <h1>AI orchestration and execution queue</h1>
        </div>
        <button className="primary">Run orchestration</button>
      </header>

      <div className="task-list">
        {tasks.map((task) => (
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
    </main>
  );
}
