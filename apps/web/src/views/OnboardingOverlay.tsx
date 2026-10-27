import { Bell, Briefcase, Check, GraduationCap, House, Plus, SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { reportError } from "../sentry";
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

const SETUP_DRAFT_KEY = "throughline:onboarding-draft";

type SetupDraft = {
  step: number;
  kind: OnboardingSetupKind;
  projectNames: string[];
  taskTitle: string;
  taskProjectIndex: number;
  dueAt: string;
  enableNotifications: boolean;
  openSyncSettings: boolean;
};

function defaultDueValue() {
  const due = new Date();
  due.setHours(18, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`;
}

function readSetupDraft(): Partial<SetupDraft> | null {
  try {
    const raw = sessionStorage.getItem(SETUP_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SetupDraft>;
  } catch {
    return null;
  }
}

function clearSetupDraft() {
  try {
    sessionStorage.removeItem(SETUP_DRAFT_KEY);
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function OnboardingOverlay({ onSetup, onComplete }: { onSetup: (input: OnboardingSetupInput) => void | Promise<void>; onComplete: () => void | Promise<void> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const draft = useMemo(() => readSetupDraft(), []);
  const [step, setStep] = useState(() => {
    const value = draft?.step;
    return typeof value === "number" && value >= 0 && value <= 3 ? value : 0;
  });
  const [kind, setKind] = useState<OnboardingSetupKind>(() =>
    draft?.kind === "school" || draft?.kind === "work" || draft?.kind === "personal" ? draft.kind : "school"
  );
  const [projectNames, setProjectNames] = useState<string[]>(() =>
    Array.isArray(draft?.projectNames) && draft.projectNames.length ? draft.projectNames : [DEFAULT_PROJECTS.school]
  );
  const [taskTitle, setTaskTitle] = useState(() => draft?.taskTitle ?? "Review notes for 25 minutes");
  const [taskProjectIndex, setTaskProjectIndex] = useState(() => draft?.taskProjectIndex ?? 0);
  const [dueAt, setDueAt] = useState(() => draft?.dueAt ?? defaultDueValue());
  const [enableNotifications, setEnableNotifications] = useState(() => Boolean(draft?.enableNotifications));
  const [openSyncSettings, setOpenSyncSettings] = useState(() => Boolean(draft?.openSyncSettings));
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");

  const cleanedProjects = useMemo(() => projectNames.map((name) => name.trim()).filter(Boolean).slice(0, 3), [projectNames]);
  const canContinue = step === 1 ? cleanedProjects.length > 0 : step === 2 ? taskTitle.trim().length > 0 : true;

  // Setup is intentionally required, so Escape does not dismiss it; the shared
  // dialog helper still traps focus and restores it after setup finishes.
  useDialogA11y(true, () => undefined, panelRef);

  useEffect(() => {
    try {
      const payload: SetupDraft = {
        step,
        kind,
        projectNames,
        taskTitle,
        taskProjectIndex,
        dueAt,
        enableNotifications,
        openSyncSettings
      };
      sessionStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // Ignore private-mode storage failures.
    }
  }, [step, kind, projectNames, taskTitle, taskProjectIndex, dueAt, enableNotifications, openSyncSettings]);

  function chooseKind(nextKind: OnboardingSetupKind) {
    setKind(nextKind);
    if (projectNames.length === 1 && Object.values(DEFAULT_PROJECTS).includes(projectNames[0])) {
      setProjectNames([DEFAULT_PROJECTS[nextKind]]);
    }
  }

  function goNext() {
    if (!canContinue) return;
    setStep((current) => Math.min(3, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
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
    setSetupError("");
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
      clearSetupDraft();
    } catch (error) {
      reportError(error, { source: "onboarding" });
      setSetupError("Setup couldn't finish — storage is unavailable. Try again.");
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
            <span className="eyebrow">Setup · {step + 1} of 4</span>
            <h2 id="onboarding-title" className="onboarding-title">
              {step === 0
                ? "What are you planning for?"
                : step === 1
                  ? kind === "school"
                    ? "Add your courses"
                    : "Name your projects"
                  : step === 2
                    ? "Capture one real task"
                    : "Optional finishing touches"}
            </h2>
            <p className="onboarding-copy">
              {step === 0
                ? "Pick a workspace so Throughline can label projects the way you already think."
                : step === 1
                  ? "Start with one to three names. You can always add more later."
                  : step === 2
                    ? "Give Today something concrete to show the moment setup ends."
                    : "Notifications and encrypted sync stay optional — local planning already works."}
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
              <Button type="button" onClick={goBack}>
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button type="button" variant="primary" disabled={!canContinue} onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="button" variant="accent" disabled={!canContinue || submitting} onClick={() => void finish()}>
                Finish setup
                <Check weight="bold" size={16} />
              </Button>
            )}
          </div>
          {setupError ? (
            <p className="composer-error" role="alert">
              {setupError}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
