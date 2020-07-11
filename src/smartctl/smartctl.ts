import * as pcp from "promisify-child-process";

interface SmartVersion{
    maj: number;
    min: number;
}

export class SmartCtl{

    private binary_path: string;
    private version: SmartVersion;

    private required_version: SmartVersion = {
        maj: 7,
        min: 0,
    }

    constructor(){
        
    }

    /**
     * Init checks for the existance of smartctl binary, and that the version is 7.0+ because of the 
     * `-j` JSON output option.
     * 
     * @returns The instance of this class
     */
    async init(){
        const which = await pcp.exec("which smartctl", {
            timeout: 5000,
        }).catch((err) => {
            throw "Couldn't get version info for smartctl! " + err;
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
        let version_date: string|undefined = undefined;
        let revision: string|undefined = undefined;
        let arch: string|undefined = undefined;

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
                    version_date = parts[2];
                    revision = parts[3];
                    arch = parts[4];

                    break;

                }
            }
        }else{
            throw "Couldn't execute smartctl binary with '" + this.binary_path + " -V' Initialize failure!";
        }

        if(version_parts){
            let parts = version_parts.split('.');
            this.version = {
                maj: Number(parts[0]),
                min: Number(parts[1]),
            };
        }else{
            throw "Couldn't get version of smartctl! Initialize failure!";
        }

        if((this.version.maj >= this.required_version.maj) && (this.version.min >= this.required_version.min)){
            //Yay!
        }else{
            throw `smartctl version ${this.version.maj}.${this.version.min} is not supported! This library requires smartctl version 7.0 and up! Initialize failure!`;
        }

        return this;
    }
}