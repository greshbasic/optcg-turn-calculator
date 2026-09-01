import { describe, it, expect } from "vitest";
import { sortByPlayRate } from "./sortOptions";

describe("sortByPlayRate", () => {
  it("orders options by descending play rate", () => {
    const options = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Bravo" },
      { id: "c", name: "Charlie" },
    ];
    const playRateByKey = new Map([
      ["a", 0.1],
      ["b", 0.5],
      ["c", 0.3],
    ]);

    expect(sortByPlayRate(options, playRateByKey).map((o) => o.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("treats missing play-rate entries as 0", () => {
    const options = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Bravo" },
    ];
    const playRateByKey = new Map([["b", 0.2]]);

    expect(sortByPlayRate(options, playRateByKey).map((o) => o.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("does not mutate the input array", () => {
    const options = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Bravo" },
    ];
    const playRateByKey = new Map([
      ["a", 0.1],
      ["b", 0.9],
    ]);

    sortByPlayRate(options, playRateByKey);

    expect(options.map((o) => o.id)).toEqual(["a", "b"]);
  });
});
