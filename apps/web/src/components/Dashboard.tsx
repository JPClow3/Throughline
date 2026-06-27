import { Course, Task } from "@throughline/domain";
import { CheckCircle, Plus, DotsThree, Timer, Lightning, GraduationCap, ChartBar } from "@phosphor-icons/react";
import { TaskCard } from "./TaskCard";

type DashboardProps = {
  tasks: Task[];
  courses: Course[];
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onNewTask: (date?: Date) => void;
  onEdit: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
};

export function Dashboard({
  tasks,
  courses,
  onComplete,
  onUpdateTask,
  onNewTask,
  onEdit,
  onStartFocus
}: DashboardProps) {
  function greetingForHour(hour: number) {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
  const greeting = `${greetingForHour(new Date().getHours())}, Scholar.`;
  
  const active = tasks.filter((task) => task.status !== "done");
  const dueSoon = active
    .filter((task) => task.dueAt)
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime())
    .slice(0, 3);
    
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const strokeDashoffset = 283 - (283 * pct) / 100;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7); // Last 7 days

  const weeklyTasks = tasks.filter(t => t.status === "done" && t.completedAt && new Date(t.completedAt) >= startOfWeek);
  const weeklyXP = weeklyTasks.reduce((sum, t) => sum + (t.xp || 0), 0);

  const timePerCourse = new Map<string, number>();
  weeklyTasks.forEach(t => {
    if (t.courseId) {
      timePerCourse.set(t.courseId, (timePerCourse.get(t.courseId) || 0) + (t.estimatedMinutes || 0));
    }
  });

  const sortedCourses = Array.from(timePerCourse.entries())
    .map(([courseId, minutes]) => ({
      course: courses.find(c => c.id === courseId),
      minutes
    }))
    .filter(c => c.course)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-[48px] max-w-container-max mx-auto w-full">
      <header className="flex flex-col gap-2">
        <h1 className="font-display-lg text-display-lg text-on-surface">{greeting}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          You have {dueSoon.length} priority tasks scheduled today.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <section className="lg:col-span-8 glass-panel rounded-xl p-padding-glass flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">Daily Progress</h2>
            <button className="text-primary hover:bg-primary-fixed rounded-full p-2 transition-colors">
              <DotsThree size={24} weight="bold" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-highest opacity-50" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="12"></circle>
                  <circle className="text-primary drop-shadow-[0_8px_16px_rgba(70,72,212,0.4)]" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeDasharray="264" strokeDashoffset="79" strokeLinecap="round" strokeWidth="12"></circle>
                </svg>
                <div className="text-center z-10 flex flex-col items-center">
                  <Timer size={24} className="text-primary mb-1" weight="bold" />
                  <span className="font-headline-lg text-headline-lg text-on-surface leading-none tabular-nums">2.5h</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">/ 4h Goal</span>
                </div>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Deep Work</span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-highest opacity-50" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="12"></circle>
                  <circle className="text-secondary drop-shadow-[0_8px_16px_rgba(0,108,73,0.4)]" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeDasharray="264" strokeDashoffset={264 - (264 * pct) / 100} strokeLinecap="round" strokeWidth="12"></circle>
                </svg>
                <div className="text-center z-10 flex flex-col items-center">
                  <CheckCircle size={24} className="text-secondary mb-1" weight="bold" />
                  <span className="font-headline-lg text-headline-lg text-on-surface leading-none tabular-nums">{done}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">/ {total} Tasks</span>
                </div>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Completion</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 glass-panel rounded-xl p-padding-glass flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">Up Next</h2>
            <button className="text-primary font-label-md text-label-md hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {dueSoon.length === 0 ? (
              <div className="text-on-surface-variant text-body-md py-4 text-center">No tasks due soon.</div>
            ) : (
              dueSoon.map((task, idx) => {
                const isUrgent = task.difficulty >= 4 || task.priority === "high" || task.priority === "critical";
                return (
                  <div key={task.id} onClick={() => onEdit(task)} className="group flex items-start gap-4 p-3 rounded-lg hover:bg-white/40 transition-colors border border-transparent hover:border-white/40 cursor-pointer">
                    <button onClick={(e) => { e.stopPropagation(); onComplete(task); }} className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 cursor-pointer transition-colors ${idx === 1 ? 'border-error hover:bg-error/20' : 'border-primary hover:bg-primary/20'}`}></button>
                    <div className="flex flex-col w-full">
                      <TaskCard 
                        task={task} 
                        onComplete={onComplete} 
                        onEdit={onEdit} 
                        onUpdateTask={onUpdateTask}
                        onStartFocus={onStartFocus}
                        compact
                        urgentGlow={isUrgent}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button onClick={() => onNewTask()} className="mt-auto w-full py-3 rounded-lg border border-primary/30 text-primary font-label-md text-label-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
            <Plus size={16} />
            Quick Add Task
          </button>
        </section>

        <section className="lg:col-span-12 glass-panel rounded-xl p-padding-glass flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <ChartBar size={24} className="text-primary" />
              Weekly Insights
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <span className="font-label-md text-on-surface-variant mb-2 flex items-center gap-2"><CheckCircle size={16} /> Tasks Completed</span>
              <span className="font-display-sm text-primary">{weeklyTasks.length}</span>
              <span className="font-body-sm text-on-surface-variant mt-1">in the last 7 days</span>
            </div>
            
            <div className="flex flex-col bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <span className="font-label-md text-on-surface-variant mb-2 flex items-center gap-2"><Lightning size={16} /> XP Gained</span>
              <span className="font-display-sm text-secondary">{weeklyXP}</span>
              <span className="font-body-sm text-on-surface-variant mt-1">keep up the momentum</span>
            </div>

            <div className="flex flex-col bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <span className="font-label-md text-on-surface-variant mb-2 flex items-center gap-2"><GraduationCap size={16} /> Top Courses</span>
              <div className="flex flex-col gap-2 mt-1">
                {sortedCourses.length > 0 ? (
                  sortedCourses.map((c) => (
                    <div key={c.course?.id} className="flex justify-between items-center">
                      <span className="font-body-sm text-on-surface truncate pr-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.course?.color }} />
                        {c.course?.code ?? c.course?.name}
                      </span>
                      <span className="font-label-sm text-on-surface-variant flex-shrink-0">
                        {Math.round(c.minutes / 60 * 10) / 10}h
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="font-body-sm text-on-surface-variant italic">No data yet</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-12 glass-panel rounded-xl p-padding-glass flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Academic Rhythm</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">30-Day consistency tracker.</p>
            </div>
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
                <div className="w-3 h-3 rounded-sm bg-primary-fixed"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
              </div>
              <span>More</span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-max">
              <div className="flex flex-col gap-2">
                {['Mon','','Wed','','Fri','','Sun'].map((day, i) => (
                  <span key={i} className="h-4 text-[10px] text-on-surface-variant leading-tight flex items-center justify-end pr-2">{day}</span>
                ))}
              </div>
              
              {Array.from({ length: 12 }).map((_, w) => (
                <div key={w} className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, d) => {
                    const intensities = ['bg-surface-container-high', 'bg-primary-fixed', 'bg-primary/40', 'bg-primary/70', 'bg-primary'];
                    let rand = Math.floor(Math.random() * intensities.length);
                    if(Math.random() > 0.8) rand = 4;
                    return (
                      <div key={d} className={`w-4 h-4 rounded-sm ${intensities[rand]} hover:ring-2 ring-primary/50 cursor-pointer transition-all`} title="Activity level"></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
