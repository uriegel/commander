function initializeCallbacks(onShowHidden, onShowViewer, onRefresh, onAdaptPath) {
    onShowHiddenCallback = onShowHidden
    onShowViewerCallback = onShowViewer
    onRefreshCallback = onRefresh
    onAdaptPathCallback = onAdaptPath
}

const composeFunction = (...fns) => (...args) => fns.reduceRight((acc, fn) => fn(acc), args)

var onShowHiddenCallback
var onShowViewerCallback
var onRequestCallback
var onRefreshCallback
var onAdaptPathCallback

const isLinux = process.platform == "linux"