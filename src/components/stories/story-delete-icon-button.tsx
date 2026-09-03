import { TrashIcon } from "@/components/ui/trash-icon";

export function StoryDeleteIconButton({
  label,
  disabled = false,
  className = "",
  onClick,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`story-delete-icon-btn${className ? ` ${className}` : ""}`}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <TrashIcon />
    </button>
  );
}
