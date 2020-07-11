import { SmartDeviceInfo } from "./fragments";
import { SmartBaseResponse } from "./base-response";

export interface SmartDeviceResponse extends SmartBaseResponse{
    device: SmartDeviceInfo;
}