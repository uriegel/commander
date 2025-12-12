import 'functional-extensions'
import { app, BrowserWindow, protocol, nativeTheme, ipcMain, IpcMainEvent, nativeImage } from "electron"
import * as path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import settings from 'electron-settings'
import { onCmd } from "./cmds.js"
import { onRequest } from "./requests.js"
import { registerGetIconProtocol } from "./icons.js"
import { registerGetBinProtocol } from "./bin.js"
import { registerGetMediaProtocol } from "./media.js"
import { Event } from './events.js'
import { registerGetTrackProtocol } from './track.js'
import { canClose } from './close-control.js'
import { registerGetWindowIconProtocol } from './windowicon.js'
import { getAccentColor, getRecommendedApps } from 'native'

process.env.UV_THREADPOOL_SIZE = "32"

export const rootDir = dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

export function sendEvent(data: Event) {
	mainWindow?.webContents.send('fromMain', data)
}



const affe = await getRecommendedApps("/home/uwe/Dokumente/Entwässerung.pdf")
console.log("affe", affe)
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'cmd',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'json',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'icon',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'bin',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'media',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'track',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}, {
		scheme: 'windowicon',
		privileges: {
			standard: true, secure: true, supportFetchAPI: true
		}
	}
])

const createWindow = () => {
	protocol.handle("cmd", async req => {
		if (req.method == 'POST')
			onCmd(req, mainWindow)
		else
			console.error(`Cmd only with HTTP method POST allowed`)
		return new Response()
	})
	protocol.handle("json", async req => await onRequest(req))
	registerGetIconProtocol()
	registerGetBinProtocol()
	registerGetMediaProtocol()
	registerGetTrackProtocol()
	if (process.platform == "win32")
		registerGetWindowIconProtocol()

	let bounds = {
		x: settings.getSync("x") as number,
		y: settings.getSync("y") as number,
		width: settings.getSync("width") as number || 600,
		height: settings.getSync("height") as number || 800,
		backgroundColor: nativeTheme.shouldUseDarkColors ? "#121212" : undefined,
		icon: path.join(rootDir, "../../icons/64x64.png"),
		webPreferences: {
			preload: path.join(rootDir, "./bridge/preload.js")
		}
	} as Electron.BrowserViewConstructorOptions

	if (process.platform == "win32")
		bounds = {
			...bounds,
			titleBarStyle: "hidden",
			titleBarOverlay: {
				color: nativeTheme.shouldUseDarkColors ? "#262626" : "#ebebeb",
				symbolColor: nativeTheme.shouldUseDarkColors ? 'white' : 'black',
				height: 30
			}
		} as Electron.BrowserViewConstructorOptions

	mainWindow = new BrowserWindow(bounds)
	if (settings.getSync("isMaximized"))
		mainWindow.maximize()

	nativeTheme.addListener("updated", () => {
		sendEvent({cmd: 'ThemeChanged', msg: {}})
		const color = nativeTheme.shouldUseDarkColors ? "#121212" : "white"
		mainWindow?.setBackgroundColor(color)
		if (process.platform == "win32")
			mainWindow?.setTitleBarOverlay({
				color: nativeTheme.shouldUseDarkColors ? "#262626" : "#ebebeb",
				symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
				height: 30
			})
	})

	mainWindow.on('maximize', () => {
		const bounds = mainWindow?.getBounds()
		if (bounds) {
			settings.set("width", bounds.width)
			settings.set("height", bounds.height)
			settings.set("isMaximized", true)
		}
	})

	mainWindow.on('unmaximize', () => settings.set("isMaximized", false))
	mainWindow.on("close", evt => {
		if (!canClose()) {
			if (process.platform == "linux")
				sendEvent({ cmd: 'CopyProgressShowDialog', msg: {} })
			evt.preventDefault()
		}
		if (!mainWindow?.isMaximized()) {
			const bounds = mainWindow?.getBounds()
			if (bounds) {
				settings.setSync("x", bounds.x)
				settings.setSync("y", bounds.y)
				settings.setSync("width", bounds.width)
				settings.setSync("height", bounds.height)
			}
		}
	})
	mainWindow.removeMenu()

	if (process.env.VITE_DEV_SERVER_URL)
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
	else
		mainWindow.loadFile(path.join(rootDir, "../renderer/index.html"))
	// TODO initial dev tools
	// mainWindow.webContents.openDevTools()
}

export const closeWindow = () => mainWindow?.close()

app.setName("commander")
app.on("ready", createWindow)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin")
		app.quit()
})
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		createWindow()
})
app.getPath("temp")

const width = 32;
const height = 32;
const transparentPixelData = Buffer.alloc(width * height * 4); // all zeros = transparent

// Create nativeImage from raw data
const icon = nativeImage.createFromBuffer(transparentPixelData, {
	width,
	height,
	scaleFactor: 1
})

ipcMain.on('ondragstart', (event: IpcMainEvent, filePaths: string[]) => {
	event.sender.startDrag({
		file: "",
		files: filePaths,
		icon
	})
})

ipcMain.on('getAccentColor', (event: IpcMainEvent) => {

	const accent = process.platform == "win32" ? "lightblue" : getAccentColor()
	event.returnValue = accent == "orange"
		? nativeTheme.shouldUseDarkColors ? "#d34615" : "#cb4314"
		: event.returnValue = accent == "teal"
		? nativeTheme.shouldUseDarkColors ? "#308280" : "#2e7e7c"
		: event.returnValue = accent == "green"
		? nativeTheme.shouldUseDarkColors ? "#4b8501" : "#488001"
		: event.returnValue = accent == "yellow"
		? nativeTheme.shouldUseDarkColors ? "#9f6c00" : "#9a6800"
		: event.returnValue = accent == "red"
		? nativeTheme.shouldUseDarkColors ? "#da3450" : "#d82b48"
		: event.returnValue = accent == "pink"
		? nativeTheme.shouldUseDarkColors ? "#b34cb3" : "#ae4aae"
		: event.returnValue = accent == "purple"
		? nativeTheme.shouldUseDarkColors ? "#7764d8" : "#7360d7"
		: event.returnValue = accent == "slate"
		? nativeTheme.shouldUseDarkColors ? "#657b69" : "#627766"
		: event.returnValue = accent == "brown"
		? nativeTheme.shouldUseDarkColors ? "#92714a" : "#8c6c47"
		: nativeTheme.shouldUseDarkColors ? "#0073e5" : "#0070de"
})


