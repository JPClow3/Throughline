import { Bell, Briefcase, Check, GraduationCap, House, Plus, SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button, Field, Select, TextInput } from "../ui";

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

const KINDS: Array<{ id: OnboardingSetupKind; label: string; icon: ReactNode }> = [
  { id: "school", label: "School", icon: <GraduationCap size={22} weight="bold" /> },
  { id: "work", label: "Work", icon: <Briefcase size={22} weight="bold" /> },
  { id: "personal", label: "Personal", icon: <House size={22} weight="bold" /> }
];

const DEFAULT_PROJECTS: Record<OnboardingSetupKind, string> = {
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

export function OnboardingOverlay({ onSetup, onComplete }: { onSetup: (input: OnboardingSetupInput) => void | Promise<void>; onComplete: () => void | Promise<void> }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<OnboardingSetupKind>("school");
  const [projectNames, setProjectNames] = useState<string[]>([DEFAULT_PROJECTS.school]);
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
    if (projectNames.length === 1 && Object.values(DEFAULT_PROJECTS).includes(projectNames[0])) {
      setProjectNames([DEFAULT_PROJECTS[nextKind]]);
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
    <div className="onboarding-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="ik-card onboarding-panel flex flex-col"
      >
        <div className="flex flex-col gap-6 p-7 md:p-8">
          <div>
            <span className="eyebrow">Setup</span>
            <h2 className="mt-1 text-xl font-bold">Make Today useful</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Start with a real workspace, one project, and one task you can act on today.
            </p>
          </div>

          {step === 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Choose workspace type">
              {KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`setup-choice ${kind === item.id ? "active" : ""}`}
                  aria-pressed={kind === item.id}
                  onClick={() => chooseKind(item.id)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-3">
              {projectNames.map((name, index) => (
                <Field key={index} label={kind === "school" ? `Course ${index + 1}` : `Project ${index + 1}`}>
                  <TextInput
                    value={name}
                    onChange={(event) => updateProjectName(index, event.target.value)}
                    placeholder={kind === "school" ? "Biology" : "Project name"}
                  />
                </Field>
              ))}
              {projectNames.length < 3 ? (
                <Button className="self-start" onClick={addProject}>
                  <Plus size={14} weight="bold" />
                  Add another
                </Button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <Field label="First task">
                <TextInput value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
              </Field>
              <Field label="Project">
                <Select value={taskProjectIndex} onChange={(event) => setTaskProjectIndex(Number(event.target.value))}>
                  {cleanedProjects.map((project, index) => (
                    <option key={`${project}-${index}`} value={index}>
                      {project}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due">
                <TextInput type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3">
              <label className="setup-toggle">
                <input type="checkbox" className="checkbox" checked={enableNotifications} onChange={(event) => setEnableNotifications(event.target.checked)} />
                <Bell size={17} weight="bold" style={{ color: "var(--ink-soft)" }} />
                <span>Ask for notification permission after setup</span>
              </label>
              <label className="setup-toggle">
                <input type="checkbox" className="checkbox" checked={openSyncSettings} onChange={(event) => setOpenSyncSettings(event.target.checked)} />
                <SlidersHorizontal size={17} weight="bold" style={{ color: "var(--ink-soft)" }} />
                <span>Open Settings next so I can enable encrypted sync</span>
              </label>
            </div>
          ) : null}
        </div>

        <div
          className="mt-auto flex items-center justify-between p-6"
          style={{ borderTop: "2px solid var(--line)", background: "var(--card-tinted)" }}
        >
          <div className="flex gap-1.5" aria-label="Setup progress">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className={`setup-progress-dot${index === step ? " active" : ""}`} style={{ width: index === step ? 24 : 8 }} />
            ))}
          </div>
          <div className="flex gap-3">
            {step > 0 ? (
              <Button onClick={() => setStep((current) => current - 1)}>Back</Button>
            ) : null}
            {step < 3 ? (
              <Button variant="primary" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="accent" disabled={!canContinue || submitting} onClick={() => void finish()}>
                Finish setup
                <Check weight="bold" size={16} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
