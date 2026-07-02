import { Course, Task } from "@throughline/domain";
import { ProjectsManager } from "./ProjectsManager";

type ProjectsViewProps = {
  courses: Course[];
  tasks: Task[];
  onUpsertCourse: (course: Course) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  highlightedProjectId?: string | null;
};

export function ProjectsView({ courses, tasks, onUpsertCourse, onDeleteCourse, highlightedProjectId }: ProjectsViewProps) {
  return (
    <div className="projects-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Organise</span>
          <h1>Projects</h1>
          <p className="view-head-sub">Group related tasks, goals, and notes. Pick a project when you create them.</p>
        </div>
      </header>
      <ProjectsManager
        courses={courses}
        tasks={tasks}
        highlightedProjectId={highlightedProjectId}
        onUpsertCourse={onUpsertCourse}
        onDeleteCourse={onDeleteCourse}
      />
    </div>
  );
}
