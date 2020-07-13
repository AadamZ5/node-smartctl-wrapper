# node-smartctl-wrapper

A wrapper for smartmontools 7 with typed responses

----

I'm not entirely sure the exact direction this is headed yet, but I'm working around to figure out the exact form of this package. Currently, the goal is to create the ability to manage `SmartDevice`s for an object-oriented approach. This package also allows for just using the `SmartCtlWrapper` namespace functions to directly interface with popular `smartctl` uses with typed responses.

Please feel free to contribute!

### Pros:
- Structured and typed responses from `smartctl`
- Object-oriented device testing
- Flexible interfaces for modularity
  
### Cons:
- Requires `smartctl` from smartmontools v7.0^ to be installed
- Usually requires `sudo` or root privledges to execute `smartctl`

### Pros/Cons:
- Uses RXJS for data pushing (primarily progress from tests)
