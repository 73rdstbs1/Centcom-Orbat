// src/Templates/Template_Campaign.js
//
// COPY THIS FILE when making a new campaign.
//
// HOW TO USE THIS FILE
// -----------------------------------------------------------------------------
// 1) Copy this file into a new folder inside /src/campaigns/
// 2) Rename the folder to match your campaign ID
// 3) Rename this file to: campaign.js
// 4) Replace the example values with your real campaign information
// 5) Keep all commas, quotation marks, { }, and [ ]
// 6) You can keep these // comments in place
//
// IMPORTANT
// -----------------------------------------------------------------------------
// - Operations are NOT written in this file.
//   The website pulls operations from your Google Sheet automatically.
// - Portrait fallback images are NOT configured here.
//   If a portrait is blank, the Hall of Commanders view should handle the fallback.
// - Deputy commanders are optional.
//   If a deputy commander's name is left blank, they should not appear on the site.
// - Unit names matter.
//   Unit names in this file should match the unit names used in your Google Sheet.

export default {
  // Internal campaign ID.
  // Best practice: keep this the same as the folder name.
  id: "Operation_Test_Name",

  // Public campaign title shown on the website.
  name: "Operation: Test Name",

  // Campaign status used by filters and labels on the site.
  // Common options:
  // "active", "completed", "training", "deployed", "archived"
  status: "active",

  // Star system or wider region.
  system: "Epsilon Eridani",

  // Primary planet or world.
  planet: "Reach",

  // Area of operations.
  ao: "Viery Territory",

  // Theatre label used in the UI.
  theatre: "CENTCOM / REACH AO",

  // Start date in YYYY-MM-DD format.
  startDate: "2026-01-10",

  // End date in YYYY-MM-DD format.
  // Leave this blank if the campaign is still ongoing.
  endDate: "",

  // Human-readable location line.
  // This is usually shown exactly as written.
  location: "Reach / Viery Territory",

  // Short campaign summary.
  // Aim for 1 to 3 sentences.
  overview:
    "Replace this with a short summary explaining what the campaign is about, where it takes place, and what the force is trying to achieve.",

  command: {
    // Main campaign commander.
    commander: {
      // Rank and name shown on the website.
      name: "CPT John Doe",

      // Unit or command label shown with this commander.
      unitName: "Task Force Command",

      // Portrait image path.
      // Leave blank if you do not have a portrait yet.
      portrait: "",

      // Role or title shown under the commander's name.
      role: "Task Force Commander",
    },

    // Optional deputy for the main campaign commander.
    // Leave the name blank if you do not want a deputy shown.
    deputyCommander: {
      name: "",
      unitName: "Task Force Command",
      portrait: "",
      role: "Deputy Task Force Commander",
    },

    // These are the commanders for each task unit / sub-command.
    // Add or remove entries as needed.
    subCommanders: [
      {
        // Rank and name of this unit commander.
        name: "MAJ Jane Roe",

        // This should match the related task force name below.
        unitName: "Task Unit Bumbo",

        // Portrait image path for this commander.
        // Leave blank if none exists yet.
        portrait: "",

        // Role or title shown under the name.
        role: "Task Unit Commander",

        // Optional deputy for this specific unit.
        // Leave the name blank if you do not want a deputy shown.
        deputyCommander: {
          name: "",
          unitName: "Task Unit Bumbo",
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
          unitName: "Task Unit Atombo",
          portrait: "",
          role: "Deputy Task Unit Commander",
        },
      },
    ],
  },

  // Task force blocks shown on the campaign page.
  taskForces: [
    {
      // Name of the task force or task unit.
      // Best practice: match the related subCommander unitName exactly.
      name: "Task Unit Bumbo",

      // Name of the commander for this task force.
      // Best practice: match the related subCommander name exactly.
      commanderName: "MAJ Jane Roe",

      // Unit patch / emblem image path.
      // Leave blank if none exists yet.
      patch: "",

      // Units assigned to this task force.
      // These names should match the names used in your Google Sheet.
      units: ["1st Marines", "77th Air Wing"],
    },
    {
      name: "Task Unit Atombo",
      commanderName: "CWO Alex Smith",
      patch: "",
      units: ["1st Marines"],
    },
  ],
};
