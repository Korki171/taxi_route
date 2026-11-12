/** Sternchen an Pflichtfeldern. Für Screenreader genügt das Attribut required am Feld, daher aria-hidden. */
export function Req({ label }: { label: string }) {
  return <abbr className="req" title={label} aria-hidden="true">*</abbr>;
}
