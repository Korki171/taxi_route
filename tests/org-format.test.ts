import { describe, expect, it } from "vitest";
import { orgProfileSchema } from "@/server/validation";

const base = {
  name: "Taxi Hofer", street: "Maria-Theresien-Straße 1", postalCode: "6020", city: "Innsbruck", country: "at",
  email: "Office@Hofer.at", phone: "+43 512 123456",
};

describe("Firmendaten: einheitliche Formate", () => {
  it("nimmt gültige Pflichtfelder und vereinheitlicht Land und E-Mail", () => {
    const o = orgProfileSchema.parse(base);
    expect(o.country).toBe("AT");
    expect(o.email).toBe("office@hofer.at");
    expect(o.website).toBeUndefined();
    expect(o.vatId).toBeUndefined();
  });

  it.each([["012"], ["60 20"], ["abcd"], ["123456"]])("lehnt PLZ %s ab", (postalCode) => {
    expect(orgProfileSchema.safeParse({ ...base, postalCode }).success).toBe(false);
  });

  it.each([["0512 123456"], ["+43"], ["+43 abc"], ["+43 512 123456 789 0123 45"]])("lehnt Telefon %s ab", (phone) => {
    expect(orgProfileSchema.safeParse({ ...base, phone }).success).toBe(false);
  });

  it("ergänzt https:// bei der Website und schreibt die UID zusammen und groß", () => {
    const o = orgProfileSchema.parse({ ...base, website: "www.hofer.at", vatId: "atu 12345678" });
    expect(o.website).toBe("https://www.hofer.at");
    expect(o.vatId).toBe("ATU12345678");
  });

  it("lehnt eine kaputte Website und UID ab", () => {
    expect(orgProfileSchema.safeParse({ ...base, website: "kein link" }).success).toBe(false);
    expect(orgProfileSchema.safeParse({ ...base, vatId: "123" }).success).toBe(false);
  });

  it("verlangt alle Pflichtfelder", () => {
    for (const k of ["name", "street", "postalCode", "city", "country", "email", "phone"] as const) {
      expect(orgProfileSchema.safeParse({ ...base, [k]: "" }).success).toBe(false);
    }
  });
});
