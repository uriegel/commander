import Menubar, { MenuItemType } from 'menubar-react'

export interface MenuProps {
    autoMode: boolean
    releaseMode?: boolean
    showHidden: boolean,
    toggleShowHidden: ()=>void,
    showViewer: boolean,
    toggleShowViewer: () => void,
    onMenuAction: (key: string) => void
    viewerMode: ViewerMode,
    setViewerMode: (mode: ViewerMode) => void
}

export type ViewerMode = "Viewer" | "Location" | "ViewerLocation"

const Menu = ({ autoMode, releaseMode, showHidden, toggleShowHidden, showViewer, toggleShowViewer,
    onMenuAction, viewerMode, setViewerMode }: MenuProps) => {
    
    const toggleShowOnlyViewer = () => { setViewerMode('Viewer') }
    const toggleShowViewerLocation = () => { setViewerMode('ViewerLocation') }
    const toggleShowLocation = () => { setViewerMode('Location') }
    
    return (
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
                shortcut: "Alt+Enter",
                key: "PROPERTIES"
            }, {
                name: "Öffnen _mit",
                type: MenuItemType.MenuItem,
                shortcut: "Strg+Enter",
                key: "OPENAS"
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
                name: "Selection _wechseln",
                type: MenuItemType.MenuItem,
                shortcut: "Insert",
                key: "TOGGLE_SEL"
            }, {
                type: MenuItemType.Separator
            }, {
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
                name: "...ohne Ortsanzeige",
                type: MenuItemType.MenuCheckItem,
                checked: viewerMode == 'Viewer',
                toggleChecked: toggleShowOnlyViewer,
                shortcut: "Strg+1"
            }, {
                name: "...mit Ortsanzeige",
                type: MenuItemType.MenuCheckItem,
                checked: viewerMode == "ViewerLocation",
                toggleChecked: toggleShowViewerLocation,
                shortcut: "Strg+2"
            }, {
                name: "...nur Ortsanzeige",
                type: MenuItemType.MenuCheckItem,
                checked: viewerMode == "Location",
                toggleChecked: toggleShowLocation,
                shortcut: "Strg+3"
            }, {
                type: MenuItemType.Separator
            }, {
                name: "_Vollbild",
                type: MenuItemType.MenuItem,
                key: "SHOW_FULLSCREEN",
                shortcut: "F11"
            }, {
                type: MenuItemType.Separator,
                invisible: releaseMode,
            }, {
                name: "_Entwicklerwerkzeuge",
                type: MenuItemType.MenuItem,
                key: "SHOW_DEV_TOOLS",
                invisible: releaseMode,
                shortcut: "Strg+Shift+I"
            }]
        }]} onAction={onMenuAction} />
    )
}

export default Menu