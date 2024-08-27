import {useRef} from 'react'
import './App.css'
import './themes/adwaita.css'
import './themes/windows.css'
import { isWindows } from './globals'
import './extensions/extensions'
import Commander, { CommanderHandle } from './Commander'
import WithDialog from 'web-dialog-react'

const App = () => {

	const commander = useRef(null as CommanderHandle|null)
	
	const onKeyDown = (evt: React.KeyboardEvent) =>
		commander.current?.onKeyDown(evt)
	
	const getAppClasses = () => ["App", `${isWindows() ? 'windows': 'adwaita'}Theme`].join(' ')

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		e.dataTransfer.dropEffect = "none"
	}

	return (
		<div className={getAppClasses()} onKeyDown={onKeyDown} onDragOver={onDragOver}>
			<WithDialog>
				<Commander ref={commander} ></Commander>
			</WithDialog>
		</div>
	)
}

export default App


