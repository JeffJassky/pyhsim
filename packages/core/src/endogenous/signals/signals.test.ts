import { describe, it, expect } from "vitest";
import { SIGNALS_ALL } from "./types";
import { SIGNAL_DEFINITIONS_MAP } from ".";

describe("Signals Catalog", () => {
  it("should have definitions for all signals in SIGNALS_ALL", () => {
    for (const key of SIGNALS_ALL) {
      expect(SIGNAL_DEFINITIONS_MAP[key as keyof typeof SIGNAL_DEFINITIONS_MAP]).toBeDefined();
    }
  });

  it("should have valid dynamics for Dopamine", () => {
    const def = SIGNAL_DEFINITIONS_MAP.dopamine;
    expect(def.key).toBe("dopamine");
    expect(def.dynamics.tau).toBe(120);
  });
});
