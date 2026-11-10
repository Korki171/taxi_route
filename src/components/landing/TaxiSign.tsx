/** Das Taxischild vom Dach: gelb und leuchtend, solange der Wagen frei ist, dunkel sobald er besetzt ist. */
export function TaxiSign({ label, on, size = "l", className }: { label: string; on: boolean; size?: "l" | "m" | "s"; className?: string }) {
  return (
    <span className={`hp-sign hp-sign-${size}${on ? " is-on" : ""}${className ? ` ${className}` : ""}`}>
      <span className="hp-sign-cap" aria-hidden="true" />
      <span className="hp-sign-face"><span className="hp-d">{label}</span></span>
    </span>
  );
}
