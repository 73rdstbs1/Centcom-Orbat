// /src/data/pocData.js
/**
 * Proof-of-Concept data layer (local placeholders).
 *
 * Goal: make it dead-simple to edit content without touching Vue components.
 * Later: replace these exports with loaders that parse a Google Sheet CSV.
 *
 * Conventions:
 * - Use stable IDs (string) so you can reference people across campaigns/awards.
 * - Dates are ISO: YYYY-MM-DD (easy sort + spreadsheet-friendly).
 */

/** @typedef {{ id: string, name: string, unit: string }} UnitRef */
/** @typedef {{ id: string, label: string, level: number, date?: string, notes?: string }} Award */
/** @typedef {{ id: string, name: string, unit: string, centcomPositions: string[], awards: string[], campaignsAttended: string[] }} Member */
/** @typedef {{ id: string, title: string, date: string, opord: { title: string, summary: string, link?: string }, outcomes?: string[] }} Operation */
/** @typedef {{ id: string, title: string, era?: string, status: 'planned'|'active'|'completed'|'abandoned', startDate: string, endDate?: string, description?: string, operations: Operation[], rostersByUnit: Record<string, { unitName: string, members: { memberId: string, role?: string }[] }> }} Campaign */
/** @typedef {{ id: string, name: string, unit: string, position: string, campaignId: string, status: 'active'|'completed'|'kia'|'mia'|'relieved', awards: string[] }} Commander */

/**
 * Hall of Fame threshold:
 * - Only show awards with level >= minHallOfFameAwardLevel.
 * - Define award levels in `awardsCatalog` below.
 */
export const pocConfig = {
  minHallOfFameAwardLevel: 4,
};

/**
 * Single source of truth for awards and levels.
 * Keep IDs stable so you can reference them from members/commanders.
 */
export const awardsCatalog = /** @type {Award[]} */ ([
  { id: "A1", label: "Commendation", level: 2, notes: "For outstanding service." },
  { id: "A2", label: "Meritorious Service Medal", level: 3, notes: "For sustained achievement." },
  { id: "A3", label: "Distinguished Valor Cross", level: 4, notes: "For valor under fire." },
  { id: "A4", label: "Star of CentCom", level: 5, notes: "Highest award for extraordinary heroism." },
]);

export const membersCatalog = /** @type {Member[]} */ ([
  {
    id: "M-001",
    name: "Callsign 'Atlas'",
    unit: "1st Marines",
    centcomPositions: ["Task Unit XO", "S-3 Operations"],
    awards: ["A2", "A3"],
    campaignsAttended: ["C-ALPHA", "C-BRAVO"],
  },
  {
    id: "M-002",
    name: "Callsign 'Valkyrie'",
    unit: "7th Air Cav",
    centcomPositions: ["Task Force CO"],
    awards: ["A4"],
    campaignsAttended: ["C-ALPHA"],
  },
  {
    id: "M-003",
    name: "Callsign 'Mako'",
    unit: "1st Marines",
    centcomPositions: ["S-2 Intelligence"],
    awards: ["A1"],
    campaignsAttended: ["C-BRAVO"],
  },
]);

export const commanders = /** @type {Commander[]} */ ([
  {
    id: "CMD-001",
    name: "Callsign 'Valkyrie'",
    unit: "7th Air Cav",
    position: "CENTCOM Task Force Commander",
    campaignId: "C-ALPHA",
    status: "completed",
    awards: ["A4"],
  },
  {
    id: "CMD-002",
    name: "Callsign 'Atlas'",
    unit: "1st Marines",
    position: "CENTCOM Task Unit Commander",
    campaignId: "C-BRAVO",
    status: "active",
    awards: ["A3"],
  },
]);

export const campaigns = /** @type {Campaign[]} */ ([
  {
    id: "C-ALPHA",
    title: "OPERATION ALPHA",
    era: "2025 Q4",
    status: "completed",
    startDate: "2025-10-12",
    endDate: "2025-11-23",
    description: "Prototype campaign structure: operations with OPORD + per-unit rosters.",
    operations: [
      {
        id: "C-ALPHA-OP-001",
        title: "Insertion & Foothold",
        date: "2025-10-12",
        opord: {
          title: "OPORD 001",
          summary:
            "Secure landing zone, establish forward operating base, confirm intel on hostile presence.",
        },
        outcomes: ["FOB established", "Intel package recovered"],
      },
      {
        id: "C-ALPHA-OP-002",
        title: "Counter-attack",
        date: "2025-10-26",
        opord: {
          title: "OPORD 002",
          summary:
            "Disrupt enemy staging area, destroy AA assets, enable air corridor for resupply.",
        },
        outcomes: ["AA neutralized", "Resupply corridor opened"],
      },
    ],
    rostersByUnit: {
      "1st Marines": {
        unitName: "1st Marines",
        members: [
          { memberId: "M-001", role: "Platoon Lead" },
          { memberId: "M-003", role: "S-2 Liaison" },
        ],
      },
      "7th Air Cav": {
        unitName: "7th Air Cav",
        members: [{ memberId: "M-002", role: "Task Force CO" }],
      },
    },
  },
  {
    id: "C-BRAVO",
    title: "OPERATION BRAVO",
    era: "2026 Q1",
    status: "active",
    startDate: "2026-01-10",
    description: "Another sample campaign that is currently active.",
    operations: [
      {
        id: "C-BRAVO-OP-001",
        title: "Recon in Force",
        date: "2026-01-10",
        opord: {
          title: "OPORD 001",
          summary: "Probe enemy lines, identify supply routes, capture map intel from comms relay.",
        },
      },
    ],
    rostersByUnit: {
      "1st Marines": {
        unitName: "1st Marines",
        members: [{ memberId: "M-001", role: "Task Unit CO" }],
      },
    },
  },
]);

/**
 * Tiny helpers (keep in this file so non-coders have one place to edit).
 */
export function awardById(id) {
  return awardsCatalog.find(a => a.id === id) || null;
}

export function memberById(id) {
  return membersCatalog.find(m => m.id === id) || null;
}

export function campaignById(id) {
  return campaigns.find(c => c.id === id) || null;
}
