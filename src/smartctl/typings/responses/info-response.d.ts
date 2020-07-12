import { SmartDeviceResponse } from "./device-response"

export type Wwn = {
    naa: number;
    oui: number;
    id: number;
}

export type Capacity = {
    blocks: number;
    bytes: number;
}

export type FormFactor = {
    ata_value: number;
    name: string;
}

export type AtaVersion = {
    string: string;
    major_value: number;
    minor_value: number;
}

export type SataVersion = {
    string: string;
    value: number;
}

export type InterfaceSpeed = {
    sata_value: number;
    string: string;
    units_per_second: number;
    bits_per_unit: number;
}

export interface SmartInfoResponse extends SmartDeviceResponse{
    model_family: string;
    model_name: string;
    serial_number: string;
    wwn: Wwn;
    firmware_version: string;
    user_capacity: Capacity;
    logical_block_size: number;
    physical_block_size: number;
    rotation_rate: number;
    form_factor: FormFactor;
    in_smartctl_database: boolean;
    ata_version: AtaVersion;
    sata_version: SataVersion;
    interface_speed: {
        max?: InterfaceSpeed;
        current?: InterfaceSpeed;
    };
    local_time: { //Do we need this...?
        time_t: number;
        asctime: string;
    }
}