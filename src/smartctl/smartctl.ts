import * as pcp from "promisify-child-process";
import { SmartAllResponse } from "./typings/responses/all-response";
import { SmartBaseResponse } from "./typings/responses/base-response";
import { uid, username } from "userid";
import { SmartListResponse } from "./typings/responses/scan-response";
import { ISmartDevice, SmartDevice } from "./smart-device";
import { timeStamp } from "console";
import { SmartTestResponse } from "./typings/responses/test-response";

interface Version{
    maj: number;
    min: number;
}
/**
 * This class is a single interface point with `smartctl` binary. This class does checks on version and responses.
 * Every @see SmartDevice object that this class produces will hold an instance of this class. 
 * This function shouldn't really be used directly.
 */
export class SmartCtl{

    /**The instance of this class that is being used */
    public static instance?: SmartCtl = undefined;

    /**The path of the `smartctl` binary */
    private binary_path?: string;

    /**The `smartctl` version found on the system */
    private version: Version;

    /**The `uid` of the process */
    private executing_uid: number;

    /**The version required for this library to work */
    private readonly required_version: Version = {
        maj: 7,
        min: 0,
    }

    /**The `smartctl` JSON format version this library expects to function properly */
    private readonly required_json_format_version: Version = {
        maj: 1,
        min: 0,
    };

    /**The `smartctl` JSON format version found */
    private json_format_version: Version;

    constructor(binary_path?:string){
        this.binary_path = binary_path;
    }

    /**
     * Init checks for the existance of smartctl binary, and that the version is 7.0+ because of the 
     * `-j` JSON output option.
     * 
     * @returns The instance of this class
     */
    async init(new_instance: boolean = false){

        //Check for already existing instance
        if((SmartCtl.instance) && (!new_instance)){
            throw "SmartCtl has already been initialized! Set `new_instance` to true to make a new instance anyways."
        }

        if(!this.binary_path){
            //Find binary location
            const which = await pcp.exec("which smartctl", {
                timeout: 5000,
            }).catch((err) => {
                throw "Couldn't find binary path for smartctl! " + err;
            })
            if(which.stdout != undefined){
                let output = which.stdout.toString().replace('\n', '');
                if((output) && (output != '')){
                    this.binary_path = output;
                }else{
                    throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
                }
            }else{
                throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
            }
        }
        
        //Find version
        const ver = await pcp.exec(`${this.binary_path} -V`, {
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
            throw "Couldn't execute smartctl binary with '" + this.binary_path + " -V'";
        }

        //Parse version string
        if(version_parts){
            let parts = version_parts.split('.');
            this.version = {
                maj: Number(parts[0]),
                min: Number(parts[1]),
            };
        }else{
            throw "Couldn't get version of smartctl!";
        }

        //Check version string
        if((this.version.maj >= this.required_version.maj) && (this.version.min >= this.required_version.min)){
            //Yay!
        }else{
            throw `smartctl version ${this.version.maj}.${this.version.min} is not supported! This library requires smartctl version 7.0 and up!`;
        }

        //Check for permissions to execute smartctl
        this.executing_uid = process.geteuid();
        let perm_response = await pcp.exec(`ls -l ${this.binary_path}`);
        if(!perm_response.stdout){
            console.error("Can't determine permissions! Possible failures ahead!");
        }else{
            let ls_string = perm_response.stdout!.toString().replace('\n', ''); //Example:  -rwxr-xr-x 1 root root 868392 Mar 21 07:29 /usr/sbin/smartctl*
            let parts = ls_string.split(' ');
            let user = parts[2];
            let group = parts[3];

            let required_uid = uid(user);
            if(this.executing_uid != required_uid){
                throw "Insufficient permissions to run smartctl! You must be user '" + user + "' to run smartctl! You are '" + username(this.executing_uid) + "'.";
            }
        }

        //Get JSON format version
        const json_ver = await pcp.exec(`${this.binary_path} -j -V`);
        if(!json_ver.stdout){
            console.error("Couldn't get JSON schema version! Possible schema mismatches ahead!");
        }else{
            let json_response = json_ver.stdout!.toString();
            let json_obj = JSON.parse(json_response) as SmartBaseResponse;
            this.json_format_version = {
                maj: json_obj.json_format_version[0],
                min: json_obj.json_format_version[1],
            };
        }

        //Check JSON format version
        if((this.json_format_version.maj >= this.required_json_format_version.maj) && (this.json_format_version.min >= this.required_json_format_version.min)){
            //Yay!
        }else{
            console.error(`smartctl JSON format version ${this.json_format_version.maj}.${this.json_format_version.min} is not supported! This library supports JSON format ${this.required_json_format_version.maj}.${this.required_json_format_version.min}! Possible format errors ahead!`);
        }

        return this;
    }

    /**
     * Sanitizes and checks a supplied disk path
     * @param name_or_path The path string to check
     */
    private _sanitize_kernel_disk_name(name_or_path: string): string|undefined{

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
    private _check_response_no_errors(response: SmartBaseResponse): boolean{
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
    async all(device_path: string): Promise<SmartAllResponse>{
        if(!this.binary_path){
            throw "Binary path is not found. Unable to continue!";
        }

        let path = this._sanitize_kernel_disk_name(device_path)
        if(path == undefined){
            throw "Bad device path " + device_path + "!";
        }

        let out = await pcp.exec(`${this.binary_path} -j -a ${path}`);
        if(!out.stdout){
            throw `No output from ${this.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartAllResponse;
        if(this._check_response_no_errors(obj)){
            return obj;
        }
        else{
            throw `Error from ${this.binary_path}: ${obj.smartctl.messages!}`
        }
    }

    /**Returns a device object.
     * @returns SmartDevice
     */
    async get_device(device_path: string){
        let response = await this.all(device_path);
        let sd: ISmartDevice = {
            _smart_wrapper_instance: this,
            attributes: response.ata_smart_attributes.table,
            capacity: response.user_capacity.bytes,
            device_node: response.device.name,
            errors: (response.ata_smart_error_log.extended != undefined) ? (response.ata_smart_error_log.extended.table != undefined) ? response.ata_smart_error_log.extended.table! : [] : [],
            firmware_version: response.firmware_version,
            model: response.model_name,
            overall_pass: response.smart_status.passed,
            serial: response.serial_number,
            tests: (response.ata_smart_self_test_log.extended != undefined) ? (response.ata_smart_self_test_log.extended.table != undefined) ? response.ata_smart_self_test_log.extended.table! : [] : [],
            wwn: response.wwn,
        };
        return new SmartDevice(sd);
    }

    /**
     * Gets a list of devices that `smartctl` currently sees.
     */
    async get_device_list(){
        let response = await pcp.exec(`${this.binary_path!} -j --scan-open`);
        if(!response.stdout){
            throw `No output from ${this.binary_path}!\nstderr:${response.stderr?.toString()}`;
        }

        let smart_response = JSON.parse(response.stdout.toString()) as SmartListResponse;
        return smart_response;
    }

    /**
     * Starts a test on a device at `device_path`
     * @param device_path The path of the device to start the test on
     * @param type The type of test to start
     */
    async test(device_path: string, type: "short"|"long"){
        let dev = this._sanitize_kernel_disk_name(device_path);
        if(!dev){
            throw "Invalid device path " + device_path + "!";
        }

        let out = await pcp.exec(`${this.binary_path} -j -t ${type} ${dev}`);
        if(!out.stdout){
            throw `No output from ${this.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartTestResponse;
        if(this._check_response_no_errors(obj)){
            return true;
        }else{
            return false;
        }
    }

    /**
     * Checks to see if a device is testing or not
     * @param device_path The path of the device to check.
     */
    async testing(device_path: string){
        let dev = this._sanitize_kernel_disk_name(device_path);
        if(!dev){
            throw "Invalid device path " + device_path + "!";
        }

        let out = await pcp.exec(`${this.binary_path} -j -a ${dev}`);
        if(!out.stdout){
            throw `No output from ${this.binary_path}!\nstderr: ${out.stderr?.toString()}`;
        }

        let response = out.stdout.toString();
        let obj = JSON.parse(response) as SmartAllResponse;
        if(this._check_response_no_errors(obj)){
            return obj.ata_smart_data.self_test.status.value <= 250 && obj.ata_smart_data.self_test.status.value >= 241;
        }else{
            throw `Bad response from ${this.binary_path!}!`;
        }
    }
    
}