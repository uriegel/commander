export const adaptWindow = (menu, itemHideMenu) => itemHideMenu.isHidden = true

export function onDarkTheme(dark) {
    activateClass(document.body, "windows-dark", dark) 
    activateClass(document.body, "windows", !dark) 
}

