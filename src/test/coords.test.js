import { describe, it, expect } from "vitest";
import {
  getSafeMapLocation,
  hasValidCoords,
  POLAND_CENTER,
} from "../components/events/coords";

describe("event coordinate helpers", () => {
  it("accepts only finite coordinates within map bounds", () => {
    expect(hasValidCoords({ lat: 52.2, lon: 21.0 })).toBe(true);
    expect(hasValidCoords({ lat: 91, lon: 21.0 })).toBe(false);
    expect(hasValidCoords({ lat: 52.2, lon: 181 })).toBe(false);
    expect(hasValidCoords({ lat: "52.2", lon: "21.0" })).toBe(true);
    expect(hasValidCoords({ lat: "abc", lon: 21.0 })).toBe(false);
  });

  it("falls back to a safe map location for invalid input", () => {
    expect(getSafeMapLocation({ lat: 999, lon: 999 })).toEqual(POLAND_CENTER);
    expect(getSafeMapLocation(null)).toEqual(POLAND_CENTER);
  });
});
