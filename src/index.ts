//index.ts will export the module's main functionality.
import * as sc from "./smartctl/smartctl";

export const SmartCtlBinder = sc.SmartCtlWrapper;
export const SmartCtl = sc.SmartCtl;