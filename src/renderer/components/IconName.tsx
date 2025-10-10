import { IconNameType } from "../items-provider/items"
import Android from "../svg/Android"
import New from "../svg/New"
import "./IconName.css"

interface IconNameProps {
    namePart: string
    iconPath?: string
    type: IconNameType
}

const IconName = ({ namePart, type, iconPath }: IconNameProps) => 
    (<span> { type == IconNameType.Folder
        ? (<img className="image" src={`icon://name/folder-open`} alt="" />)
        : type == IconNameType.File
        ? (<img className="iconImage" src={`icon://ext/${iconPath}`} alt="" />)
        : type == IconNameType.Root
        ? (<img className="image" src={`icon://name/drive-removable-media`} alt="" />)
        : type == IconNameType.RootEjectable
        ? (<img className="image" src={`icon://name/media-removable`} alt="" />)
        : type == IconNameType.Home
        ? (<img className="image" src={`icon://name/user-home`} alt="" />)
        : type == IconNameType.Android
        ? (<Android />)
        : type == IconNameType.Remote
        ? (<img className="image" src={`icon://name/network-server`} alt="" />)
        : type == IconNameType.New
        ? (<New />)
        : type == IconNameType.Favorite
        ? (<img className="image" src={`icon://name/starred`} alt="" />)
        : (<img className="image" src={`icon://name/go-up`} alt="" />)
        }
        <span>{namePart}</span>
    </span>)

export default IconName