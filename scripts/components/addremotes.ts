class AddRemotes extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div class='add-remotes'>
                <input id="adder-name" class="wdb-focusable" placeholder="Anzeigenamen festlegen">
                <input id="adder-ip" class="wdb-focusable" placeholder="IP-Adresse des externen Gerätes">
            </div`
    }
}

customElements.define('add-remotes', AddRemotes)

