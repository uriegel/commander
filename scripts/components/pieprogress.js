const template = document.createElement('template')
template.innerHTML = `  
    <style>
    #wrapper { 
        height: 100%;
        position:relative;
        background-color: var(--pie-background-color);
        border-radius: 100%;
    }
    
    .pie {
        width: 50%;
        height: 100%;
        transform-origin: 100% 50%;
        position: absolute;
        background: var(--pie-progress-color);
    }
    
    #spinner {
        border-radius: 100% 0 0 100% / 50% 0 0 50%;
        border-right:none;
    }
    
    #spinner:after {
        position:absolute;
        width:10px;
        height:10px;
        background:#fff;
        border:1px solid rgba(0,0,0,0.5);
        box-shadow: inset 0 0 3px rgba(0,0,0,0.2);
        border-radius:50%;
        top:10px;
        right:10px;   
        content:"";
        display: none;
    }
    
    #filler {
        border-radius: 0 100% 100% 0 / 0 50% 50% 0; 
        left: 50%;
        opacity: 0;
        z-index: 100;
        border-left: none;
        opacity: 1;
    }
    
    #mask {
        width: 50%;
        height: 100%;
        border-radius: 100% 0 0 100% / 50% 0 0 50%;
        position: absolute;
        background: inherit;
        opacity: 0;
        z-index: 300;
    }    
    </style>
    <div id="wrapper">
        <div id="spinner" class="pie"></div>
        <div id="filler" class="pie"></div>
        <div id="mask"></div>
    </div>
`
class PieProgress extends HTMLElement {
    constructor() {
        super()

        var style = document.createElement("style")
        document.head.appendChild(style)
        style.sheet.insertRule(`:root {
            --pie-progress-color: var(--vtc-selected-background-color);
            --pie-background-color: var(--vtc-background-color);
        }`)

        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.wrapper = this.shadowRoot.getElementById('wrapper')
        this.progress = this.shadowRoot.getElementById('progress')
        this.spinner = this.shadowRoot.getElementById('spinner')
        this.filler = this.shadowRoot.getElementById('filler')
        this.mask = this.shadowRoot.getElementById('mask')
        this.filler.style.opacity = '0'
        this.mask.style.opacity = '1'
        setTimeout(() => this.wrapper.style.width = `${this.wrapper.clientHeight}px`) 
    }

    static get observedAttributes() {
        return ['progress']
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        switch (attributeName) {
            case "progress":
                if (oldValue != newValue)
                    this.setProgress(newValue)
                break
        }
    }

    setProgress(progress) {
        if (progress < 0 || progress > 100)
            progress = 100
        const deg = progress * 3.6
        if (progress > 50) {
            this.filler.style.opacity = '1'
            this.mask.style.opacity = '0'
        } else {
            this.filler.style.opacity = '0'
            this.mask.style.opacity = '1'
        }
        this.spinner.style.transform = `rotate(${deg}deg)`
    }
}

customElements.define('pie-progress', PieProgress)       
