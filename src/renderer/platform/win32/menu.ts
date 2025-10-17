import { MenuItemType, MenuItemProps } from "menubar-react"

export const getProcessFileMenu = () => [{
    name: "_Eigenschaften",
    type: MenuItemType.MenuItem,
    shortcut: "Alt+Enter",
    key: "PROPERTIES"
}, {
    name: "Öffnen _mit",
    type: MenuItemType.MenuItem,
    shortcut: "Strg+Enter",
    key: "OPENAS"
}, {
    type: MenuItemType.Separator
}] as MenuItemProps[]
