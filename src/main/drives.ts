import { exec } from 'child_process'
import { homedir } from 'os'

type DriveItem = {
    name: string
    description: string
    size?: number
    type: number 
    mountPoint?: string
    isMounted?: boolean
}

type DriveItemOffer = {
    name: string
    description: string
    size?: number
    type: number 
    mountPoint?: string
    isMounted?: boolean
    isRoot?: boolean
}
    
const runCmd = (cmd: string) => new Promise<string>(res => exec(cmd, (_, stdout) => res(stdout)))

export async function getDrives(): Promise<DriveItem[]> {
    const drivesString = (await runCmd('lsblk --bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE'))
    const driveStrings = drivesString.split("\n")
    const columnsPositions = (() => {
        const title = driveStrings[0]
        const getPart = (key: string) => title.indexOf(key)

        return [
            0,
            getPart("NAME"),
            getPart("LABEL"),
            getPart("MOUNT"),
            getPart("FSTYPE")
        ]
    })()

    //const takeOr = (text: string, alt: string) => text ? text : alt
    const constructDrive = (driveString: string) => {
        const getString = (pos1: number, pos2: number) =>
            driveString.substring(columnsPositions[pos1], columnsPositions[pos2]).trim()
        const trimName = (name: string) =>
            name.length > 2 && name[1] == '─'
                ? name.substring(2)
                : name
        const mount = getString(3, 4)
        
        return {
            description: getString(2, 3),
            name: trimName(getString(1, 2)),
            type: 1, // TODO: Drive types enum DriveType
            mountPoint: mount,
            isMounted: !!mount,
            driveType: driveString.substring(columnsPositions[4]).trim(),
            size: parseInt(getString(0, 1), 10),
            isRoot: driveString[columnsPositions[1]] < '~'
        } as DriveItemOffer
    }

    const itemOffers  = ([{ name: "~", description: "home", mountPoint: homedir(), isMounted: true, type: 1, isRoot: false }]  as DriveItemOffer[])
        .concat(driveStrings
            .slice(1)
            .map(constructDrive)
        )
    const items = itemOffers
        .filter(rio => (!rio.isRoot && rio.name) || (itemOffers.filter(n => n.name != rio.name && n.name.startsWith(rio.name)).length == 0
            && rio.mountPoint != "[SWAP]"))
        .map(n => ({
            description: n.description, name: n.name, type: n.type, mountPoint: n.mountPoint, isMounted: n.isMounted, size: n.size
        }))
    
    const mounted = items.filter(n => n.isMounted)
    const unmounted = items.filter(n => !n.isMounted)
    return mounted.concat(unmounted)
}

