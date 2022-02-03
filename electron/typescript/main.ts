import * as path from 'path'
import * as process from "process"
import * as os from 'os'    
// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()
process.env.UV_THREADPOOL_SIZE = os.cpus().length.toString()

const icon = path.join(__dirname, '../web/assets/kirk.png')

const createWindow = async () => {    
}