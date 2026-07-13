export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Location pin silhouette */}
      <path
        d="M24 2C13.5 2 5 10.5 5 21c0 14 19 25 19 25s19-11 19-25C43 10.5 34.5 2 24 2Z"
        fill="#2563EB"
      />
      {/* House shape cut into the pin, window as the accent */}
      <path d="M24 11 12 21v14h8v-9h8v9h8V21L24 11Z" fill="white" />
      <rect x="20.5" y="15.5" width="7" height="7" rx="1.5" fill="#F97316" />
    </svg>
  );
}
