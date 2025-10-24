export const canClose = () => closePrevent != true
export const setClosePrevent = (prevent: boolean) => closePrevent = process.platform == "win32" ? false : prevent

let closePrevent = false