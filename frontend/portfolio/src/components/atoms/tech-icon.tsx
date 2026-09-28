import type { SimpleIcon } from 'simple-icons';

export function TechIcon({
  icon,
  className,
}: {
  icon: SimpleIcon;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  );
}
