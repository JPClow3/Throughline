import { useEffect, useState } from "react";

function timeOfDayBase(isDark: boolean): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    // Morning
    return isDark ? "#2A2522" : "#FFF8ED";
  }
  if (hour >= 12 && hour < 18) {
    // Afternoon
    return isDark ? "#172033" : "#FAF8FF";
  }
  // Evening/Night
  return isDark ? "#0C1220" : "#F2F4F8";
}

export function DynamicBackground() {
  const [isDark, setIsDark] = useState(
    () => (typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") === "dark" : false)
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="ambient-mesh"
      style={{
        backgroundColor: timeOfDayBase(isDark),
        backgroundImage: "none",
        transition: "background-color 2s ease"
      }}
    />
  );
}
