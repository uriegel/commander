const isLinux = process.platform == "linux"

import {
    adaptWindow as adaptWindowLinux,
    onDarkTheme as onDarkThemeLinux,
} from "./linux"
import {
    adaptWindow as adaptWindowWindows,
    onDarkTheme as onDarkThemeWindows,
} from "./windows"

export { hideMenu } from "./linux"
export var adaptWindow = isLinux ? adaptWindowLinux : adaptWindowWindows
export var onDarkTheme = isLinux ? onDarkThemeLinux : onDarkThemeWindows



    