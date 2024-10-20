
let webViewEvents = {
    registerShowHidden: (fun)=>{
        showHiddenFunc = fun    
    }
}

var showHiddenFunc = () => {}

function showHidden(show) {
    showHiddenFunc(show)
}