import { describe, it, expect } from "vitest";
import { filterRecords, sortRecords, facets } from "@/lib/admin";
import type { AuditRecord } from "@/lib/types";

const recs: AuditRecord[] = [
  {
    serial: 1,
    tin: "100000000001",
    zone: "Taxes Zone-1, Dhaka",
    circle: "Circle-1",
    submissionType: "Normal",
    assessmentYear: "2023-2024",
  },
  {
    serial: 2,
    tin: "100000000002",
    zone: "Taxes Zone-2, Dhaka",
    circle: "Circle-2",
    submissionType: "Universal Self-Assessment",
    assessmentYear: "2023-2024",
  },
  {
    serial: 3,
    tin: "100000000003",
    zone: "Taxes Zone-1, Dhaka",
    circle: "Circle-1",
    submissionType: "Spot Assessment",
    assessmentYear: "2023-2024",
  },
];

describe("filterRecords", () => {
  it("filters by exact tin", () => {
    expect(filterRecords(recs, { tin: "100000000002" })).toHaveLength(1);
  });
  it("filters by zone", () => {
    expect(filterRecords(recs, { zone: "Taxes Zone-1, Dhaka" })).toHaveLength(2);
  });
  it("filters by submission type", () => {
    expect(
      filterRecords(recs, { submissionType: "Spot Assessment" }),
    ).toHaveLength(1);
  });
  it("query matches zone/circle text case-insensitively", () => {
    expect(filterRecords(recs, { query: "zone-2" })).toHaveLength(1);
  });
  it("never matches a TIN via the free-text query", () => {
    // Free-text must not enable TIN enumeration in admin browse.
    expect(filterRecords(recs, { query: "100000000001" })).toHaveLength(0);
  });
});

describe("sortRecords", () => {
  it("sorts by serial descending", () => {
    const out = sortRecords(recs, "serial", "desc");
    expect(out.map((r) => r.serial)).toEqual([3, 2, 1]);
  });
  it("sorts by zone ascending with numeric awareness", () => {
    const out = sortRecords(recs, "zone", "asc");
    expect(out[0]?.zone).toBe("Taxes Zone-1, Dhaka");
  });
});

describe("facets", () => {
  it("returns unique sorted facet values", () => {
    const f = facets(recs);
    expect(f.zones).toEqual(["Taxes Zone-1, Dhaka", "Taxes Zone-2, Dhaka"]);
    expect(f.circles).toEqual(["Circle-1", "Circle-2"]);
    expect(f.submissionTypes).toHaveLength(3);
  });
});
