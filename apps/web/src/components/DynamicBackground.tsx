import React, { useMemo } from "react";

export function DynamicBackground() {
  const styles = useMemo(() => {
    // 1. Time of Day logic
    const hour = new Date().getHours();
    
    // Check if we are in dark mode to adjust colors
    const isDark = typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") === "dark" : false;
    
    let baseColor: string;
    
    if (hour >= 5 && hour < 12) {
      // Morning
      baseColor = isDark ? "#2A2522" : "#FFF8ED";
    } else if (hour >= 12 && hour < 18) {
      // Afternoon
      baseColor = isDark ? "#172033" : "#FAF8FF";
    } else {
      // Evening/Night
      baseColor = isDark ? "#0C1220" : "#F2F4F8";
    }

    return {
      background: baseColor,
      transition: "background-color 2s ease",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    } as React.CSSProperties;
  }, []);

  return <div className="ambient-mesh" style={styles} />;
}
