
let webViewEvents = {
    registerShowHidden: (fun)=>{
        showHiddenFunc = fun    
    },
    registerShowPreview: (fun)=>{
        showPreviewFunc = fun    
    },
    registerMenuAction: (fun) =>{
        menuActionFunc = fun    
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

var menuActionFunc = () => {}
function menuAction(cmd) {
    menuActionFunc(cmd)
}