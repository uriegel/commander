import { forwardRef, useImperativeHandle } from "react"

export type CommanderHandle = {
    onKeyDown: (evt: React.KeyboardEvent)=>void
}

const Commander = forwardRef<CommanderHandle, object>((_, ref) => {
    useImperativeHandle(ref, () => ({
        onKeyDown
    }))

    const onKeyDown = (evt: React.KeyboardEvent) => {
        if (evt.code == "Tab" && !evt.shiftKey) {
            // TODO		getInactiveFolder()?.setFocus()
            evt.preventDefault()
            evt.stopPropagation()
        }
    }
    
    return (
        <>
            <div>Kommandant</div>
        </>
    )
})

export default Commander