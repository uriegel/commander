import Android from "../svg/Android"
import New from "../svg/New"
import "./IconName.css"

export const IconNameType = {
    Parent: 'Parent',
    Root: 'Root',
    RootEjectable: 'RootEjectable',
    Home: 'Home',
    Folder: 'Folder',
    File: 'File',
    Remote: 'Remote',
    Android: 'Android',
    New: 'New',
    Service: 'Service',
    Favorite: 'Favorite'
}
export type IconNameType = (typeof IconNameType)[keyof typeof IconNameType]

interface IconNameProps {
    namePart: string
    iconPath?: string
    type: IconNameType
}

const IconName = ({ namePart, type, iconPath }: IconNameProps) => 
    (<span> { type == IconNameType.Folder
        ? (<img className="image" src={`icon://local/folder-open`} alt="" />)
        : type == IconNameType.File
        ? (<img className="iconImage" src={`icon://local/${iconPath}`} alt="" />)
        : type == IconNameType.Root
        ? (<img className="image" src={`icon://local/drive-removable-media`} alt="" />)
        : type == IconNameType.RootEjectable
        ? (<img className="image" src={`icon://local/media-removable`} alt="" />)
        : type == IconNameType.Home
        ? (<img className="image" src={`icon://local/user-home`} alt="" />)
        : type == IconNameType.Android
        ? (<Android />)
        : type == IconNameType.Remote
        ? (<img className="image" src={`icon://local/network-server`} alt="" />)
        : type == IconNameType.New
        ? (<New />)
        : type == IconNameType.Favorite
        ? (<img className="image" src={`icon://local/starred`} alt="" />)
        : (<img className="image" src={`icon://local/go-up`} alt="" />)
        }
        <span>{namePart}</span>
    </span>)

export default IconName