import { SmartXallResponse } from "./typings/xall-response";
import { SmartAllResponse, AtaSelfTest } from "./typings/all-response";

export interface ISmartDeviceStats{
    overall_assessment: boolean;
    tests: AtaSelfTest[];

}

export interface ISmartDevice extends ISmartDeviceStats{
    serial: string;
    wwn: string;
    model: string;
    firmware_version: string;
    capacity: number;
    device_node: string;
}