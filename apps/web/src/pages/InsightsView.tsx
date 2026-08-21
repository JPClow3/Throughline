import { useMemo, type CSSProperties, type ReactNode } from "react";
import { Books, ChartLineUp, Clock, Target, WarningCircle } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { deriveCoachingInsights } from "@throughline/domain";
import { ViewSkeleton } from "../components/Skeleton";
import { useFocusSessions } from "../hooks/useFocusSessions";
import { useTasks } from "../hooks/useTasks";

export function InsightsView() {
  const { tasks, courses } = useTasks();
  const { focusSessions } = useFocusSessions();

  const stats = useMemo(() => {
    if (!tasks || !courses) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const completed = tasks.filter((task) => task.status === "done" && task.completedAt);
    const projectCounts: Record<string, number> = {};
    const heatmap: Record<string, number> = {};
    let last7Days = 0;
    let previous7Days = 0;

    const weeklyFocusData = [];
    const dailyFocusHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      const shortDay = date.toLocaleDateString(undefined, { weekday: 'short' });
      weeklyFocusData.push({
        date: shortDay,
        fullDate: dateKey,
        completed: 0
      });
      dailyFocusHistory.push({
        date: shortDay,
        fullDate: dateKey,
        focusHours: 0
      });
    }

    const weeklyFocusHistory = [];
    for (let i = 3; i >= 0; i--) {
      // Start of the week is 6 days ago relative to the end of that week
      const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000);
      const shortDate = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeklyFocusHistory.push({
        weekLabel: `Wk ${shortDate}`,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: new Date(now.getTime() - (i * 7) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        focusHours: 0
      });
    }

    for (let i = 27; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      heatmap[date.toISOString().split("T")[0]] = 0;
    }

    for (const task of completed) {
      if (!task.completedAt) continue;
      const completedAt = new Date(task.completedAt);
      const dateKey = completedAt.toISOString().split("T")[0];

      if (heatmap[dateKey] !== undefined) {
        heatmap[dateKey]++;
      }

      const chartMatch = weeklyFocusData.find(d => d.fullDate === dateKey);
      if (chartMatch) {
        chartMatch.completed++;
      }

      if (completedAt >= sevenDaysAgo) {
        last7Days++;
      } else if (completedAt >= fourteenDaysAgo) {
        previous7Days++;
      }

      if (task.courseId) {
        projectCounts[task.courseId] = (projectCounts[task.courseId] || 0) + 1;
      }
    }

    for (const session of focusSessions) {
      const sessionDate = new Date(session.startedAt || now.toISOString());
      const dateKey = sessionDate.toISOString().split("T")[0];

      // daily
      const dailyMatch = dailyFocusHistory.find(d => d.fullDate === dateKey);
      if (dailyMatch) {
        dailyMatch.focusHours += session.durationMinutes / 60;
      }

      // weekly
      const weeklyMatch = weeklyFocusHistory.find(w => dateKey >= w.startDate && dateKey <= w.endDate);
      if (weeklyMatch) {
        weeklyMatch.focusHours += session.durationMinutes / 60;
      }
    }

    dailyFocusHistory.forEach(d => { d.focusHours = Number(d.focusHours.toFixed(1)); });
    weeklyFocusHistory.forEach(w => { w.focusHours = Number(w.focusHours.toFixed(1)); });

    const topProjects = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ course: courses.find((course) => course.id === id), count }))
      .filter((item) => item.course);

    const overdueCount = tasks.filter((task) => {
      if (!task.dueAt || task.status === "done") return false;
      return new Date(task.dueAt) < startOfToday;
    }).length;

    const activeCourses = new Set(tasks.filter((task) => task.status !== "done" && task.courseId).map((task) => task.courseId)).size;
    const focusMinutes = focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const coaching = deriveCoachingInsights({ tasks, courses, focusSessions });

    return {
      activeCourses,
      coaching,
      completedCount: completed.length,
      focusMinutes,
      heatmap,
      weeklyFocusData,
      dailyFocusHistory,
      weeklyFocusHistory,
      last7Days,
      overdueCount,
      previous7Days,
      topProjects
    };
  }, [tasks, courses, focusSessions]);

  if (!stats) {
    return (
      <div className="view-layout">
        <ViewSkeleton />
      </div>
    );
  }

  const trend = stats.last7Days - stats.previous7Days;
  const focusHours = Math.floor(stats.focusMinutes / 60);
  const focusRemainder = stats.focusMinutes % 60;

  return (
    <div className="view-layout insights-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Coaching</span>
          <h1>Insights</h1>
          <p className="view-head-sub">Signals from your tasks, courses, and focus sessions.</p>
        </div>
      </header>

      <section className="insights-coaching clay-panel" aria-labelledby="insights-coaching-title">
        <div>
          <span className="eyebrow">What to adjust this week</span>
          <h2 id="insights-coaching-title">Keep pressure visible before it turns noisy.</h2>
        </div>
        <div className="insights-coaching-grid">
          {stats.coaching.length ? (
            stats.coaching.map((insight) => (
              <article key={insight.id} className={`coaching-card coaching-card-${insight.tone}`}>
                <strong>{insight.message}</strong>
                <p>{insight.detail}</p>
              </article>
            ))
          ) : (
            <article className="coaching-card coaching-card-steady">
              <strong>Your workload looks balanced.</strong>
              <p>Keep reviewing upcoming due dates and start the next small task before it becomes urgent.</p>
            </article>
          )}
        </div>
      </section>

      <section className="insights-stat-grid" aria-label="Planner signals">
        <InsightStat icon={<Target size={20} />} label="Completed" value={stats.completedCount.toString()} detail="All-time finished tasks" />
        <InsightStat
          icon={<ChartLineUp size={20} />}
          label="Last 7 days"
          value={stats.last7Days.toString()}
          detail={`${trend >= 0 ? "+" : ""}${trend} versus prior week`}
          tone={trend >= 0 ? "good" : "quiet"}
        />
        <InsightStat icon={<WarningCircle size={20} />} label="Overdue" value={stats.overdueCount.toString()} detail="Open tasks past due" tone={stats.overdueCount ? "warn" : "good"} />
        <InsightStat icon={<Clock size={20} />} label="Focus time" value={`${focusHours}h ${focusRemainder}m`} detail="Logged study sessions" />
        <InsightStat icon={<Books size={20} />} label="Active courses" value={stats.activeCourses.toString()} detail="Courses with open work" />
      </section>

      <section className="insights-grid">
        <article className="clay-panel insights-module" style={{ gridColumn: "1 / -1", display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div className="insights-module-head">
              <div>
                <span className="eyebrow">Focus Logs</span>
                <h2>Focus Hours (Last 7 Days)</h2>
              </div>
            </div>
            <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyFocusHistory}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--ink)' }}
                  />
                  <Bar dataKey="focusHours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div className="insights-module-head">
              <div>
                <span className="eyebrow">Focus Trends</span>
                <h2>Focus Hours (Last 4 Weeks)</h2>
              </div>
            </div>
            <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyFocusHistory}>
                  <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--ink)' }}
                  />
                  <Bar dataKey="focusHours" fill="var(--color-primary, var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        <article className="clay-panel insights-module">
          <div className="insights-module-head">
            <div>
              <span className="eyebrow">Weekly Focus</span>
              <h2>Completions (Last 7 Days)</h2>
            </div>
          </div>
          <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyFocusData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--ink)' }}
                />
                <Bar dataKey="completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="clay-panel insights-module">
          <div className="insights-module-head">
            <div>
              <span className="eyebrow">Rhythm</span>
              <h2>Activity, last 28 days</h2>
            </div>
          </div>
          <ol className="insights-heatmap" aria-label="Completed tasks over the last 28 days">
            {Object.entries(stats.heatmap).map(([date, count]) => {
              const intensity = Math.min(count / 5, 1);
              return (
                <li
                  key={date}
                  className={count ? "has-work" : ""}
                  style={{ "--heat": intensity } as CSSProperties}
                  title={`${date}: ${count} completed tasks`}
                >
                  <span className="sr-only">{date}: {count} completed tasks</span>
                </li>
              );
            })}
          </ol>
        </article>

        <article className="clay-panel insights-module">
          <div className="insights-module-head">
            <div>
              <span className="eyebrow">Course load</span>
              <h2>Where completions landed</h2>
            </div>
          </div>
          {stats.topProjects.length ? (
            <div className="insights-course-list">
              {stats.topProjects.map(({ course, count }) => (
                <div key={course!.id} className="insights-course-row">
                  <span className="project-dot" style={{ "--project-color": course!.color } as CSSProperties} aria-hidden="true" />
                  <strong>{course!.name}</strong>
                  <span>{count} tasks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="insights-empty-copy">Complete a few tasks to see course balance.</p>
          )}
        </article>
      </section>
    </div>
  );
}

function InsightStat({
  detail,
  icon,
  label,
  tone = "quiet",
  value
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone?: "good" | "quiet" | "warn";
  value: string;
}) {
  return (
    <article className={`clay-panel insights-stat insights-stat-${tone}`}>
      <div className="insights-stat-icon" aria-hidden="true">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
