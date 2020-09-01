import { SmartAttributeResponse } from "./attribute-response";
import { SmartInfoResponse } from "./info-response";
import { SmartDeviceResponse } from "./device-response";

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
    /**Information about any current self test running */
    self_test:{
        status:{
            /**The raw test value from the hard drive */
            value: number;
            /**A string summary of the test status */
            string: string;
            /**From observation, appears only when no test is running */
            passed?: boolean;
            /**From observation, appears only when a test is running */
            remaining_percent?: number;
        };
        /**The amount of time you should expect a test to take */
        polling_minutes:{
            /**Expected wait for a short test */
            short: number;
            /**Expected wait for a long test */
            extended: number;
            /**Expected wait for a conveyance test */
            conveyance?: number;
        };
    };
    capabilities: AtaCapabilities;
}

export type AtaSecurity = {
    state: number;
    string: string;
    enabled: boolean;
    frozen: boolean;
}

export type AtaLogEntry = {
    address: number;
    name: string;
    read: boolean;
    write: boolean;
    gp_sectors?: number;
    smart_sectors?: number;
}

export interface AtaLogDirectory{
    gp_dir_version: number;
    smart_dir_version: number;
    smart_dir_multi_sector: boolean;
    table: []
}

export interface AtaSmartErrorLog{
    extended: {
        revision: number;
        sectors: number;
        count: number;
        table?: any[];
    };
}

export enum AtaSelfTestTypeValue{
    'short' = 1,
    'long' = 2,
    'conveyance' = 3,
}

export type AtaSelfTestType = {
    value: AtaSelfTestType;
    string: string;
}

export type AtaSelfTestStatus = {
    /**Kind of like an "exit-code" for the self-test */
    value: number;
    /**A status string summary for the test */
    string: string;
    /**How much of the test was left */
    remaining_percent?: number;
    /**If the test passed */
    passed?: boolean;
}

export interface AtaSelfTest{
    type: AtaSelfTestType;
    status: AtaSelfTestStatus;
    lifetime_hours: number;
}

export interface AtaSelfTestLog{

    /**
     * I don't know what determines which one of these appears, but one of them should
     */

    /**The extended self-test log */
    extended?: {
        revision: number;
        sectors: number;
        table: AtaSelfTest[];
        count: number;
        error_count_total: number;
        error_count_outdated: number;
    }

    /**The standard self-test log */
    standard?: {
        revision: number;
        sectors: number;
        table: AtaSelfTest[]; //Beware, it looks like some drives report TEST PROGRESS reports here instead of only test-runs.
        count: number;
        error_count_total: number;
        error_count_outdated: number;
    }
}

export type AtaSctCapabilities = {
    value: number;
    error_recovery_control_supported: boolean;
    feature_control_supported: boolean;
    data_table_supported: boolean;
}

/**
 * This structure represents the data from `smartctl -j -a` command.
 */
export interface SmartAllResponse extends SmartAttributeResponse, SmartInfoResponse, SmartDeviceResponse{

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

    ata_sct_capabilities?: AtaSctCapabilities;

    ata_log_directory: AtaLogDirectory;

    ata_smart_error_log: AtaSmartErrorLog;

    ata_smart_self_test_log: AtaSelfTestLog;

    ata_smart_selective_self_test_log?: any;
    sata_phy_event_counters?: any;

}