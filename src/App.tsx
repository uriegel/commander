import { useEffect, useRef, useState } from 'react'
import './App.css'
import './themes/adwaita.css'
import './themes/adwaitaDark.css'
import './themes/windows.css'
import './themes/windowsDark.css'
import { getTheme, isWindows } from './globals'
import { themeChangedEvents, windowStateChangedEvents } from './requests/events'
import './extensions/extensions'
import Commander, { CommanderHandle } from './Commander'
import WithDialog from 'web-dialog-react'

// TODO in webview.d.ts
declare const webViewGetWindowState: () => Promise<number>

const App = () => {

	const [theme, setTheme] = useState(getTheme())
	const [isMaximized, setIsMaximized] = useState(false)

	const commander = useRef(null as CommanderHandle|null)
	
	useEffect(() => {
		themeChangedEvents.subscribe(setTheme)

		if (isWindows()) {
			windowStateChangedEvents.subscribe(maximized => setIsMaximized(maximized))
			const setWindowInitialState = async () => {
				const state = await webViewGetWindowState()
				setIsMaximized(state == 2)
			}
			setWindowInitialState()
		}
	}, [])

	const onKeyDown = (evt: React.KeyboardEvent) =>
		commander.current?.onKeyDown(evt)
	
	const getAppClasses = () => ["App", `${theme}Theme`, isMaximized ? "maximized" : null].join(' ')

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		e.dataTransfer.dropEffect = "none"
	}

	return (
		<div className={getAppClasses()} onKeyDown={onKeyDown} onDragOver={onDragOver}>
			<WithDialog>
				<Commander ref={commander} isMaximized={isMaximized} ></Commander>
			</WithDialog>
		</div>
	)
}

export default App


