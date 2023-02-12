import './IconName.css'
import Folder from "../svg/Folder"
import Parent from "../svg/Parent"

export enum IconNameType {
    Parent,
    Folder,
    File
}

interface IconNameProps {
    namePart: string
    iconPath?: string
    type: IconNameType
}

const IconName = ({ namePart, type, iconPath }: IconNameProps) => 
    (<div> { type == IconNameType.Folder
        ? (<Folder />)
        : type == IconNameType.File
        ? (<img className="iconImage" src={`http://localhost:20000/commander/geticon?path=${iconPath}`} alt="" />)
        : (<Parent />)
        }
        <span>{namePart}</span>
    </div>)

export default IconName