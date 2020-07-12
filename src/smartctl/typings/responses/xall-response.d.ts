import { SmartAllResponse } from "./all-response";

export interface AtaDeviceStatisticEntry{
    offset: number;
    name: string;
    size: number;
    value: number;
    flags: {
        value: number;
        string: string;
        valid: boolean;
        normalized: boolean;
        supports_dsn: boolean;
        monitored_condition_met: boolean;
    }
}

export interface AtaDeviceStatisticPage{
    number: number;
    name: string;
    revision: number;
    table: AtaDeviceStatisticEntry[];
}

export interface AtaDeviceStatistics{
    pages: AtaDeviceStatisticPage[];
}

export interface AtaSctStatus{
    format_version: number;
    sct_version: number;
    device_state: {
        value: number;
        string: string;
    };
    temperature: {
        current: number;
    } & any;

}

export interface AtaTemperatureHistory{
    version: number;
    sampling_period_minutes: number;
    logging_interval_minutes: number;
    tempurature: any;
    size: number;
    index: number;
    table: Array<number|null|undefined>;
}

/**
 * This structure represents the data from `smartctl -j -x` command.
 */
export interface SmartXallResponse extends SmartAllResponse{

    temperature: {
        current: number;
    } & any;

    ata_device_statistics: AtaDeviceStatistics;

    ata_sct_status: AtaSctStatus;

    ata_sct_temperature_history?: AtaTemperatureHistory;

    ata_sct_erc?: {
        read: {
            enabled: boolean;
            deciseconds: number;
        };
        write: {
            enabled: boolean;
            deciseconds: number;
        }
    }
}