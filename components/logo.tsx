export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Pago Abierto"
    >
      <path
        d="M11 5H6.5C5.67157 5 5 5.67157 5 6.5V25.5C5 26.3284 5.67157 27 6.5 27H11"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M21 5H25.5C26.3284 5 27 5.67157 27 6.5V25.5C27 26.3284 26.3284 27 25.5 27H21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11 16H20"
        stroke="#0F9D6E"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M17 12.5L20.5 16L17 19.5"
        stroke="#0F9D6E"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
