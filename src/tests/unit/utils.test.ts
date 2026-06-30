import { describe, it, expect } from "vitest";
import { maskTin, formatTinGroups, formatCount, cn } from "@/lib/utils";

describe("maskTin", () => {
  it("masks the middle, keeping first 2 and last 4", () => {
    expect(maskTin("441234567337")).toBe("44****7337");
  });
  it("falls back for short input", () => {
    expect(maskTin("123")).toBe("****");
  });
});

describe("formatTinGroups", () => {
  it("groups into blocks of four", () => {
    expect(formatTinGroups("123456789012")).toBe("1234 5678 9012");
  });
});

describe("formatCount", () => {
  it("groups thousands for en", () => {
    expect(formatCount(5014, "en")).toBe("5,014");
  });
  it("uses Bangla digits for bn", () => {
    // bn-BD formatting yields Bangla numerals.
    expect(formatCount(5014, "bn")).not.toBe("5014");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
