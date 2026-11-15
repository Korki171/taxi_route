import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/safe-path";

describe("Rücksprungziele (kein Open Redirect)", () => {
  it("lässt interne Pfade durch", () => {
    expect(safeInternalPath("/boerse")).toBe("/boerse");
    expect(safeInternalPath("/boerse/auftrag/1?tab=chat#x")).toBe("/boerse/auftrag/1?tab=chat#x");
  });
  it("blockt fremde Adressen", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com", "evil.com", "", null, undefined]) {
      expect(safeInternalPath(bad, "/dashboard")).toBe("/dashboard");
    }
  });
});
