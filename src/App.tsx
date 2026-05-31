import React, { useRef } from "react"
import Commander, { type CommanderHandle } from "./components/Commander"
import WithDialog from 'web-dialog-react'
import './themes/linux.css'
import './themes/windows.css'
import './App.css'
import './global.css'
import 'functional-extensions'
import { themeName } from "./platform/platform"

const App = () => {
	const commander = useRef(null as CommanderHandle | null)

	const onKeyDown = (evt: React.KeyboardEvent) =>
		commander.current?.onKeyDown(evt)

	return (
		<div className={`App ${themeName}`} onKeyDown={onKeyDown}>
			<WithDialog>
				<Commander ref={commander} ></Commander>
			</WithDialog>
		</div>
	)
}

export default App