import { SmartBaseResponse } from "./base-response";
import { SmartDeviceInfo } from "./fragments";

/**
 * Structure for response from using `smartctl -j --scan` or `--scan-open`
 */
export interface SmartScanResponse extends SmartBaseResponse{
    devices: SmartDeviceInfo[];
}