import { describe, expect, it } from "vitest";
import { routeGuide } from "@/lib/price-guide";

describe("Routen- und Preisrechner", () => {
  it("schätzt Entfernung, Fahrzeit und Richtpreis", () => {
    const g = routeGuide("innsbruck", "muc")!;
    expect(g.km).toBeGreaterThan(140);
    expect(g.km).toBeLessThan(180);
    expect(g.lowEur).toBeLessThan(g.highEur);
    expect(g.lowEur % 5).toBe(0);
    expect(routeGuide("innsbruck", "innsbruck")).toBeNull();
    expect(routeGuide("innsbruck", "gibtsnicht")).toBeNull();
    // kurze Strecke: Mindestpreis
    expect(routeGuide("innsbruck", "inn")!.lowEur).toBe(40);
  });
});
