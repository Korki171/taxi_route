"use client";

import { useEffect, useState } from "react";

type Img = { src: string; alt: string };

/** Ein Bild, das sich langsam in das nächste verwandelt (1,6 s Überblendung, 6 s Haltezeit). Steht still bei reduzierter Bewegung. */
export function Crossfade({ images, w, h }: { images: Img[]; w: number; h: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => { if (!document.hidden) setI((x) => (x + 1) % images.length); }, 6000);
    return () => window.clearInterval(id);
  }, [images.length]);
  return (
    <div className="hp-xf" style={{ aspectRatio: `${w} / ${h}` }}>
      {images.map((im, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={im.src} src={im.src} alt={k === i ? im.alt : ""} aria-hidden={k !== i} width={w} height={h} data-on={k === i} loading={k === 0 ? "eager" : "lazy"} decoding="async" />
      ))}
    </div>
  );
}
