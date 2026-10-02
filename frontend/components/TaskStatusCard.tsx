'use client';

type TaskStatusCardProps = {
  taskId: string;
  status: string;
  progress: number;
  output?: any;
};

export default function TaskStatusCard({ taskId, status, progress, output }: TaskStatusCardProps) {
  return (
    <div className="section-card" style={{ display: 'grid', gap: 12 }}>
      <div className="section-heading">
        <h2>Task status</h2>
        <span
          className={
            status === 'completed'
              ? 'status-badge success'
              : status === 'running' || status === 'executing'
                ? 'status-badge warning'
                : status === 'awaiting_approval'
                  ? 'status-badge info'
                  : 'status-badge'
          }
        >
          {status}
        </span>
      </div>

      <div className="mini-card">
        <small>Task ID</small>
        <div style={{ marginTop: 6, fontWeight: 700 }}>{taskId}</div>
      </div>

      <div>
        <small>Progress</small>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <span style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      {output ? (
        <pre
          style={{
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 14,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(output, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
