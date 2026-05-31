export const isWindows = window.location.hash.endsWith("windows")
export const themeName = isWindows ? "windowsTheme" : "linuxTheme"