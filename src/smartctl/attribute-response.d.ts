import { SmartResponse } from "./base-response";

export type SmartDeviceInfo = {
    /**The device path of the device */
    name: string;
    info_name: string;
    type: string;
    protocol: string;
}

export interface SmartAttribute{
    id: number;
    name: string;
    value: number;
    worst: number;
    thresh: number;
    flags: {[index: string]: any};
    raw: {
        value: number;
        string: string;
    }
}

export interface SmartAttributeResponse extends SmartResponse {
    device: SmartDeviceInfo;

    ata_smart_attributes: {
        revision: number;
        table: SmartAttribute[];
    }

    power_on_time: {
        hours?: number;
    }

    power_cycle_count: number;
    
    temperature: {
        current?: number;
    }
}