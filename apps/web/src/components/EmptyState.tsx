import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="empty-state-rich">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
