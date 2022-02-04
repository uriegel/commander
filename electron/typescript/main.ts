import * as path from 'path'
import * as process from "process"
import { app, BrowserWindow } from "electron"
import * as os from 'os'    


import { test } from 'rust-addon'

// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()
process.env.UV_THREADPOOL_SIZE = os.cpus().length.toString()

const icon = path.join(__dirname, '../web/assets/kirk.png')

const createWindow = async () => {    
    const bounds = {
        icon: 'web/assets/kirk.png',
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    } 
    
    win = new BrowserWindow(bounds)
    win.loadFile('web/index.html')
}

async function run()  {
    async function testrun(i: number) { 
        console.log("Renne", i)
        await test()
        console.log("Renne zurück", i)
    }

    for (let i = 0; i < 20; i++)
        testrun(i)
}
run()

app.on('ready', createWindow)


var win