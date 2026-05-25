import { identityService } from "./identityService";
import { competitionService } from "./competitionService";
import { rosterService } from "./rosterService";
import { matchService } from "./matchService";
import { awardsService } from "./awardsService";
import { alertsService } from "./alertsService";

export { identityService } from "./identityService";
export { competitionService } from "./competitionService";
export { rosterService } from "./rosterService";
export { matchService } from "./matchService";
export { awardsService } from "./awardsService";
export { alertsService } from "./alertsService";

export const adminService = {
  ...identityService,
  ...competitionService,
  ...rosterService,
  ...matchService,
  ...awardsService,
  ...alertsService,
};
