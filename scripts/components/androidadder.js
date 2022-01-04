import '../components/androidadder'

class AndroidAdder extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
            <div class='android-adder'>
                <input id="adder-name" placeholder="Anzeigenamen festlegen">
                <input id="adder-ip" placeholder="IP-Adresse des Handys">
            </div`
    }
}

customElements.define('android-adder', AndroidAdder)

