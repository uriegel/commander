import { DialogBox, Result } from "web-dialog-box"

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

export async function addRemotes() {
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
        const name = adderName.value
        const ip = adderIp.value
        const android = adderType.checked
        
        // save item
        console.log(name, ip, android)
        


    }

}