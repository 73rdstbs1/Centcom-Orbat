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
  status: "active",

  // Higher-level region / system.
  system: "Epsilon Eridani",

  // Primary planet / world.
  planet: "Reach",

  // Area of operations.
  ao: "Viery Territory",

  // Theatre label shown in the UI.
  theatre: "CENTCOM / REACH AO",

  // Date the campaign begins.
  // Format must be YYYY-MM-DD.
  startDate: "2026-01-10",

  // Date the campaign ends.
  // Leave blank if the campaign is still ongoing.
  endDate: "",

  // Human-readable location line.
  location: "Reach / Viery Territory",

  // Brief summary of the campaign.
  // Keep this to 1-3 sentences.
  overview:
    "Replace this text with a short summary of Operation: SUNSPEAR, including where it takes place and what the force is trying to achieve.",

  command: {
    // Main campaign commander shown at the top of the command section.
    commander: {
      // Name and rank displayed for the campaign commander.
      name: "CPT John Doe",

      // Unit label shown with that commander.
      unitName: "Task Force Command",

      // Portrait path.
      // Leave blank if there is no portrait yet.
      portrait: "",

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
        name: "MAJ Jane Roe",

        // IMPORTANT:
        // This should usually match the task force name in `taskForces`.
        unitName: "Task Unit Bumbo",

        // Leave blank if no portrait exists yet.
        portrait: "",

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
        name: "CWO Alex Smith",
        unitName: "Task Unit Atombo",
        portrait: "",
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
      name: "Task Unit Bumbo",

      // Person leading this task force.
      // Best practice: match the related subCommander.name above.
      commanderName: "MAJ Jane Roe",

      // Patch / emblem image path for the task force.
      // Leave blank if you do not have a patch yet.
      patch: "",

      // Units assigned to this task force.
      // THESE MUST MATCH THE UNIT NAMES USED IN THE GOOGLE SHEET.
      units: ["1st Marines", "77th Air Wing"],
    },

    {
      name: "Task Unit Atombo",
      commanderName: "CWO Alex Smith",
      patch: "",
      units: ["1st Marines"],
    },
  ],

  // No operationsIndex block is included here.
  // Campaign operations should be discovered automatically from the Google Sheet.
};
