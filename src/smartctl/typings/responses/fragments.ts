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

export type SmartMessage = {
    /**The message itself */
    string?: string;
    /**A severity indicator like 'error' or 'warn'*/
    severity?: string;
}

export type SmartCtlInfo = {
    version: number[];
    /**Revision of the SVN repository the current build is from */
    svn_revision: string;
    /**Basic platform information */
    platform_info: string;
    /** */
    build_info: string;
    /**The arguments the binary was run with, including itself */
    argv: string[];
    /**Any messages from the response. */
    messages?: SmartMessage[];
    /**The exit status of the binary */
    exit_status: number;
}