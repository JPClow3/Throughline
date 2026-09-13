import { Bell, Briefcase, Check, GraduationCap, House, Plus, SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, Field, Select, TextInput, useDialogA11y } from "../ui";

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
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Setup is intentionally required, so Escape does not dismiss it; the shared
  // dialog helper still traps focus and restores it after setup finishes.
  useDialogA11y(true, () => undefined, panelRef);

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
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="ik-card onboarding-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="onboarding-body">
          <div>
            <span className="eyebrow">Setup</span>
            <h2 id="onboarding-title" className="onboarding-title">Make Today useful</h2>
            <p className="onboarding-copy">
              Start with a real workspace, one project, and one task you can act on today.
            </p>
          </div>

          {step === 0 ? (
            <div className="onboarding-kind-grid" aria-label="Choose workspace type">
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
            <div className="onboarding-projects">
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
                <Button className="onboarding-add-project" onClick={addProject}>
                  <Plus size={14} weight="bold" />
                  Add another
                </Button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboarding-fields">
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
            <div className="onboarding-toggles">
              <label className="setup-toggle">
                <input type="checkbox" className="checkbox" checked={enableNotifications} onChange={(event) => setEnableNotifications(event.target.checked)} />
                <Bell size={17} weight="bold" className="setup-toggle-icon" />
                <span>Ask for notification permission after setup</span>
              </label>
              <label className="setup-toggle">
                <input type="checkbox" className="checkbox" checked={openSyncSettings} onChange={(event) => setOpenSyncSettings(event.target.checked)} />
                <SlidersHorizontal size={17} weight="bold" className="setup-toggle-icon" />
                <span>Open Settings next so I can enable encrypted sync</span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-progress" aria-label={`Setup step ${step + 1} of 4`} role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1}>
            {[0, 1, 2, 3].map((index) => (
              <span key={index} aria-hidden="true" className={`setup-progress-dot${index === step ? " active" : ""}`} />
            ))}
          </div>
          <div className="onboarding-actions">
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
