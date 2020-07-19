# node-smartctl-wrapper

#### A wrapper for smartmontools 7 with typed responses

I'm not entirely sure the exact direction this is headed yet, but I'm working around to figure out the exact form of this package. Currently, the goal is to create the ability to manage `SmartDevice`s for an object-oriented approach. This package also allows for just using the `SmartCtlWrapper` namespace functions to directly interface with popular `smartctl` uses with typed responses.

Please feel free to contribute!

### Pros
- Structured and typed responses from `smartctl`
- Object-oriented device testing
- Flexible interfaces for modularity
  
### Cons
- Requires `smartctl` from smartmontools v7.0^ to be installed
- Usually requires `sudo` or root privledges to execute `smartctl`

### Pros/Cons
- Uses RXJS for data pushing (primarily progress from tests)

# Install

Currently, this package is not in the npm registry, because it is not ready for it. This is still in active development.

To install:</br>
`npm i AadamZ5/node-smartctl-wrapper`

# Example Usage

#### Test a device
```typescript
import { SmartCtl } from "node-smartctl-wrapper";

SmartCtl.initialize().then(() => { // `initialize()` is a static and instance-bound function. You can use it either way.
    let smartctl = new SmartCtl();
    smartctl.get_device('dev/sda').then((device) => {
        console.log(device);
        device.test("short").subscribe((progress) => {
            console.log(progress + "%")
        }, null, () => {
            console.log("Test complete!");
        })
    })
})
```

# Known bugs
- Won't install properly on WSL due to `node-userid` package
