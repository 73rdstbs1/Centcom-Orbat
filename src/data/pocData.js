export const pocConfig = {
  minHallOfFameAwardLevel: 3,
};

export const campaigns = [
  {
    id: "op-bravo",
    name: "Operation BRAVO",
    status: "active",
    startDate: "2026-01-10",
    endDate: "2026-02-05",
    quarter: "2026 Q1",
    overview:
      "Another sample campaign that is currently active. Focused on interdiction, reconnaissance, and stability operations.",

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
        status: "completed",
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
      "A completed sample campaign with archived operations and finalized command structure.",
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
      { unitName: "Infantry Company", members: [{ name: "S. Patel", role: "CO" }] },
    ],
  },
];

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
];

export const awardsCatalog = [
  { id: "aw-1", name: "Bronze Star", level: 2 },
  { id: "aw-2", name: "Silver Star", level: 3 },
  { id: "aw-3", name: "Distinguished Service Cross", level: 5 },
];

export const membersCatalog = [
  {
    id: "m-1",
    name: "J. Carter",
    unit: "1st Marines",
    positions: ["Squad Lead"],
    awards: ["Bronze Star"],
    campaigns: ["op-bravo"],
  },
];
