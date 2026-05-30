import { describe, expect, it } from "vitest";
import { calculateTaskXp, deriveUserProgress, levelFromXp } from "../src/gamification";
import { sampleTasks } from "../src/sample-data";

describe("gamification", () => {
  it("rewards harder and more urgent quests with more XP", () => {
    const easy = calculateTaskXp({ difficulty: 1, energy: 1, priority: "low", estimatedMinutes: 20 });
    const boss = calculateTaskXp({ difficulty: 5, energy: 5, priority: "critical", estimatedMinutes: 120 });

    expect(boss).toBeGreaterThan(easy);
  });

  it("derives RPG progress from completed tasks", () => {
    const progress = deriveUserProgress(sampleTasks);

    expect(progress.id).toBe("local-player");
    expect(progress.xp).toBeGreaterThan(0);
    expect(progress.attributes.creativity).toBeGreaterThan(0);
  });

  it("keeps levels monotonic", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(600)).toBeGreaterThan(levelFromXp(120));
  });
});
