import React, { useEffect, useState } from "react";
import { Task } from "@throughline/domain";

type DynamicBackgroundProps = {
  tasks: Task[];
};

export function DynamicBackground({ tasks }: DynamicBackgroundProps) {
  const [styles, setStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    // 1. Time of Day logic
    const hour = new Date().getHours();
    let color1, color2;
    
    // Check if we are in dark mode to adjust colors
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    
    if (hour >= 5 && hour < 12) {
      // Morning: bright and energetic
      color1 = isDark 
        ? "radial-gradient(circle, rgba(165, 120, 77, 0.3), rgba(160, 130, 60, 0.15), transparent 70%)"
        : "radial-gradient(circle, rgba(255, 183, 77, 0.4), rgba(255, 213, 79, 0.2), transparent 70%)";
      color2 = isDark
        ? "radial-gradient(circle, rgba(180, 100, 70, 0.3), rgba(165, 130, 90, 0.2), transparent 70%)"
        : "radial-gradient(circle, rgba(255, 138, 101, 0.4), rgba(255, 204, 128, 0.3), transparent 70%)";
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: clear and focused (default Throughline blue/green)
      color1 = "radial-gradient(circle, rgba(70, 72, 212, 0.4), rgba(157, 244, 200, 0.2), transparent 70%)";
      color2 = "radial-gradient(circle, rgba(157, 244, 200, 0.4), rgba(44, 42, 188, 0.3), transparent 70%)";
    } else {
      // Evening/Night: calm and cool
      color1 = isDark
        ? "radial-gradient(circle, rgba(40, 42, 100, 0.3), rgba(60, 90, 120, 0.2), transparent 70%)"
        : "radial-gradient(circle, rgba(120, 130, 200, 0.4), rgba(97, 180, 200, 0.2), transparent 70%)";
      color2 = isDark
        ? "radial-gradient(circle, rgba(30, 80, 100, 0.3), rgba(20, 22, 60, 0.2), transparent 70%)"
        : "radial-gradient(circle, rgba(130, 170, 220, 0.4), rgba(80, 90, 150, 0.3), transparent 70%)";
    }

    // 2. Workload logic
    const activeTasks = tasks.filter((t) => t.status !== "done").length;
    // Map active tasks to animation duration (fewer tasks -> slower/calmer)
    // base duration is 60s, if workload is high (e.g. 10+), speed it up to 30s.
    const speedFactor = Math.max(0.5, Math.min(1.5, 1.5 - (activeTasks / 15))); 
    const duration1 = `${60 * speedFactor}s`;
    const duration2 = `${80 * speedFactor}s`;

    setStyles({
      "--mesh-color-1": color1,
      "--mesh-color-2": color2,
      "--mesh-duration-1": duration1,
      "--mesh-duration-2": duration2,
    } as React.CSSProperties);
  }, [tasks]);

  return <div className="ambient-mesh" style={styles} />;
}
