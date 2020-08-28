import { SmartXallResponse } from "./typings/responses/xall-response";
import { SmartAllResponse, AtaSelfTest, AtaSmartErrorLog } from "./typings/responses/all-response";
import { SmartAttribute } from "./typings/responses/fragments";
import { SmartCtlWrapper } from "./smartctl";
import { Observable, Subject } from "rxjs";
import { SmartTestType, SmartTest } from "./smart_test";

export interface ISmartDeviceStats{
    overall_pass: boolean;
    tests: AtaSelfTest[];
    errors?: any[];
    attributes: SmartAttribute[];
}

export interface ISmartDevice extends ISmartDeviceStats{
    serial: string;
    wwn: string|any;
    model: string;
    firmware_version: string;
    capacity: number;
    device_node: string;
}

export class SmartDevice implements ISmartDevice{
    serial: string;
    wwn: string;
    model: string;
    firmware_version: string;
    capacity: number;
    device_node: string;
    overall_pass: boolean;
    tests: AtaSelfTest[];
    errors?: any[];
    attributes: SmartAttribute[];

    constructor(device_data: ISmartDevice){
        this.serial = device_data.serial;
        this.wwn = device_data.wwn;
        this.model = device_data.model;
        this.firmware_version = device_data.firmware_version;
        this.capacity = device_data.capacity;
        this.device_node = device_data.device_node;
        this.overall_pass = device_data.overall_pass;
        this.tests = device_data.tests;
        this.errors = device_data.errors;
        this.attributes = device_data.attributes;
    }

    /**Creates a test object and returns it */
    test(type: SmartTestType){
        let t = new SmartTest(type, this, true);
        return t;
    }

}