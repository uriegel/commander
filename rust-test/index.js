const isLinux = process.platform == "linux"
const test = require(isLinux ? './indexLinux': './indexWindows')
