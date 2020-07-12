import { SmartCtlInfo } from "./fragments";

export interface SmartBaseResponse {
    /**The JSON formatting version */
    json_format_version: number[];
    /**Information about `smartctl` */
    smartctl: SmartCtlInfo
}