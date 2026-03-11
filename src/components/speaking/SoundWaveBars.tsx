import React from "react";

interface Props {
  color?: string;
  className?: string;
}

export const SoundWaveBars: React.FC<Props> = ({ color = "bg-primary", className = "" }) => {
  return (
    <div className={`flex items-end gap-0.5 h-6 ${className}`}>
      {[
        { h: "h-3", delay: "delay-0" },
        { h: "h-5", delay: "delay-75" },
        { h: "h-6", delay: "delay-150" },
        { h: "h-4", delay: "delay-200" },
        { h: "h-5", delay: "delay-300" },
      ].map((bar, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color} animate-bounce ${bar.delay}`}
          style={{ height: "auto", minHeight: 6, maxHeight: 24, animationDuration: "0.6s" }}
        />
      ))}
    </div>
  );
};
