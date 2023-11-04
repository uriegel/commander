import './IconName.css'
import Folder from "../svg/Folder"
import Parent from "../svg/Parent"
import Drive from '../svg/Drive'
import Home from '../svg/Home'
import Remote from '../svg/Remote'
import Android from '../svg/Android'
import New from '../svg/New'
import Service from '../svg/Service'
import Favorite from '../svg/Favorite'

export enum IconNameType {
    Parent,
    Root,
    Home,
    Folder,
    File,
    Remote,
    Android,
    New,
    Service,
    Favorite
}

interface IconNameProps {
    namePart: string
    iconPath?: string
    type: IconNameType
}

const IconName = ({ namePart, type, iconPath }: IconNameProps) => 
    (<span> { type == IconNameType.Folder
        ? (<Folder />)
        : type == IconNameType.File
        ? (<img className="iconImage" src={`http://localhost:20000/commander/geticon?path=${iconPath}`} alt="" />)
        : type == IconNameType.Root
        ? (<Drive />)
        : type == IconNameType.Home
        ? (<Home />)
        : type == IconNameType.Android
        ? (<Android />)
        : type == IconNameType.Remote
        ? (<Remote />)
        : type == IconNameType.New
        ? (<New />)
        : type == IconNameType.Service
        ? (<Service />)
        : type == IconNameType.Favorite
        ? (<Favorite />)
        : (<Parent />)
        }
        <span>{namePart}</span>
    </span>)

export default IconName