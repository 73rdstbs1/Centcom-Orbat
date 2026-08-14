// src/campaigns/Operation_FIRMHAND/campaign.js
//
// This is a fully commented example campaign file for Operation: FIRM HAND.
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
  id: "Operation_FIRMHAND",

  // Public campaign title shown on the website.
  name: "Operation: FIRM HAND",

  // Current campaign status.
  status: "Preparing for Deployment",

  // Higher-level region / system.
  system: "Lsita System",

  // Primary planet / world.
  planet: "Vandros",

  // Area of operations.
  ao: "Gulfcoast Region",

  // Theatre label shown in the UI.
  theatre: "Outer Colonies Central Command",

  // Date the campaign begins.
  // Format must be YYYY-MM-DD.
  startDate: "2526-10-08",

  // Date the campaign ends.
  // Leave blank if the campaign is still ongoing.
  endDate: "",

  // Human-readable location line.
  location: "Lsita System",

  // Brief summary of the campaign.
  // Keep this to 1-3 sentences.
  overview:
    "A heavily industrialized and rebellious human colony world, officially named 'Vandros', located in the Outer Rim of human-controlled space in the Lsita System. The world has recently seen increased insurgent activity from the Outer Colony Liberation Front (OCLF), a well-organized group of Insurrectionists fighting for independence from the UNSC.",

  command: {
    // Main campaign commander shown at the top of the command section.
    commander: {
      // Name and rank displayed for the campaign commander.
      name: "",

      // Unit label shown with that commander.
      unitName: "Task Force Commander",

      // Portrait path.
      // Leave blank if there is no portrait yet. use .SVG file format
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
        name: "",

        // IMPORTANT:
        // This should usually match the task force name in `taskForces`.
        unitName: "",

        // Leave blank if no portrait exists yet.
        portrait: "",

        // Display role for this commander.
        role: "",

        // Optional deputy for this task force.
        // Leave `name` blank if there is no deputy.
        deputyCommander: {
          name: "",
          unitName: "",
          portrait: "",
          role: "",
        },
      },

      {
        name: "",
        unitName: "",
        portrait: "",
        role: "",

        deputyCommander: {
          name: "",
          unitName: "",
          portrait: "",
          role: "",
        },
      },
    ],
  },

  taskForces: [
    {
      // Task force name shown on the campaign page.
      // Best practice: match the related subCommander.unitName above.
      name: "Task Unit Bravo",

      // Person leading this task force.
      // Best practice: match the related subCommander.name above.
      commanderName: "",

      // Patch / emblem image path for the task force.
      // Leave blank if you do not have a patch yet.
      patch: "",

      // Units assigned to this task force.
      // THESE MUST MATCH THE UNIT NAMES USED IN THE GOOGLE SHEET.
      units: [""],
    },

    {
      name: "",
      commanderName: "",
      patch: "",
      units: [""],
    },
  ],

  // No operationsIndex block is included here.
  // Campaign operations should be discovered automatically from the Google Sheet.
};
