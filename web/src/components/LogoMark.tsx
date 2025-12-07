export default function LogoMark({
  size = 24,
  className = '',
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      className={className} aria-label="New Era"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="cut">
          <rect width="100%" height="100%" fill="#fff"/>
          <path d="M32 12 L39 24 L32 31 L25 24 Z" fill="#000"/>
          <rect x="29" y="31" width="6" height="22" rx="3" fill="#000"/>
        </mask>
      </defs>
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="6" mask="url(#cut)"/>
      <path d="M32 12 L39 24 L32 31 L25 24 Z" fill="currentColor"/>
      <rect x="29" y="31" width="6" height="22" rx="3" fill="currentColor"/>
    </svg>
  );
}
