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
import { IconNameType } from '../enums'

interface IconNameProps {
    namePart: string
    iconPath?: string
    type: IconNameType
}

const IconName = ({ namePart, type, iconPath }: IconNameProps) => 
    (<span> { type == IconNameType.Folder
        ? (<Folder />)
        : type == IconNameType.File
        ? (<img className="iconImage" src={`res://commander.react/geticon/${iconPath}`} alt="" />) 
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