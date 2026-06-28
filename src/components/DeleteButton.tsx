"use client";

export function DeleteButton({
  action,
  label = "Slett",
  confirmText = "Er du sikker på at du vil slette denne kontrakten? Dette kan ikke angres.",
}: {
  action: () => void;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className="btn danger">
        {label}
      </button>
    </form>
  );
}
