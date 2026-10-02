import { formatTime } from "./format";

describe("formatTime", () => {
  it("formata o cronômetro como m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9.9)).toBe("0:09");
    expect(formatTime(83.4)).toBe("1:23");
    expect(formatTime(600)).toBe("10:00");
  });
});
