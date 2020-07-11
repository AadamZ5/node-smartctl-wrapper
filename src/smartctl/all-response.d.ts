import { SmartAttributeResponse } from "./attribute-response";

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

export type AtaSecurity = {
    state: number;
    string: string;
    enabled: boolean;
    frozen: boolean;
}

export type AtaCapabilities = {
    values: number[];
    exec_offline_immediate_supported: boolean;
    offline_is_aborted_upon_new_cmd: boolean;
    offline_surface_scan_supported: boolean;
    self_tests_supported: boolean;
    conveyance_self_test_supported: boolean;
    selective_self_test_supported: boolean;
    attribute_autosave_enabled: boolean;
    error_logging_supported: boolean;
    gp_logging_supported: boolean;
}

export interface AtaSmartData{
    offline_data_collection: {
        status:{
            value: number;
            string: string;
        };
        completion_seconds: number;
    };
    self_test:{
        status:{
            value: number;
            string: string;
            passed: boolean;
        };
        polling_minutes:{
            short: number;
            extended: number;
        };
    };
    capabilities: AtaCapabilities;
}

export interface SmartDataResponse extends SmartAttributeResponse{
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
        max: InterfaceSpeed;
        current: InterfaceSpeed;
    };
    //local_time: { //Do we need this...?
    //     time_t: number;
    //     asctime: string;
    // }
    ata_apm: {
        enabled: boolean;
    };
    read_lookahead: {
        enabled: boolean;
    };
    write_cache: {
        enabled: boolean;
    };
    ata_security: AtaSecurity;
    smart_status: {
        passed: boolean;
    };
    ata_smart_data: AtaSmartData;

}