import { SmartCtl } from "../smartctl/smartctl"

const sc = new SmartCtl().init();
sc.then((s) => {
    console.log(s);
    s.all('/dev/sda').then((r) => {
        console.log(r);
    });
    s.get_device_list().then((r) => {
        console.log(r);
    })
    s.get_device('/dev/sdc').then((r) => {
        let t = r.test("short");
        t.promise.then(() => {
            "Tested!";
        });
        t.progress.subscribe((pr) => {
            console.log("Progress: " + pr + "%");
        })
        console.log("Started testing");
    })
})