import React from "react";

export function ResearchShell({ children, className = "", ...props }) {
  return React.createElement(
    "div",
    { className: `nr-shell ${className}`.trim(), ...props },
    children,
  );
}

export function ResearchHeader({ title, homeHref = "/", children, className = "" }) {
  return React.createElement(
    "header",
    { className: `nr-header ${className}`.trim() },
    React.createElement(
      "a",
      { className: "nr-brand", href: homeHref },
      title,
    ),
    children,
  );
}

export function ResearchNav({ items, activeId, onChange, ariaLabel = "primary navigation" }) {
  return React.createElement(
    "nav",
    { className: "nr-nav", "aria-label": ariaLabel },
    items.map((item) =>
      React.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          className: "nr-nav-item",
          "aria-current": item.id === activeId ? "page" : undefined,
          onClick: () => onChange(item.id),
        },
        item.label,
      ),
    ),
  );
}

export function Button({ variant = "default", className = "", ...props }) {
  return React.createElement("button", {
    className: `nr-button nr-button-${variant} ${className}`.trim(),
    ...props,
  });
}

export function TextInput({ className = "", ...props }) {
  return React.createElement("input", {
    className: `nr-input ${className}`.trim(),
    ...props,
  });
}

export function StatusMessage({ variant = "info", title, children, action, className = "" }) {
  return React.createElement(
    "section",
    {
      className: `nr-status nr-status-${variant} ${className}`.trim(),
      role: variant === "error" ? "alert" : "status",
    },
    title ? React.createElement("p", { className: "nr-status-title" }, title) : null,
    children ? React.createElement("div", { className: "nr-status-body" }, children) : null,
    action ? React.createElement("div", { className: "nr-status-action" }, action) : null,
  );
}

export function ProgressMeter({ value, max = 1, label, className = "" }) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return React.createElement(
    "div",
    { className: `nr-progress ${className}`.trim() },
    React.createElement(
      "div",
      {
        className: "nr-progress-track",
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": safeMax,
        "aria-valuenow": Math.max(0, Math.min(safeMax, value)),
        "aria-label": label,
      },
      React.createElement("div", {
        className: "nr-progress-fill",
        style: { width: `${percent}%` },
      }),
    ),
    label ? React.createElement("p", { className: "nr-progress-label" }, label) : null,
  );
}

export function Stack({ gap = "md", className = "", ...props }) {
  return React.createElement("div", {
    className: `nr-stack nr-stack-${gap} ${className}`.trim(),
    ...props,
  });
}
