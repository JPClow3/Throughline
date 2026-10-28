import { Flame, Medal, Sparkle, Trophy } from "@phosphor-icons/react";
import type { UserProgress } from "@throughline/domain";
import { rpgAttributes } from "@throughline/domain";
import { Card } from "../ui";

const ATTRIBUTE_LABEL: Record<(typeof rpgAttributes)[number], string> = {
  focus: "Focus",
  memory: "Memory",
  discipline: "Discipline",
  creativity: "Creativity",
  wellness: "Wellness"
};

export function GameProgressCard({ progress }: { progress: UserProgress }) {
  return (
    <Card className="today-panel game-progress-card" aria-label="Game progress">
      <div className="today-section-head">
        <div>
          <span className="eyebrow">Momentum</span>
          <h2>Level {progress.level}</h2>
        </div>
        <span className="today-count">{progress.xp} XP</span>
      </div>

      <div className="game-progress-stats" role="list">
        <div className="game-progress-stat" role="listitem">
          <Flame size={16} weight="bold" aria-hidden="true" />
          <span>
            {progress.streakDays > 0
              ? `${progress.streakDays}-day streak`
              : "Start a streak by completing a task"}
          </span>
        </div>
        <div className="game-progress-stat" role="listitem">
          <Trophy size={16} weight="bold" aria-hidden="true" />
          <span>Level {progress.level} · {progress.xp} total XP</span>
        </div>
      </div>

      <div className="game-attribute-grid" aria-label="RPG attributes">
        {rpgAttributes.map((attribute) => (
          <div key={attribute} className="game-attribute-chip">
            <Sparkle size={12} weight="bold" aria-hidden="true" />
            <span>{ATTRIBUTE_LABEL[attribute]}</span>
            <strong>{progress.attributes[attribute] ?? 0}</strong>
          </div>
        ))}
      </div>

      {progress.badges.length ? (
        <div className="game-badge-row" aria-label="Badges">
          {progress.badges.map((badge) => (
            <span key={badge} className="game-badge">
              <Medal size={12} weight="bold" aria-hidden="true" />
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
