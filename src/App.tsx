import './App.css'
import { showDialog, Result } from 'web-dialog-react' 
import FolderView, { FolderViewHandle } from './components/FolderView'
import Menubar, { MenuItemType } from 'menubar-react'
import { useEffect, useRef, useState } from 'react'

const App = () => {

	const folderLeft = useRef<FolderViewHandle>(null)

	const [autoMode, setAutoMode] = useState(false)
	const [showHidden, setShowHidden] = useState(false)

	const setAndSaveAutoMode = (mode: boolean) => {
		setAutoMode(mode)
		localStorage.setItem("menuAutoHide", mode ? "true" : "false")
	}

	const setAutoModeDialog = async (autoMode: boolean) => 
		setAndSaveAutoMode(autoMode && ((await showDialog({
				text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
				btnOk: true,
				btnCancel: true
			})).result == Result.Ok))
	
	const setShowHiddenAndRefresh = (show: boolean) => {
		setShowHidden(show)
		folderLeft.current?.refresh(show)
	}
	
	useEffect(() => {
		setAutoMode(localStorage.getItem("menuAutoHide") == "true")
	}, [])

	const onMenuAction = async (key: string) => {
		if (key == "REFRESH")
			folderLeft.current?.refresh()
		else if (key == "SEL_ALL")
			folderLeft.current?.selectAll()
		else if (key == "SEL_NONE")
			folderLeft.current?.selectNone()
	}
		
	return (
		<div className="App">
			<Menubar autoMode={autoMode} items={[{
				name: "_Datei",
				items: [{
					name: "_Umbenennen",
					type: MenuItemType.MenuItem,
					shortcut: "F2"
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
					setChecked: setShowHiddenAndRefresh,
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
					type: MenuItemType.MenuItem,
					shortcut: "F3"
				}, {
					type: MenuItemType.Separator
				}, {
					name: "_Menü verbergen",
					checked: autoMode,
					setChecked: setAutoModeDialog,
					type: MenuItemType.MenuCheckItem,
				}, {
					name: "_Vollbild",
					type: MenuItemType.MenuItem,
					shortcut: "F11"
				}, {
					type: MenuItemType.Separator
				}, {
					name: "_Entwicklerwerkzeuge",
					type: MenuItemType.MenuItem
				}]
			}]} onAction={onMenuAction} />
			<FolderView ref={folderLeft} showHidden={showHidden} />
		</div>
	)
}

export default App
