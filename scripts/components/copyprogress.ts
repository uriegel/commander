export type CopyProgressInfo = {
    total:   number
    current: number
}

export type CopyProgress = {
    currentFile: string
    total:       CopyProgressInfo
    current:     CopyProgressInfo
}

export class CopyProgressDialog extends HTMLElement {
    constructor() {
        super()
        //const additionalStyle = `
        this.innerHTML = `
            <div class='copy-progress-root' tabIndex=1>
                <p>
                    <span class="fileName"></span>
                </p>
                <progress class="currentProgress" max="0" value="0"></progress>
            </div`
        
        this.fileNameSpan = this.getElementsByClassName("fileName")[0] as HTMLSpanElement
        this.currentProgress = this.getElementsByClassName("currentProgress")[0] as HTMLProgressElement
    }

    createdCallback() {
        this.tabIndex = 0
    }

    override focus() { 
        this.tabIndex = 0
    }

    override blur() { 
        this.tabIndex = 0
    }

    setValue(value: CopyProgress) {
        this.fileNameSpan.innerText = value.currentFile
        this.currentProgress.max = value.current.total
        this.currentProgress.value = value.current.current
    }

    private fileNameSpan: HTMLSpanElement
    private currentProgress: HTMLProgressElement
}

customElements.define('copy-progress', CopyProgressDialog)
