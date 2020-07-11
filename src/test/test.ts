import { SmartCtl } from "../smartctl/smartctl";

const sc = new SmartCtl().init();
sc.then((s) => {
    console.log(s);
})