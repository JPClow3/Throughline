import { useTasks } from "../hooks/useTasks";
import { useMemo } from "react";
import { ChartLineUp, Target } from "@phosphor-icons/react";
import { ViewSkeleton } from "../components/Skeleton";

export function InsightsView() {
  const { tasks, courses } = useTasks();

  const stats = useMemo(() => {
    if (!tasks || !courses) return null;
    
    const completed = tasks.filter(t => t.status === "done" && t.completedAt);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let last7Days = 0;
    let previous7Days = 0;
    const projectCounts: Record<string, number> = {};

    // Heatmap data (last 28 days)
    const heatmap: Record<string, number> = {};
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      heatmap[d.toISOString().split("T")[0]] = 0;
    }

    for (const task of completed) {
      if (!task.completedAt) continue;
      const date = new Date(task.completedAt);
      const dateStr = date.toISOString().split("T")[0];

      if (heatmap[dateStr] !== undefined) {
        heatmap[dateStr]++;
      }

      if (date >= sevenDaysAgo) {
        last7Days++;
      } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
        previous7Days++;
      }

      if (task.courseId) {
        projectCounts[task.courseId] = (projectCounts[task.courseId] || 0) + 1;
      }
    }

    const topProjects = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => {
        const course = courses.find(c => c.id === id);
        return { course, count };
      })
      .filter(p => p.course);

    return { completedCount: completed.length, last7Days, previous7Days, topProjects, heatmap };
  }, [tasks, courses]);

  if (!stats) return (
    <div className="view-layout">
      <ViewSkeleton />
    </div>
  );

  const trend = stats.last7Days - stats.previous7Days;

  return (
    <div className="view-layout">
      <header className="view-head">
        <h2 style={{ fontSize: "var(--text-page)", fontWeight: 300 }}>Insights</h2>
        <p style={{ color: "var(--ink-muted)", marginTop: "0.5rem" }}>Your productivity trends and stats.</p>
      </header>
      <div className="view-content" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted)", marginBottom: "0.5rem", fontWeight: "var(--fw-medium)" }}>
              <Target size={20} />
              <span>Total Completed</span>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "var(--fw-bold)", color: "var(--ink)" }}>{stats.completedCount}</div>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted)", marginBottom: "0.5rem", fontWeight: "var(--fw-medium)" }}>
              <ChartLineUp size={20} />
              <span>Last 7 Days</span>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "var(--fw-bold)", color: "var(--ink)", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              {stats.last7Days}
              <span style={{ fontSize: "1rem", color: trend >= 0 ? "var(--success)" : "var(--ink-muted)", fontWeight: "var(--fw-medium)" }}>
                {trend >= 0 ? "+" : ""}{trend}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: "1rem", fontSize: "var(--text-section)" }}>Activity Heatmap (Last 28 Days)</h3>
          <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {Object.entries(stats.heatmap).map(([date, count]) => {
                const intensity = Math.min(count / 5, 1);
                return (
                  <div
                    key={date}
                    title={`${date}: ${count} tasks`}
                    style={{
                      flexShrink: 0,
                      width: "14px",
                      height: "40px",
                      borderRadius: "3px",
                      backgroundColor: count > 0 ? "var(--success)" : "var(--border)",
                      opacity: count > 0 ? 0.3 + (intensity * 0.7) : 0.5,
                      transition: "opacity 0.2s"
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {stats.topProjects.length > 0 && (
          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "var(--text-section)" }}>Top Projects</h3>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats.topProjects.map(({ course, count }) => (
                <div key={course!.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: course!.color }} />
                    <span style={{ fontWeight: "var(--fw-medium)", color: "var(--ink)" }}>{course!.name}</span>
                  </div>
                  <span style={{ color: "var(--ink-muted)", fontWeight: "var(--fw-medium)" }}>{count} tasks</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
