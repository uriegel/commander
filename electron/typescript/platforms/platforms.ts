import * as process from "process"
import { LinuxPlatform } from "./linux/platform"
import { WindowsPlatform } from "./windows/platform"

export interface Platform {
    registerGetIconProtocol: ()=>void
}
const isLinux = process.platform == "linux"

export function createPlatform() {
    return isLinux ? new LinuxPlatform() : new WindowsPlatform()
}