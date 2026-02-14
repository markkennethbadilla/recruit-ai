// AirTable compatibility layer — now backed by NocoDB (self-hosted, free)
// This file re-exports from lib/nocodb.ts so all existing imports keep working.

export { pushToAirTable, getAirTableRecords } from "./nocodb";
export { pushToNocoDB, getNocoDBRecords, checkNocoDBStatus } from "./nocodb";

// Legacy note: AirTable Cloud was removed because it's a paid service.
// NocoDB is a free, self-hosted AirTable-compatible alternative.
// See SPECS.md for architecture details.

