import { describe, it, expect } from "vitest";
import { Agents } from ".";

describe("Agents Catalog", () => {
  it("should have all expected categories", () => {
    expect(Agents).toBeDefined();
    expect(Agents.Glucose).toBeDefined();
    expect(Agents.Caffeine).toBeDefined();
    expect(Agents.LSD).toBeDefined();
    expect(Agents.SunlightExposure).toBeDefined();
  });

  it("should produce valid pharmacology for Glucose", () => {
    const pharm = Agents.Glucose(50);
    expect(pharm.molecule.name).toBe("Glucose");
    expect(pharm.pd?.length).toBeGreaterThan(0);
  });

  it("should produce valid pharmacology for Caffeine", () => {
    const pharm = Agents.Caffeine(100);
    expect(pharm.molecule.name).toBe("Caffeine");
    expect(pharm.pk.halfLifeMin).toBe(300);
  });
});
