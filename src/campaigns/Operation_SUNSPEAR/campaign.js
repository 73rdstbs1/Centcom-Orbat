// src/campaigns/Operation_SUNSPEAR/campaign.js
//
// This is a fully commented example campaign file for Operation: SUNSPEAR.
//
// You can keep all of these comments in the file.
// Just replace the example values with the real campaign data when you have it.
//
// IMPORTANT NOTES:
// - This file does NOT include a portrait fallback section.
//   If a portrait is blank, the Hall of Commanders can use its own fallback.
// - This file does NOT include an operationsIndex section.
//   Operations for the campaign should be pulled from the Google Sheet CSV.
// - Unit names matter. Try to match the unit names used in your Google Sheet.

export default {
  // Internal campaign ID.
  // This should usually match the campaign folder name.
  id: "Operation_SUNSPEAR",

  // Public campaign title shown on the website.
  name: "Operation: SUNSPEAR",

  // Current campaign status.
  status: "completed",

  // Higher-level region / system.
  system: "Tirsol System",

  // Primary planet / world.
  planet: "Tirsol IV",

  // Area of operations.
  ao: "City of Fallujamadi",

  // Theatre label shown in the UI.
  theatre: "Outer Colonies Central Command",

  // Date the campaign begins.
  // Format must be YYYY-MM-DD.
  startDate: "2526-03-12",

  // Date the campaign ends.
  // Leave blank if the campaign is still ongoing.
  endDate: "2526-04-02",

  // Human-readable location line.
  location: "Tirsol System",

  // Brief summary of the campaign.
  // Keep this to 1-3 sentences.
  overview:
    "The city of Fallujamadi, a region on the planet of Tirsol I, has been overrun by the Tirsoli Liberation Front (TLF), an offshoot of the URF, since the UEG stopped paying attention to the region. This has caused significant harm to civilian infrastructure, and hinders basic human needs from reaching the overarching population.",

  command: {
    // Main campaign commander shown at the top of the command section.
    commander: {
      // Name and rank displayed for the campaign commander.
      name: "B. Smith",

      // Unit label shown with that commander.
      unitName: "Task Force Commander",

      // Portrait path.
      // Leave blank if there is no portrait yet. use .SVG file format
      portrait: "/portraits/BSmith_portrait.svg",

      // Role text shown for the main commander.
      role: "Task Force Commander",
    },

    // Optional deputy for the main campaign commander.
    // If `name` is blank, this deputy should not appear.
    deputyCommander: {
      // Leave blank to hide the deputy.
      name: "",

      // Usually the same command element as the main commander.
      unitName: "",

      // Leave blank if there is no portrait yet.
      portrait: "",

      // Display title for the deputy.
      role: "Deputy Task Force Commander",
    },

    // Commanders for each subordinate task force / unit.
    subCommanders: [
      {
        // Name and rank of the unit commander.
        name: "J. Reaper",

        // IMPORTANT:
        // This should usually match the task force name in `taskForces`.
        unitName: "Task Unit Apollo",

        // Leave blank if no portrait exists yet.
        portrait: "/portraits/JReaper_portrait.svg",

        // Display role for this commander.
        role: "Task Unit Commander",

        // Optional deputy for this task force.
        // Leave `name` blank if there is no deputy.
        deputyCommander: {
          name: "",
          unitName: "",
          portrait: "",
          role: "Deputy Task Unit Commander",
        },
      },

      {
        name: "B. Salmon",
        unitName: "Task Unit Bailiff",
        portrait: "/portraits/BSalmon_portrait.svg",
        role: "Task Unit Commander",
        deputyCommander: {
          name: "",
          unitName: "",
          portrait: "",
          role: "Deputy Task Unit Commander",
        },
      },
    ],
  },

  taskForces: [
    {
      // Task force name shown on the campaign page.
      // Best practice: match the related subCommander.unitName above.
      name: "Task Unit Apollo",

      // Person leading this task force.
      // Best practice: match the related subCommander.name above.
      commanderName: "J. Reaper",

      // Patch / emblem image path for the task force.
      // Leave blank if you do not have a patch yet.
      patch: "",

      // Units assigned to this task force.
      // THESE MUST MATCH THE UNIT NAMES USED IN THE GOOGLE SHEET.
      units: [
        "6th Shock Troops Battalion",
        "73rd Marine Force Recon",
        "105th Shock Troops Battalion",
      ],
    },

    {
      name: "Task Unit Bailiff",
      commanderName: "B. Salmon",
      patch: "",
      units: [
        "73rd Shock Troops Battalion",
        "150th Regimental Reconnaissance Group",
      ],
    },
  ],

  // No operationsIndex block is included here.
  // Campaign operations should be discovered automatically from the Google Sheet.
};
