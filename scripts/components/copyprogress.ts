export class CopyProgressDialog extends HTMLElement {
    constructor() {
        super()
        //const additionalStyle = `
        this.innerHTML = `
            <div class='copy-progress-root' tabIndex=1>
                <p>
                    <span class="fileName"></span>
                </p>
            </div`
        
        this.fileNameSpan = this.getElementsByClassName("fileName")[0] as HTMLSpanElement
    }

    createdCallback() {
        this.tabIndex = 0
    }

    override focus() { 
        //this.table.setFocus() 
        this.tabIndex = -1
    }

    override blur() { 
        this.tabIndex = 0
    }

    setFileName(value: string) {
        this.fileNameSpan.innerText = value
    }

    private fileNameSpan: HTMLSpanElement
}

customElements.define('copy-progress', CopyProgressDialog)
