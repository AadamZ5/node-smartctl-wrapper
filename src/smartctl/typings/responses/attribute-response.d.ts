import { SmartBaseResponse } from "./base-response";
import { SmartDeviceInfo, SmartAttribute } from "./fragments";
import { SmartDeviceResponse } from "./device-response";
import { SmartInfoResponse } from "./info-response";



export interface SmartAttributeResponse extends SmartDeviceResponse {

    ata_smart_attributes: {
        revision: number;
        table: SmartAttribute[];
    }

    power_on_time: {
        hours?: number;
    }

    power_cycle_count: number;
    
    temperature: {
        current: number;
    }
}