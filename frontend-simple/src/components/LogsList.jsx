import React from "react";

export default function LogsList({ items = [] }) {
  if (!items.length) {
    return <div className="empty">No logs found in the window.</div>;
  }

  return (
    <div className="logs-list">
      {items.map((it, idx) => {
        // ts is a Loki timestamp string in ns, or ISO sometimes — try to parse
        let tsReadable = it.ts;
        try {
          // if numeric nanoseconds -> convert to ms
          if (/^\d+$/.test(it.ts)) {
            const ms = Number(BigInt(it.ts) / 1000000n);
            tsReadable = new Date(ms).toLocaleString();
          }
        } catch (e) { /* ignore */ }
        return (
          <div key={idx} className="log-row">
            <div className="log-ts">{tsReadable}</div>
            <div className="log-line">{it.line}</div>
          </div>
        );
      })}
    </div>
  );
}
