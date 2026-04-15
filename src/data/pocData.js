// FILE: src/data/pocData.js
/**
 * Proof-of-Concept data (placeholders).
 *
 * Editing guide:
 * - Most future edits happen here.
 * - Add/modify campaigns, commanders, awards, members as plain objects.
 * - Views rely on lookup maps: campaignById, awardById, memberById.
 *
 * CSV integration later:
 * - Keep the exported array names stable (campaigns, commanders, awardsCatalog, membersCatalog).
 * - Replace their contents with parsed CSV rows; keep ids stable.
 */

export const pocConfig = {
  /** Hall of Fame threshold: any award with level >= this value shows up */
  minHallOfFameAwardLevel: 3,
};

/**
 * Campaigns
 * - overview fields used by cards
 * - orgChart + operations used by campaign modal
 * - perUnitRoster is intended for unit leads (placeholder)
 */
export const campaigns = [
  {
    id: "op-bravo",
    name: "Operation BRAVO",
    status: "active",
    startDate: "2026-01-10",
    endDate: "2026-02-05",
    quarter: "2026 Q1",
    overview:
      "Sample active campaign focused on interdiction, reconnaissance, and stability operations.",

    orgChart: {
      taskForceName: "CENTCOM Task Force Atlas",
      taskForceHQ: { name: "TF Atlas HQ", commander: "Callsign Atlas" },
      taskUnits: [
        {
          name: "Task Unit 1",
          hq: { name: "TU1 HQ", commander: "Callsign Viper" },
          units: ["1st Marines", "2nd Recon", "Aviation Detachment A"],
        },
        {
          name: "Task Unit 2",
          hq: { name: "TU2 HQ", commander: "Callsign Nomad" },
          units: ["75th Rangers", "Armor Detachment B", "Combat Support C"],
        },
      ],
    },

    operations: [
      {
        id: "bravo-001",
        date: "2026-01-10",
        title: "Recon in Force",
        status: "completed", // completed | failed | pending
        opordTitle: "OPORD 001",
        opordSummary:
          "Probe enemy lines, identify supply routes, and capture map intel from comms relay.",
        opordUrl: "#",
      },
      {
        id: "bravo-002",
        date: "2026-01-17",
        title: "Seize Airfield",
        status: "pending",
        opordTitle: "OPORD 002",
        opordSummary: "Secure the runway and establish a forward refuel point.",
        opordUrl: "#",
      },
      {
        id: "bravo-003",
        date: "2026-01-24",
        title: "Interdict Convoy",
        status: "failed",
        opordTitle: "OPORD 003",
        opordSummary: "Intercept armored convoy moving along MSR Green.",
        opordUrl: "#",
      },
    ],

    perUnitRoster: [
      {
        unitName: "1st Marines",
        members: [
          { name: "J. Carter", role: "Squad Lead" },
          { name: "M. Reyes", role: "Rifleman" },
        ],
      },
      {
        unitName: "75th Rangers",
        members: [{ name: "A. Kim", role: "Team Lead" }],
      },
    ],
  },
  {
    id: "op-alpha",
    name: "Operation ALPHA",
    status: "completed",
    startDate: "2025-10-12",
    endDate: "2025-11-23",
    quarter: "2025 Q4",
    overview:
      "Sample completed campaign with archived operations and finalized command structure.",

    orgChart: {
      taskForceName: "CENTCOM Task Force Orion",
      taskForceHQ: { name: "TF Orion HQ", commander: "Callsign Orion" },
      taskUnits: [
        {
          name: "Task Unit 3",
          hq: { name: "TU3 HQ", commander: "Callsign Ember" },
          units: ["Mechanized Platoon", "Infantry Company", "Logistics Cell"],
        },
      ],
    },

    operations: [
      {
        id: "alpha-001",
        date: "2025-10-12",
        title: "Establish Foothold",
        status: "completed",
        opordTitle: "OPORD A-01",
        opordSummary: "Secure initial landing zone and set up perimeter.",
        opordUrl: "#",
      },
    ],

    perUnitRoster: [
      {
        unitName: "Infantry Company",
        members: [{ name: "S. Patel", role: "CO" }],
      },
    ],
  },
];

/**
 * Commanders
 * - campaignId links a commander to a campaign
 * - awards can be award IDs or award names (awardById supports both)
 */
export const commanders = [
  {
    id: "cmdr-atlas",
    name: "Callsign Atlas",
    unit: "TF Atlas HQ",
    position: "Task Force Commander",
    campaignId: "op-bravo",
    campaignStatus: "active",
    awards: ["Distinguished Service Cross"],
  },
  {
    id: "cmdr-orion",
    name: "Callsign Orion",
    unit: "TF Orion HQ",
    position: "Task Force Commander",
    campaignId: "op-alpha",
    campaignStatus: "completed",
    awards: ["Silver Star"],
  },
];

/**
 * Awards catalog
 * - level drives Hall of Fame thresholding
 */
export const awardsCatalog = [
  { id: "aw-bronze", name: "Bronze Star", level: 2 },
  { id: "aw-silver", name: "Silver Star", level: 3 },
  { id: "aw-dsc", name: "Distinguished Service Cross", level: 5 },
];

/**
 * Members catalog
 * - positions: CENTCOM roles held
 * - awards: award IDs or award names
 * - campaigns: campaign IDs attended
 */
export const membersCatalog = [
  {
    id: "m-1",
    name: "J. Carter",
    unit: "1st Marines",
    positions: ["Squad Lead"],
    awards: ["Bronze Star"],
    campaigns: ["op-bravo"],
  },
  {
    id: "m-2",
    name: "S. Patel",
    unit: "Infantry Company",
    positions: ["Company Commander"],
    awards: ["Silver Star"],
    campaigns: ["op-alpha"],
  },
];

/**
 * Lookup helpers used by views
 * - campaignById: campaignId -> campaign object
 * - awardById: supports both award id and award name as keys
 * - memberById: memberId -> member object
 */
export const campaignById = Object.fromEntries(
  (campaigns || []).map((c) => [c.id, c]),
);

export const awardById = Object.fromEntries(
  (awardsCatalog || []).flatMap((a) =>
    [
      [a.id, a],
      [a.name, a],
    ].filter(([k]) => k != null),
  ),
);

export const memberById = Object.fromEntries(
  (membersCatalog || []).map((m) => [m.id, m]),
);
