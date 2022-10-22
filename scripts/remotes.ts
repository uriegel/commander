import { DialogBox, Result } from "web-dialog-box"
import { Nothing, request } from "./requests"

export type RemoteItem = {
    name:      string,
    ip:        string,
    isAndroid: boolean
}

export type RenameRemote = {
    name:    string
    newName: string
}

class AddRemotes extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div class='add-remotes'>
                <input id="adder-name" class="wdb-focusable" placeholder="Anzeigenamen festlegen">
                <input id="adder-ip" class="wdb-focusable" placeholder="IP-Adresse des externen Gerätes">
                <div>
                    <input id="adder-type" type="checkbox" class="wdb-focusable"><label for="adder-type">Android</label>
                </div>                
            </div`
    }
}

customElements.define('add-remotes', AddRemotes)

var remotes = JSON.parse(localStorage.getItem("remotes") || "[]") as RemoteItem[]

export async function initRemotes(folderId: string) {
    await request<Nothing>("putremotes", { folderId, remotes })        
}

export async function addRemotes(folderId: string) {
    const adderName = document.getElementById("adder-name") as HTMLInputElement
    adderName.value = ""
    const adderIp = document.getElementById("adder-ip") as HTMLInputElement
    adderIp.value = ""
    const adderType = document.getElementById("adder-type") as HTMLInputElement
    adderType.checked = false
    const dialog = document.querySelector('dialog-box') as DialogBox
    const res = await dialog.show({
        text: "Remote-Verbindung anlegen",
        extended: "add-remotes",
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })
    if (res.result == Result.Ok) {
        const item: RemoteItem = {
            name: adderName.value,
            ip: adderIp.value,
            isAndroid: adderType.checked
        }

        remotes = remotes.concat([item])
        localStorage.setItem("remotes", JSON.stringify(remotes))
        await initRemotes(folderId)        
    }
}

export async function renameRemote(folderId: string, param: RenameRemote) {
    function renameRemote(remoteItem: RemoteItem) {
        return remoteItem.name == param.name
            ? {
                name: param.newName,
                ip: remoteItem.ip,
                isAndroid: remoteItem.isAndroid
            }
            : remoteItem
    }

    remotes = remotes.map(renameRemote)
    localStorage.setItem("remotes", JSON.stringify(remotes))
    await initRemotes(folderId)        
}