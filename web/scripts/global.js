const composeFunction = (...fns) => (...args) => fns.reduceRight((acc, fn) => fn(acc), args)
const isLinux = process.platform == "linux"