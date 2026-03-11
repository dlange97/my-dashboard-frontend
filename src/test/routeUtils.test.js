import { describe, it, expect } from "vitest";
import { getDistanceInMeters, polylineDistance } from "../utils/routeUtils";

// ── getDistanceInMeters ──────────────────────────────────────────────────
describe("getDistanceInMeters", () => {
  it("returns 0 for identical points", () => {
    expect(getDistanceInMeters(52.0, 19.0, 52.0, 19.0)).toBe(0);
  });

  it("calculates roughly correct distance between two Warsaw coords (~1.4 km)", () => {
    // Approx 1.4 km apart along latitude
    const d = getDistanceInMeters(52.2297, 21.0122, 52.2297, 21.0297);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(2000);
  });

  it("is symmetric – d(A→B) ≈ d(B→A)", () => {
    const d1 = getDistanceInMeters(52.0, 19.0, 52.5, 19.5);
    const d2 = getDistanceInMeters(52.5, 19.5, 52.0, 19.0);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

// ── polylineDistance ─────────────────────────────────────────────────────
describe("polylineDistance", () => {
  it("returns 0 for empty or single-point arrays", () => {
    expect(polylineDistance([])).toBe(0);
    expect(polylineDistance([[19.0, 52.0]])).toBe(0);
    expect(polylineDistance(null)).toBe(0);
    expect(polylineDistance(undefined)).toBe(0);
  });

  it("returns the sum of individual segment distances", () => {
    const coords = [
      [19.0, 52.0],
      [19.1, 52.0],
      [19.2, 52.0],
    ];
    const total = polylineDistance(coords);
    const seg1 = getDistanceInMeters(52.0, 19.0, 52.0, 19.1);
    const seg2 = getDistanceInMeters(52.0, 19.1, 52.0, 19.2);
    expect(total).toBeCloseTo(seg1 + seg2, 3);
  });

  it("uses GeoJSON coordinate order [lon, lat]", () => {
    // A horizontal line (constant lat) going east should have a measurable length
    const coords = [
      [19.0, 52.0],
      [19.5, 52.0],
    ];
    const d = polylineDistance(coords);
    expect(d).toBeGreaterThan(30_000); // ~35 km
    expect(d).toBeLessThan(45_000);
  });
});
