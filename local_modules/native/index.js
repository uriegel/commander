Object.defineProperty(exports, "__esModule", { value: true })
const process = require("process")
const path = require('path')

const inner= require("./native")        

exports.getFiles = inner.getFiles
exports.getDrives = inner.getDrives
exports.getAccentColor = inner.getAccentColor
exports.getIcon = inner.getIcon
exports.getIconFromName = inner.getIconFromName
exports.getExifInfos = inner.getExifInfos
exports.getGpxTrack = inner.getGpxTrackAsync
exports.cancel = inner.cancel
exports.trash = async files => await inner.trash(Array.isArray(files) ? files : [files])
if (process.platform == "linux") {
    exports.getErrorMessage = inner.getErrorMessage
    exports.getRecommendedApps = inner.getRecommendedApps
    exports.getAllApps = inner.getAllApps
    exports.unrefApp = inner.unrefApp
    exports.getAppIcon = inner.getAppIcon
    exports.copyFiles = async (sourcePath, targetPath, items, options) => {
        let copyItems = items.map(item => ({ source: path.join(sourcePath, item), target: path.join(targetPath, item) }))
        await inner.copy(copyItems, options?.progressCallback ? (idx, c, t) => options.progressCallback(idx, c, t) : (() => { }), options?.move || false, options?.overwrite || false, options?.cancellation || "")
    }

    exports.copyFile = async (source, target) => {
        await inner.copy([{ source, target }], (c, t) => { }, false, false)
    }
} else {
    exports.createFolder = inner.createFolder
    exports.openFile = inner.openFile    
    exports.openFileWith = inner.openFileWith
    exports.showFileProperties = inner.showFileProperties
    exports.rename = inner.rename;
    exports.getVersionInfos = inner.getVersionInfos;
    exports.addNetworkShare = inner.addNetworkShare; 
    exports.copyFiles = async (sourcePath, targetPath, items, options) => {
        const source = items.map(n => path.join(sourcePath, n)) 
        const target = items.map(n => path.join(targetPath, n)) 
        await inner.copy(source, target, options?.move || false, options?.overwrite || false)
    }
    exports.copyFile = async (source, target) => {
        await inner.copy([source], [target], false, false)
    }
}
