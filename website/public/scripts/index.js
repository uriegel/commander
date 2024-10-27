
let webViewEvents = {
    registerShowHidden: (fun)=>{
        showHiddenFunc = fun    
    },
    registerShowPreview: (fun)=>{
        showPreviewFunc = fun    
    }
}

var showHiddenFunc = () => {}
function showHidden(show) {
    showHiddenFunc(show)
}

var showPreviewFunc = () => {}
function showPreview(show) {
    showPreviewFunc(show)
}