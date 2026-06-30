import { describe, it, expect } from "vitest";
import {
  normalizeZone,
  normalizeSubmissionType,
  normalizeCircle,
  normalizeCity,
} from "@/lib/normalize";

describe("normalizeZone", () => {
  it("keeps a canonical zone unchanged", () => {
    expect(normalizeZone("Taxes Zone-16, Dhaka")).toBe("Taxes Zone-16, Dhaka");
  });
  it("repairs the PDF line-wrap artefact", () => {
    expect(normalizeZone("16, Dhaka")).toBe("Taxes Zone-16, Dhaka");
  });
  it("unifies lowercase casing", () => {
    expect(normalizeZone("taxes zone-3, dhaka")).toBe("Taxes Zone-3, Dhaka");
  });
  it("unifies uppercase casing", () => {
    expect(normalizeZone("TAXES ZONE-1, DHAKA")).toBe("Taxes Zone-1, Dhaka");
  });
  it("handles a cityless zone (no number)", () => {
    expect(normalizeZone("TAXES ZONE, KHULNA")).toBe("Taxes Zone, Khulna");
  });
  it("collapses extra whitespace", () => {
    expect(normalizeZone("  Taxes   Zone-5,   Dhaka ")).toBe(
      "Taxes Zone-5, Dhaka",
    );
  });
  it("returns empty string for empty input", () => {
    expect(normalizeZone("")).toBe("");
  });
});

describe("normalizeCity", () => {
  it("canonicalises spelling variants", () => {
    expect(normalizeCity("chittagong")).toBe("Chattogram");
    expect(normalizeCity("COMILLA")).toBe("Cumilla");
    expect(normalizeCity("barisal")).toBe("Barishal");
  });
});

describe("normalizeSubmissionType", () => {
  it("maps universal self-assessment variants", () => {
    expect(normalizeSubmissionType("Universal Self-Assessment")).toBe(
      "Universal Self-Assessment",
    );
    expect(normalizeSubmissionType("self assessment")).toBe(
      "Universal Self-Assessment",
    );
    expect(normalizeSubmissionType("USA")).toBe("Universal Self-Assessment");
  });
  it("maps spot and normal", () => {
    expect(normalizeSubmissionType("Spot Assessment")).toBe("Spot Assessment");
    expect(normalizeSubmissionType("normal")).toBe("Normal");
  });
  it("returns null for unknown types", () => {
    expect(normalizeSubmissionType("mystery")).toBeNull();
  });
});

describe("normalizeCircle", () => {
  it("normalises circle tokens", () => {
    expect(normalizeCircle("circle 5")).toBe("Circle-5");
    expect(normalizeCircle("Circle-12")).toBe("Circle-12");
    expect(normalizeCircle(" CIRCLE-301 ")).toBe("Circle-301");
  });
});
