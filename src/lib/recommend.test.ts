import { describe, it, expect } from "vitest";
import { recommend } from "./recommend";

describe("recommend", () => {
  it("recommends FIRST when the first-turn win rate is higher", () => {
    expect(recommend(0.6, 0.4)).toBe("FIRST");
  });

  it("recommends SECOND when the second-turn win rate is higher", () => {
    // The plan's Sabo vs OP17-099 example.
    expect(recommend(0.503, 0.635)).toBe("SECOND");
  });

  it("returns EVEN when the rates are exactly equal", () => {
    expect(recommend(0.5, 0.5)).toBe("EVEN");
  });

  it("does not favor a side for tiny differences (still compares strictly)", () => {
    expect(recommend(0.5001, 0.5)).toBe("FIRST");
    expect(recommend(0.5, 0.5001)).toBe("SECOND");
  });

  it("recommends the side with data when the other side has none (null)", () => {
    expect(recommend(0.7, null)).toBe("FIRST");
    expect(recommend(null, 0.7)).toBe("SECOND");
  });

  it("returns EVEN when neither side has data", () => {
    expect(recommend(null, null)).toBe("EVEN");
  });

  it("handles 0 win rate as a real value, not missing data", () => {
    expect(recommend(0, 0.3)).toBe("SECOND");
    expect(recommend(0, null)).toBe("FIRST");
  });
});
