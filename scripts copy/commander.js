async function extendedRename() {
    const extendedRename = document.getElementById("extended-rename")
    extendedRename.initialize()
    const res = await dialog.show({
        extended: "extended-rename",
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK) {
        extendedRename.save()
        activeFolder.extendedRename = extendedRename.getExtendedInfos()
    }
}








