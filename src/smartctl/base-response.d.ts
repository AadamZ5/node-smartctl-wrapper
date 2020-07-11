export type SmartMessage = {
    /**The message itself */
    string?: string;
    /**A severity indicator */
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

export interface SmartResponse {
    /**The JSON formatting version */
    json_format_version: number[];
    /**Information about `smartctl` */
    smartctl: SmartCtlInfo
    
    
}