import Menubar, { MenuItemType } from 'menubar-react'
import { isWindows } from '../globals'

export interface MenuProps {
    autoMode: boolean
    toggleAutoMode: ()=>void,
    showHidden: boolean,
    toggleShowHidden: ()=>void,
    showViewer: boolean,
    toggleShowViewer: () => void,
    onMenuAction: (key: string)=>void
}

const Menu = ({ autoMode, toggleAutoMode, showHidden, toggleShowHidden, showViewer, toggleShowViewer,
        onMenuAction }: MenuProps) => (
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
            shortcut: "Strg+F2",
            key: "EXTENDED_RENAME"
        }, {
            name: "Kopie _anlegen",
            type: MenuItemType.MenuItem,
            shortcut: "Umschalt+F2",
            key: "RENAME_AS_COPY"
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
            shortcut: "F6",
            key: "MOVE"
        }, {
            name: "_Löschen",
            type: MenuItemType.MenuItem,
            shortcut: "Entf",
            key: "DELETE"

        }, {
            type: MenuItemType.Separator
        }, {
            name: "_Ordner anlegen",
            type: MenuItemType.MenuItem,
            shortcut: "F7",
            key: "CREATE_FOLDER"
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
            key: "FAVORITES",
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
            toggleChecked: toggleShowHidden,
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
            toggleChecked: toggleShowViewer,
            shortcut: "F3"
        }, {
            type: MenuItemType.Separator
        },
            isWindows() == false
            ?
            {
                name: "_Menü verbergen",
                checked: autoMode,
                toggleChecked: toggleAutoMode,
                type: MenuItemType.MenuCheckItem,
                }
                : {
                    type: MenuItemType.Separator
                }
            , {
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