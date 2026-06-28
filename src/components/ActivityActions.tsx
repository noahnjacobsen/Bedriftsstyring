"use client";

// Small inline action buttons for an activity (toggle done / delete).
export function ToggleDoneButton({
  action,
  done,
}: {
  action: () => void;
  done: boolean;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <button type="submit" className="btn secondary small">
        {done ? "Gjenåpne" : "Marker utført"}
      </button>
    </form>
  );
}

export function DeleteActivityButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (!confirm("Slette denne loggføringen?")) e.preventDefault();
      }}
    >
      <button type="submit" className="btn danger small">
        Slett
      </button>
    </form>
  );
}
