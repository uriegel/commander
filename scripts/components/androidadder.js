class AndroidAdder extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div class='android-adder'>
                <input id="adder-name" class="wdb-focusable" placeholder="Anzeigenamen festlegen">
                <input id="adder-ip" class="wdb-focusable" placeholder="IP-Adresse des Handys">
            </div`
    }
}

customElements.define('android-adder', AndroidAdder)

