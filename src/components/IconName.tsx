import Folder from "../svg/Folder"
import Parent from "../svg/Parent"

export enum IconNameType {
    Parent,
    Folder
}

interface IconNameProps {
    namePart: string
    type: IconNameType
}

const IconName = ({ namePart, type }: IconNameProps) => (
    <div> { type == IconNameType.Folder
            ? (<Folder />)
            : (<Parent />)
        }
        <span>{namePart}</span>
    </div>
    
)

export default IconName