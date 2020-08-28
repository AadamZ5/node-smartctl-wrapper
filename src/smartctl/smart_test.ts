import { SmartCtlWrapper } from "./smartctl";
import { SmartDevice } from "./smart-device";
import { Subject, Observable } from "rxjs";

export type SmartTestType = "short" | "long" | "conveyance" | "offline" | "captive";

/**This is the interface for PREVIOUS TESTS */
export interface ISmartTestEntry extends ISmartTest{
    /**The index of this test in the test log */
    test_index: number;
}

/**This is the interface for a CURRENTLY OPEN test */
export interface ISmartTest {
    /**When the test was started */
    start_date: Date;
    /**When the test was ended */
    end_date?: Date;
    
    /**The recorded power-on-hours attribute when this test was started */
    power_on_hours: number;

    /**If the test completed, regardless of error state */
    completed: boolean;
    /**If the test sucessfully completed without error. Possibly `null` if `completed` is false */
    passed?: boolean;
    /**The summary string of the test, like 'Completed without error' */
    summary: string;

    /**Any errors will be here */
    errors?: any;

    /**The type of test this was */
    type: SmartTestType;

    /**The last reported progress of the test */
    progress?: number;
}

export class TestError extends Error {
    constructor(message?:string){
        super(message);
        this.name = "TestError";
    }
}

export class CurrentlyTestingError extends TestError{
    constructor(message?: string){
        super(message);
        this.name = "CurrentlyTestingError";
    }
}

export class TestAbortedError extends TestError{
    constructor(message?: string){
        super(message);
        this.name = "TestAbortedError";
    }
}

/**
 * An object that holds information about a test on a device.
 */
export class SmartTest implements ISmartTest{
    start_date: Date;
    end_date?: Date;
    power_on_hours: number;
    completed: boolean = false;
    passed?: boolean;
    summary: string;
    errors?: any[];
    type: SmartTestType;
    progress?: number;
    
    /**An observable for watching the stream of progress. Emits only *new* values, and a completion signal when the test finishes. */
    public get progress_observable() : Observable<number> {
        return this._progress_subject.asObservable();
    };

    private _parent_device: SmartDevice;
    private _testing: boolean = false;
    private _abort: boolean = false;
    private _progress_subject: Subject<number> = new Subject();

    constructor(test_type: SmartTestType, parent_device: SmartDevice, start_on_construct?: boolean){
        this._parent_device = parent_device;
        this.type = test_type;
        if(start_on_construct && (start_on_construct == true)){
            this.start();
        }
    }

    /**Polls for test progress */
    private async _monitor_progress(interval_ms: number = 5000){
        this.progress = 0;
        while (this._testing){
            let prog: number;
            let r = await SmartCtlWrapper.all(this._parent_device.device_node);
            if(r.ata_smart_data.self_test.status.remaining_percent != undefined){
                //We are still testing, calculate progress
                prog = 100 - r.ata_smart_data.self_test.status.remaining_percent;

                //Update progress only if it is different
                if(prog > this.progress!){
                    this.progress = prog;
                    this._progress_subject.next(this.progress);
                }
            }else{
                //There is no `remaining_percent`, look for `passed` field
                if(r.ata_smart_data.self_test.status.passed != undefined){
                    this.passed = r.ata_smart_data.self_test.status.passed
                }else if(r.ata_smart_data.self_test.status.value == 25){
                    this._progress_subject.error(new TestAbortedError("Test was aborted: " + r.ata_smart_data.self_test.status.string));
                }else{
                    this._progress_subject.error(new TestError("No pass indicator found when test completed"));
                }
                this._testing = false;
                this.end_date = new Date();
                this._progress_subject.complete(); //I guess we can't pass values through completion, so they will have to manually check for pass when the test completes if they want.
            }
        }
    }

    /**
     * Starts the configured test object.
     * @returns An observable for progress updates and calls `complete` upon test completion.
     */
    async start(){

        this.start_date = new Date(); //Now

        let already_testing = await SmartCtlWrapper.test(this._parent_device.device_node, this.type).catch(async (e) => {
            //Check if a test is already running

            //We must `throw` here instead of sending an error through the progress_subject because the progress_subject has not been returned yet
            if(await SmartCtlWrapper.testing(this._parent_device.device_node)){
                throw new CurrentlyTestingError(`${this._parent_device.model} at ${this._parent_device.device_node} is currently testing. Can not start a new test.`);
            }else{
                throw new TestError(`Unknown test error.`);
            }
        })

        if (already_testing){
            //Start watching progress
            this._testing = true;
            this._monitor_progress();
            return this.progress_observable;
        }else{
            throw new TestError(`Unknown test error.`);
        }
    }
}