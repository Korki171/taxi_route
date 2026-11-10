/** Das Taxischild vom Dach: gelb solange der Wagen frei ist, rot sobald er besetzt ist, dunkel wenn es nur einen Stand anzeigt. */
export function TaxiSign({ label, tone, size = "l", className }: { label: string; tone: "free" | "busy" | "off"; size?: "l" | "m" | "s"; className?: string }) {
  return (
    <span className={`hp-sign hp-sign-${size} is-${tone}${className ? ` ${className}` : ""}`}>
      <span className="hp-sign-cap" aria-hidden="true" />
      <span className="hp-sign-face"><span className="hp-d">{label}</span></span>
    </span>
  );
}
