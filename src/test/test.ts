import { SmartCtl } from "../smartctl/smartctl"

SmartCtl.initialize().then(() => {
    let smartctl = new SmartCtl();
    smartctl.get_device('dev/sda').then((s) => {
        console.log(s);
        s.test("short").subscribe((progress) => {
            console.log(progress + "%")
        }, null, () => {
            console.log("Test complete!");
        })
    })
})
