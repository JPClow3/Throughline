import { Books, ChartLineUp, Clock, Plus, Target, WarningCircle } from "@phosphor-icons/react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { deriveCoachingInsights } from "@throughline/domain";
import { Button, EmptyState, ViewSkeleton } from "../ui";
import { useFocusSessions } from "../hooks/useFocusSessions";
import { useTasks } from "../hooks/useTasks";

export function InsightsView({ onNewTask }: { onNewTask?: () => void } = {}) {
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

    const weeklyCompletionsData = [];
    const dailyFocusHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      const shortDay = date.toLocaleDateString(undefined, { weekday: "short" });
      weeklyCompletionsData.push({ date: shortDay, fullDate: dateKey, completed: 0 });
      dailyFocusHistory.push({ date: shortDay, fullDate: dateKey, focusHours: 0 });
    }

    const weeklyFocusHistory = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000);
      const shortDate = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeklyFocusHistory.push({
        weekLabel: `Wk ${shortDate}`,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
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

      const chartMatch = weeklyCompletionsData.find((entry) => entry.fullDate === dateKey);
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

      const dailyMatch = dailyFocusHistory.find((entry) => entry.fullDate === dateKey);
      if (dailyMatch) {
        dailyMatch.focusHours += session.durationMinutes / 60;
      }

      const weeklyMatch = weeklyFocusHistory.find(
        (entry) => dateKey >= entry.startDate && dateKey <= entry.endDate
      );
      if (weeklyMatch) {
        weeklyMatch.focusHours += session.durationMinutes / 60;
      }
    }

    dailyFocusHistory.forEach((entry) => {
      entry.focusHours = Number(entry.focusHours.toFixed(1));
    });
    weeklyFocusHistory.forEach((entry) => {
      entry.focusHours = Number(entry.focusHours.toFixed(1));
    });

    const topProjects = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ course: courses.find((course) => course.id === id), count }))
      .filter((item) => item.course);

    const overdueCount = tasks.filter((task) => {
      if (!task.dueAt || task.status === "done") return false;
      return new Date(task.dueAt) < startOfToday;
    }).length;

    const activeCourses = new Set(
      tasks.filter((task) => task.status !== "done" && task.courseId).map((task) => task.courseId)
    ).size;
    const focusMinutes = focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const coaching = deriveCoachingInsights({ tasks, courses, focusSessions });

    return {
      activeCourses,
      coaching,
      completedCount: completed.length,
      focusMinutes,
      heatmap,
      weeklyCompletionsData,
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

  if (onNewTask && tasks.length === 0 && focusSessions.length === 0) {
    return (
      <div className="view-layout">
        <header className="view-head">
          <div>
            <span className="eyebrow">Coaching</span>
            <h1 className="view-title">Insights</h1>
            <p className="view-head-sub">Signals from your tasks, courses, and focus sessions.</p>
          </div>
        </header>
        <EmptyState
          icon={<ChartLineUp size={24} weight="bold" />}
          title="No activity recorded yet"
          body="Insights, coaching, and focus trends will appear here once you capture tasks and complete study sessions."
          action={
            onNewTask ? (
              <Button variant="accent" onClick={onNewTask}>
                <Plus size={15} weight="bold" />
                Capture a task
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const trend = stats.last7Days - stats.previous7Days;
  const focusHours = Math.floor(stats.focusMinutes / 60);
  const focusRemainder = stats.focusMinutes % 60;

  return (
    <div className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">Coaching</span>
          <h1 className="view-title">Insights</h1>
          <p className="view-head-sub">Signals from your tasks, courses, and focus sessions.</p>
        </div>
      </header>

      <section className="ik-card insights-coaching" aria-labelledby="insights-coaching-title">
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
        <StatTile icon={<Target size={17} weight="bold" />} label="Completed" value={`${stats.completedCount}`} detail="All-time finished tasks" />
        <StatTile
          icon={<ChartLineUp size={17} weight="bold" />}
          label="Last 7 days"
          value={`${stats.last7Days}`}
          detail={`${trend >= 0 ? "+" : ""}${trend} versus prior week`}
          tone={trend >= 0 ? "good" : undefined}
        />
        <StatTile icon={<WarningCircle size={17} weight="bold" />} label="Overdue" value={`${stats.overdueCount}`} detail="Open tasks past due" tone={stats.overdueCount ? "warn" : "good"} />
        <StatTile icon={<Clock size={17} weight="bold" />} label="Focus time" value={`${focusHours}h ${focusRemainder}m`} detail="Logged study sessions" />
        <StatTile icon={<Books size={17} weight="bold" />} label="Active courses" value={`${stats.activeCourses}`} detail="Courses with open work" />
      </section>

      <section className="insights-grid">
        <article className="ik-card insights-module insights-module-wide">
          <div className="insights-chart-col">
            <span className="eyebrow">Focus logs</span>
            <h2>Focus hours, last 7 days</h2>
            <div className="insights-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyFocusHistory}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--ink-faint)" }} />
                  <Tooltip
                    cursor={{ fill: "var(--paper-2)" }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "2px solid var(--line)",
                      background: "var(--card)",
                      color: "var(--ink)",
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="focusHours" fill="var(--blue)" stroke="var(--line)" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="insights-chart-col">
            <span className="eyebrow">Focus trends</span>
            <h2>Focus hours, last 4 weeks</h2>
            <div className="insights-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyFocusHistory}>
                  <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--ink-faint)" }} />
                  <Tooltip
                    cursor={{ fill: "var(--paper-2)" }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "2px solid var(--line)",
                      background: "var(--card)",
                      color: "var(--ink)",
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="focusHours" fill="var(--violet)" stroke="var(--line)" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        <article className="ik-card insights-module">
          <div className="insights-chart-col">
            <span className="eyebrow">Weekly rhythm</span>
            <h2>Completions, last 7 days</h2>
          </div>
          <div className="insights-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyCompletionsData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--ink-faint)" }} />
                <Tooltip
                  cursor={{ fill: "var(--paper-2)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "2px solid var(--line)",
                    background: "var(--card)",
                    color: "var(--ink)",
                    fontWeight: 600
                  }}
                />
                <Bar dataKey="completed" fill="var(--green)" stroke="var(--line)" strokeWidth={2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ik-card insights-module">
          <div>
            <span className="eyebrow">Activity</span>
            <h2>28-day heatmap</h2>
          </div>
          <ol className="insights-heatmap" aria-label="Completed tasks over the last 28 days">
            {Object.entries(stats.heatmap).map(([date, count]) => {
              const intensity = Math.min(count / 5, 1);
              return (
                <li
                  key={date}
                  style={{ "--heat": intensity } as CSSProperties}
                  title={`${date}: ${count} completed tasks`}
                >
                  <span className="sr-only">{date}: {count} completed tasks</span>
                </li>
              );
            })}
          </ol>
        </article>

        <article className="ik-card insights-module">
          <div>
            <span className="eyebrow">Course load</span>
            <h2>Where completions landed</h2>
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

function StatTile({
  detail,
  icon,
  label,
  tone,
  value
}: {
  detail: string;
  icon?: ReactNode;
  label: string;
  tone?: "good" | "warn";
  value: string;
}) {
  return (
    <article className={`ik-card stat-tile insights-stat${tone ? ` insights-stat-${tone}` : ""}`}>
      <span className="stat-tile-label">
        {icon ? <span className="mr-1 inline-flex translate-y-0.5">{icon}</span> : null}
        {label}
      </span>
      <strong className="stat-tile-value">{value}</strong>
      <span className="stat-tile-detail">{detail}</span>
    </article>
  );
}
