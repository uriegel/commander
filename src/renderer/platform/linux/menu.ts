import { MenuItemProps, MenuItemType } from "menubar-react"

export const getProcessFileMenu = () => [{
    name: "Öffnen _mit",
    type: MenuItemType.MenuItem,
    shortcut: "Strg+Enter",
    key: "OPENWITH"
}, {
    type: MenuItemType.Separator
}] as MenuItemProps[]
