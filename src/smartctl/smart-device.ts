import { SmartXallResponse } from "./typings/responses/xall-response";
import { SmartAllResponse, AtaSelfTest, AtaSmartErrorLog } from "./typings/responses/all-response";
import { SmartAttribute } from "./typings/responses/fragments";
import { SmartCtlBinder } from "./smartctl";
import { Observable, Subject } from "rxjs";

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

    test(type: "short"|"long"){
        let progress_subj = new Subject<number>();
        SmartCtlBinder.test(this.device_node, type);
        let poll = async () => {
            let poll_interval = 1000;//ms
            let progress = 0;
            let testing = true;
            while (testing) {
                await new Promise((resolve) => {setTimeout(() => {resolve();}, poll_interval)})
                let info = await SmartCtlBinder.all(this.device_node);
                testing = await SmartCtlBinder.testing(this.device_node);
                if(testing){
                    let prog = 100 - ((info.ata_smart_data.self_test.status.value - 240) * 10);
                    if(prog != progress){
                        progress = prog;
                        progress_subj.next(progress);
                    }
                }
            }
            progress_subj.complete();
        }

        poll();
        
        return progress_subj.asObservable();
    }

}