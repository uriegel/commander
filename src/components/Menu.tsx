import Menubar, { MenuItemType } from 'menubar-react'

export interface MenuProps {
    autoMode: boolean
    setAutoMode: (set: boolean)=>void,
    showHidden: boolean,
    setShowHidden: (set: boolean)=>void,
    showViewer: boolean,
    setShowViewer: (set: boolean) => void,
    onMenuAction: (key: string)=>void
}

const Menu = ({ autoMode, setAutoMode, showHidden, setShowHidden, showViewer, setShowViewer, onMenuAction }: MenuProps) => (
    <Menubar autoMode={autoMode} items={[{
        name: "_Datei",
        items: [{
            name: "_Umbenennen",
            type: MenuItemType.MenuItem,
            shortcut: "F2",
            key: "RENAME"
        }, {
            name: "Er_weitertes Umbenennen",
            type: MenuItemType.MenuItem,
            shortcut: "Strg+F2"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Kopieren",
            type: MenuItemType.MenuItem,
            shortcut: "F5",
            key: "COPY"
        }, {
            name: "_Verschieden",
            type: MenuItemType.MenuItem,
            shortcut: "F6"
        }, {
            name: "_Löschen",
            type: MenuItemType.MenuItem,
            shortcut: "Ent"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Ordner anlegen",
            type: MenuItemType.MenuItem,
            shortcut: "F7"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Eigenschaften",
            type: MenuItemType.MenuItem,
            shortcut: "Strg+Enter"
        }, {
            name: "Öffnen _mit",
            type: MenuItemType.MenuItem,
            shortcut: "Alt+Enter"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Beenden",
            type: MenuItemType.MenuItem,
            key: "END",
            shortcut: "Alt+F4"
        }]
    }, {
        name: "_Navigation",
        items: [{
            name: "_Favoriten",
            type: MenuItemType.MenuItem,
            shortcut: "F1"
        }, {
            name: "_Gleichen Ordner öffnen",
            type: MenuItemType.MenuItem,
            key: "ADAPT_PATH",
            shortcut: "F9"
        }]
    }, {
        name: "_Selektion",
        items: [{
            name: "_Alles",
            type: MenuItemType.MenuItem,
            shortcut: "Num+",
            key: "SEL_ALL"
        }, {
            name: "_Selektion entfernen",
            type: MenuItemType.MenuItem,
            shortcut: "Num-",
            key: "SEL_NONE"
        }]
    }, {
        name: "_Ansicht",
        items: [{
            name: "_Versteckte Dateien",
            checked: showHidden,
            setChecked: setShowHidden,
            type: MenuItemType.MenuCheckItem,
            shortcut: "Strg+H"
        }, {
            name: "_Aktualisieren",
            type: MenuItemType.MenuItem,
            shortcut: "Strg+R",
            key: "REFRESH"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Vorschau",
            type: MenuItemType.MenuCheckItem,
            checked: showViewer,
            setChecked: setShowViewer,
            shortcut: "F3"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Menü verbergen",
            checked: autoMode,
            setChecked: setAutoMode,
            type: MenuItemType.MenuCheckItem,
        }, {
            name: "_Vollbild",
            type: MenuItemType.MenuItem,
            key: "SHOW_FULLSCREEN",
            shortcut: "F11"
        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Entwicklerwerkzeuge",
            type: MenuItemType.MenuItem,
            key: "SHOW_DEV_TOOLS",
            shortcut: "F12"
        }]
        }]} onAction={onMenuAction} />
)

export default Menu