import * as pcp from "promisify-child-process";
import { SmartAllResponse, AtaSelfTestLog } from "./typings/responses/all-response";
import { SmartBaseResponse } from "./typings/responses/base-response";
import { uid, username } from "userid";
import { SmartListResponse } from "./typings/responses/scan-response";
import { ISmartDevice, SmartDevice } from "./smart-device";
import { timeStamp } from "console";
import { SmartTestResponse } from "./typings/responses/test-response";
import { SmartTestType } from "./smart_test";

interface Version{
    maj: number;
    min: number;
}

/**
 * An object class for interfacing with SmartCtl.
 */
export class SmartCtl{

    /**
     * Creates a SmartCtl object for object stuff
     */
    constructor(){
    }

    /**
     * Initializes the talker to the dooer
     * @param binary_path Optional path for `smartctl` binary.
     */
    static async initialize(binary_path?: string){
        return SmartCtlWrapper.init(binary_path);
    }

    /**
     * Initializes the talker to the dooer. This only needs done once and not again for all SmartCtl objects.
     * In other words, this doesn't need done for every instance of this class.
     * @param binary_path Optional path for `smartctl` binary.
     */
    async initialize(binary_path?: string){
        return SmartCtl.initialize(binary_path);
    }

    async get_device(device_path: string){
        let d = await SmartCtlWrapper.get_device(device_path);
        let sd = new SmartDevice(d);
        return sd;
    }

    async get_all_devices(){

        let device_objects: SmartDevice[] = [];

        let devices = await SmartCtlWrapper.get_device_list();
        for (const device_key in devices.devices) {
            if (devices.devices.hasOwnProperty(device_key)) {
                const device_listing = devices.devices[device_key];
                let d = await SmartCtlWrapper.get_device(device_listing.name);
                device_objects.push(new SmartDevice(d));
            }
        }

        return device_objects;
    }
}

/**
 * This namespace is a single interface point with `smartctl` binary. 
 * This namespace functionally does checks on version and responses upon initialization to check if the version of `smartctl` installed is compatible.
 * This namespace shouldn't really be used directly, but it is exported so you can use it directly if needed.
 * This namespace repeats itself in the description.
 * This namespace contains many utility functions for interfacing directly with `smartctl` and returns only typed responses representing exactly what `smartctl` returns.
 */
export namespace SmartCtlWrapper{

    /**The path of the `smartctl` binary */
    export let binary_path: string|undefined;

    /**The `smartctl` version found on the system */
    export let version: Version;

    /**The `uid` of the process */
    export let executing_uid: number;

    /**The version required for this library to work */
    export const required_version: Version = {
        maj: 7,
        min: 0,
    };

    /**The `smartctl` JSON format version this library expects to function properly */
    export const required_json_format_version: Version = {
        maj: 1,
        min: 0,
    };

    /**The `smartctl` JSON format version found */
    export let json_format_version: Version;

    /**
     * Init checks for the existance of smartctl binary, and that the version is 7.0+ because of the 
     * `-j` JSON output option. 
     * 
     */
    export async function init(binary_path?:string){

        if(!binary_path){
            //Find binary location
            const which = await pcp.exec("which smartctl", {
                timeout: 5000,
            }).catch((err) => {
                throw "Couldn't find binary path for smartctl! " + err;
            })
            if(which.stdout != undefined){
                let output = which.stdout.toString().replace('\n', '');
                if((output) && (output != '')){
                    SmartCtlWrapper.binary_path = output;
                }else{
                    throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
                }
            }else{
                throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
            }
        }else{
            SmartCtlWrapper.binary_path = binary_path;
        }
        
        //Find version
        const ver = await pcp.exec(`${SmartCtlWrapper.binary_path} -V`, {
            timeout: 5000,
        });
        let version: string|undefined = undefined;
        if(ver.stdout != undefined){
            version = ver.stdout.toString();
        }else{
            throw "Couldn't get version info for smartctl! Initialize failed!";
        }

        let version_parts: string|undefined = undefined;
        // // let version_date: string|undefined = undefined;
        // // let revision: string|undefined = undefined;
        // // let arch: string|undefined = undefined;

        if((version) && (version != '')){
            let lines = version.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const element = lines[i];
                if(element.search("(smartctl) \\d+.\\d+") != -1){
                    //Should match this: 
                    //smartctl 7.1 2019-12-30 r5022 [x86_64-linux-5.4.0-40-generic] (local build)
                    let tlww = element;
                    let parts = tlww.split(' ');

                    version_parts = parts[1];
                    // // version_date = parts[2];
                    // // revision = parts[3];
                    // // arch = parts[4];

                    break;

                }
            }
        }else{
            throw "Couldn't execute smartctl binary with '" + SmartCtlWrapper.binary_path + " -V'";
        }

        //Parse version string
        if(version_parts){
            let parts = version_parts.split('.');
            SmartCtlWrapper.version = {
                maj: Number(parts[0]),
                min: Number(parts[1]),
            };
        }else{
            throw "Couldn't get version of smartctl!";
        }

        //Check version string
        if((SmartCtlWrapper.version.maj >= SmartCtlWrapper.required_version.maj) && (SmartCtlWrapper.version.min >= SmartCtlWrapper.required_version.min)){
            //Yay!
        }else{
            throw `smartctl version ${SmartCtlWrapper.version.maj}.${SmartCtlWrapper.version.min} is not supported! This library requires smartctl version 7.0 and up!`;
        }

        //Check for permissions to execute smartctl
        SmartCtlWrapper.executing_uid = process.geteuid();
        let perm_response = await pcp.exec(`ls -l ${SmartCtlWrapper.binary_path}`);
        if(!perm_response.stdout){
            console.error("Can't determine permissions! Possible failures ahead!");
        }else{
            let ls_string = perm_response.stdout!.toString().replace('\n', ''); //Example:  -rwxr-xr-x 1 root root 868392 Mar 21 07:29 /usr/sbin/smartctl*
            let parts = ls_string.split(' ');
            let user = parts[2];
            let group = parts[3];

            let required_uid = uid(user);
            if(SmartCtlWrapper.executing_uid != required_uid){
                throw "Insufficient permissions to run smartctl! You must be user '" + user + "' to run smartctl! You are '" + username(SmartCtlWrapper.executing_uid) + "'.";
            }
        }

        //Get JSON format version
        const json_ver = await pcp.exec(`${SmartCtlWrapper.binary_path} -j -V`);
        if(!json_ver.stdout){
            console.error("Couldn't get JSON schema version! Possible schema mismatches ahead!");
        }else{
            let json_response = json_ver.stdout!.toString();
            let json_obj = JSON.parse(json_response) as SmartBaseResponse;
            SmartCtlWrapper.json_format_version = {
                maj: json_obj.json_format_version[0],
                min: json_obj.json_format_version[1],
            };
        }

        //Check JSON format version
        if((SmartCtlWrapper.json_format_version.maj >= SmartCtlWrapper.required_json_format_version.maj) && (SmartCtlWrapper.json_format_version.min >= SmartCtlWrapper.required_json_format_version.min)){
            //Yay!
        }else{
            console.error(`smartctl JSON format version ${SmartCtlWrapper.json_format_version.maj}.${SmartCtlWrapper.json_format_version.min} is not supported! This library supports JSON format ${SmartCtlWrapper.required_json_format_version.maj}.${SmartCtlWrapper.required_json_format_version.min}! Possible format errors ahead!`);
        }
    }

    /**
     * Sanitizes and checks a supplied disk path
     * @param name_or_path The path string to check
     */
    export function _sanitize_kernel_disk_name(name_or_path: string): string|undefined{

        let path_re_1 = new RegExp('(\/(dev)\/sd[A-Z])', 'i'); //matches only '/dev/sd?'
        if(path_re_1.test(name_or_path)){
            return name_or_path //Good match!
        }

        let path_re_2 = new RegExp('((?<!\/)(dev)\/sd[A-Z])|(\/(dev)\/sd[A-Z])|(sd[A-Z])', 'i'); // matches only 'dev/sd?'
        if(path_re_2.test(name_or_path)){
            return '/' + name_or_path;
        }

        let path_re_3 = new RegExp('((?<!\/)(?<!dev)(?<!\/)sd[A-Z])', 'i'); //matches only 'sd?'
        if(path_re_3.test(name_or_path)){
            return '/dev/' + name_or_path;
        }

        return undefined;
    }

    /**
     * Checks a @see SmartBaseResponse for errors
     * @param response 
     */
    export function _check_response_no_errors(response: SmartBaseResponse): boolean{
        if(response.smartctl.messages){
            for (let i = 0; i < response.smartctl.messages.length; i++) {
                const message = response.smartctl.messages[i];
                if(message.severity == "error"){
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * `all(...)` is the equivalent of using `smartctl -j -a /dev/sd?` in shell.
     * @param device_path A reference to the device path like `dev/sda`, `sda`, or `/dev/sda`
     */
    export async function all(device_path: string): Promise<SmartAllResponse>{
        if(!SmartCtlWrapper.binary_path){
            throw "Binary path is not found. Unable to continue!";
        }

        let path = SmartCtlWrapper._sanitize_kernel_disk_name(device_path)
        if(path == undefined){
            throw "Bad device path " + device_path + "!";
        }

        let out = await pcp.exec(`${SmartCtlWrapper.binary_path} -j -a ${path}`).catch((err) => {
            console.warn("Error while getting info for " + path);
            console.error(err);
            return null;
        });
        if(!out){
            throw `No output to parse!`;
        }

        if(!out.stdout){
            throw `No output from ${SmartCtlWrapper.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartAllResponse;
        if(SmartCtlWrapper._check_response_no_errors(obj)){
            return obj;
        }
        else{
            throw `Error from ${SmartCtlWrapper.binary_path}: ${obj.smartctl.messages!}`
        }
    }

    /**Returns a device object.
     * @returns SmartDevice
     */
    export async function get_device(device_path: string){
        let response = await SmartCtlWrapper.all(device_path);

        const test_log = (stl: AtaSelfTestLog) => {
            if(stl.extended != undefined){
                return stl.extended.table? stl.extended.table : [];
            }else{
                return stl.standard?.table? stl.standard.table : [];
            }
        }

        let sd: ISmartDevice = {
            attributes: response.ata_smart_attributes.table,
            capacity: response.user_capacity.bytes,
            device_node: response.device.name,
            errors: (response.ata_smart_error_log.extended != undefined) ? (response.ata_smart_error_log.extended.table != undefined) ? response.ata_smart_error_log.extended.table! : [] : [], //Sorry this is ugly
            firmware_version: response.firmware_version,
            model: response.model_name,
            overall_pass: response.smart_status.passed,
            serial: response.serial_number,
            tests: test_log(response.ata_smart_self_test_log),
            wwn: response.wwn,
        };
        return sd;
    }

    /**
     * Gets a list of devices that `smartctl` currently sees.
     */
    export async function get_device_list(){
        let response = await pcp.exec(`${SmartCtlWrapper.binary_path!} -j --scan-open`);
        if(!response.stdout){
            throw `No output from ${SmartCtlWrapper.binary_path}!\nstderr:${response.stderr?.toString()}`;
        }

        let smart_response = JSON.parse(response.stdout.toString()) as SmartListResponse;
        return smart_response;
    }

    /**
     * Starts a test on a device at `device_path`
     * @param device_path The path of the device to start the test on
     * @param type The type of test to start
     */
    export async function test(device_path: string, type: SmartTestType){
        let dev = SmartCtlWrapper._sanitize_kernel_disk_name(device_path);
        if(!dev){
            throw "Invalid device path " + device_path + "!";
        }

        let out = await pcp.exec(`${SmartCtlWrapper.binary_path} -j -t ${type} ${dev}`);
        if(!out.stdout){
            throw `No output from ${SmartCtlWrapper.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartTestResponse;
        if(SmartCtlWrapper._check_response_no_errors(obj)){
            return true;
        }else{
            return false;
        }
    }

    /**
     * Checks to see if a device is testing or not. 
     * @param device_path The path of the device to check.
     */
    export async function testing(device_path: string){
        let dev = SmartCtlWrapper._sanitize_kernel_disk_name(device_path);
        if(!dev){
            throw "Invalid device path " + device_path + "!";
        }

        let out = await pcp.exec(`${SmartCtlWrapper.binary_path} -j -a ${dev}`);
        if(!out.stdout){
            throw `No output from ${SmartCtlWrapper.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartAllResponse;
        if(SmartCtlWrapper._check_response_no_errors(obj)){
            return obj.ata_smart_data.self_test.status.value <= 250 && obj.ata_smart_data.self_test.status.value >= 241;
        }else{
            throw `Bad response from ${SmartCtlWrapper.binary_path!}!`;
        }
    }
    
    export async function abort_test(device_path: string){
        if( !(await testing(device_path)) ){
            throw `Device ${device_path} is not currently testing`;
        }

        let out = await pcp.exec(`${SmartCtlWrapper.binary_path} -j -X ${device_path}`);
        if(!out.stdout){
            throw `No output from ${SmartCtlWrapper.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartAllResponse;
        if(SmartCtlWrapper._check_response_no_errors(obj)){
            return true;
        }else{
            return false;
        }
    }
}