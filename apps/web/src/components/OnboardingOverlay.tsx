import { Bell, Briefcase, Check, GraduationCap, House, Plus, SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export type OnboardingSetupKind = "school" | "work" | "personal";

export type OnboardingSetupInput = {
  kind: OnboardingSetupKind;
  projectNames: string[];
  taskTitle: string;
  taskProjectIndex: number;
  dueAt?: string;
  enableNotifications: boolean;
  openSyncSettings: boolean;
};

type OnboardingOverlayProps = {
  onSetup: (input: OnboardingSetupInput) => void | Promise<void>;
  onComplete: () => void | Promise<void>;
};

const kinds: Array<{ id: OnboardingSetupKind; label: string; icon: ReactNode }> = [
  { id: "school", label: "School", icon: <GraduationCap size={22} /> },
  { id: "work", label: "Work", icon: <Briefcase size={22} /> },
  { id: "personal", label: "Personal", icon: <House size={22} /> }
];

const defaultProjects: Record<OnboardingSetupKind, string> = {
  school: "Biology",
  work: "Launch work",
  personal: "Personal admin"
};

function defaultDueValue() {
  const due = new Date();
  due.setHours(18, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`;
}

export function OnboardingOverlay({ onSetup, onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<OnboardingSetupKind>("school");
  const [projectNames, setProjectNames] = useState<string[]>([defaultProjects.school]);
  const [taskTitle, setTaskTitle] = useState("Review notes for 25 minutes");
  const [taskProjectIndex, setTaskProjectIndex] = useState(0);
  const [dueAt, setDueAt] = useState(defaultDueValue);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [openSyncSettings, setOpenSyncSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cleanedProjects = useMemo(() => projectNames.map((name) => name.trim()).filter(Boolean).slice(0, 3), [projectNames]);
  const canContinue = step === 1 ? cleanedProjects.length > 0 : step === 2 ? taskTitle.trim().length > 0 : true;

  function chooseKind(nextKind: OnboardingSetupKind) {
    setKind(nextKind);
    if (projectNames.length === 1 && Object.values(defaultProjects).includes(projectNames[0])) {
      setProjectNames([defaultProjects[nextKind]]);
    }
  }

  function addProject() {
    if (projectNames.length >= 3) return;
    setProjectNames([...projectNames, ""]);
  }

  function updateProjectName(index: number, value: string) {
    setProjectNames(projectNames.map((name, itemIndex) => (itemIndex === index ? value : name)));
  }

  async function finish() {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      const result = onSetup({
        kind,
        projectNames: cleanedProjects,
        taskTitle: taskTitle.trim(),
        taskProjectIndex: Math.min(taskProjectIndex, Math.max(0, cleanedProjects.length - 1)),
        dueAt: dueAt || undefined,
        enableNotifications,
        openSyncSettings
      });
      if (result instanceof Promise) {
        await result;
      }
      const completion = onComplete();
      if (completion instanceof Promise) {
        await completion;
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, type: "spring", bounce: 0.12 }}
        className="bg-surface-2 border border-border shadow-xl rounded-3xl max-w-xl w-full overflow-hidden flex flex-col"
      >
        <div className="p-8 flex flex-col gap-6">
          <div>
            <span className="eyebrow">Setup</span>
            <h2 className="text-headline-sm font-headline-sm text-on-surface">Make Today useful</h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              Start with a real workspace, one project, and one task you can act on today.
            </p>
          </div>

          {step === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Choose workspace type">
              {kinds.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`setup-choice ${kind === item.id ? "active" : ""}`}
                  aria-pressed={kind === item.id}
                  onClick={() => chooseKind(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-3">
              {projectNames.map((name, index) => (
                <label key={index} className="composer-field">
                  <span>{kind === "school" ? `Course ${index + 1}` : `Project ${index + 1}`}</span>
                  <input
                    value={name}
                    onChange={(event) => updateProjectName(index, event.target.value)}
                    placeholder={kind === "school" ? "Biology" : "Project name"}
                  />
                </label>
              ))}
              {projectNames.length < 3 ? (
                <button type="button" className="secondary-button self-start" onClick={addProject}>
                  <Plus size={15} />
                  Add another
                </button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <label className="composer-field">
                <span>First task</span>
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
              </label>
              <label className="composer-field">
                <span>Project</span>
                <select value={taskProjectIndex} onChange={(event) => setTaskProjectIndex(Number(event.target.value))}>
                  {cleanedProjects.map((project, index) => (
                    <option key={`${project}-${index}`} value={index}>
                      {project}
                    </option>
                  ))}
                </select>
              </label>
              <label className="composer-field">
                <span>Due</span>
                <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3">
              <label className="setup-toggle">
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(event) => setEnableNotifications(event.target.checked)}
                />
                <Bell size={18} />
                <span>Ask for notification permission after setup</span>
              </label>
              <label className="setup-toggle">
                <input
                  type="checkbox"
                  checked={openSyncSettings}
                  onChange={(event) => setOpenSyncSettings(event.target.checked)}
                />
                <SlidersHorizontal size={18} />
                <span>Open Settings next so I can enable encrypted sync</span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="bg-surface p-6 flex items-center justify-between border-t border-border mt-auto">
          <div className="flex gap-2" aria-label="Setup progress">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === step ? "w-6 bg-primary" : "w-2 bg-on-surface-variant/20"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {step > 0 ? (
              <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}>
                Back
              </button>
            ) : null}
            {step < 3 ? (
              <button
                type="button"
                className="primary-button"
                disabled={!canContinue}
                onClick={() => setStep((current) => current + 1)}
              >
                Next
              </button>
            ) : (
              <button type="button" className="primary-button" disabled={!canContinue || submitting} onClick={() => void finish()}>
                Finish setup
                <Check weight="bold" size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
