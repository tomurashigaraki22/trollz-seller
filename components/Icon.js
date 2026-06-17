import { HugeiconsIcon } from '@hugeicons/react';

export default function Icon({ icon, size = 20, className = '', strokeWidth = 1.5, ...props }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color="currentColor"
      {...props}
    />
  );
}

