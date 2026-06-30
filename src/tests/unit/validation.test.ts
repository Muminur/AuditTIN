import { describe, it, expect } from "vitest";
import {
  tinSchema,
  classifyTin,
  adminSearchSchema,
  lookupQuerySchema,
} from "@/lib/validation";

describe("tinSchema", () => {
  it("accepts exactly 12 digits", () => {
    expect(tinSchema.safeParse("123456789012").success).toBe(true);
  });
  it("rejects fewer than 12 digits", () => {
    expect(tinSchema.safeParse("12345").success).toBe(false);
  });
  it("rejects more than 12 digits", () => {
    expect(tinSchema.safeParse("1234567890123").success).toBe(false);
  });
  it("rejects non-digit characters", () => {
    expect(tinSchema.safeParse("12345678901a").success).toBe(false);
    expect(tinSchema.safeParse("1234-5678-901").success).toBe(false);
  });
  it("trims surrounding whitespace", () => {
    const r = tinSchema.safeParse("  123456789012  ");
    expect(r.success).toBe(true);
  });
});

describe("classifyTin", () => {
  it("flags empty input", () => {
    expect(classifyTin("")).toEqual({ ok: false, reason: "empty", length: 0 });
  });
  it("flags non-digit input and counts digits", () => {
    const r = classifyTin("12ab34");
    expect(r).toMatchObject({ ok: false, reason: "non_digit", length: 4 });
  });
  it("flags wrong length", () => {
    expect(classifyTin("123")).toMatchObject({
      ok: false,
      reason: "length",
      length: 3,
    });
  });
  it("accepts a valid TIN", () => {
    expect(classifyTin("123456789012")).toEqual({
      ok: true,
      tin: "123456789012",
    });
  });
});

describe("lookupQuerySchema", () => {
  it("requires a valid tin field", () => {
    expect(lookupQuerySchema.safeParse({ tin: "123456789012" }).success).toBe(
      true,
    );
    expect(lookupQuerySchema.safeParse({ tin: "x" }).success).toBe(false);
  });
});

describe("adminSearchSchema", () => {
  it("applies defaults", () => {
    const r = adminSearchSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(50);
    expect(r.sortBy).toBe("serial");
    expect(r.sortDir).toBe("asc");
  });
  it("coerces page numbers and clamps pageSize range", () => {
    expect(adminSearchSchema.safeParse({ pageSize: 5 }).success).toBe(false);
    expect(adminSearchSchema.safeParse({ pageSize: 500 }).success).toBe(false);
    expect(adminSearchSchema.parse({ page: "3" }).page).toBe(3);
  });
  it("rejects a malformed tin filter", () => {
    expect(adminSearchSchema.safeParse({ tin: "12" }).success).toBe(false);
  });
});
