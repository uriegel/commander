import { JSX } from "react"
import './Titlebar.css'

interface TitlebarProps {
    menu: JSX.Element
}

const Titlebar = ({ menu }: TitlebarProps) => 
    (<div className="titlebar">
        <img alt="" src={`windowicon://localhost/`} />
        {menu}
        <div className="titlebarGrip">
            <span>Commander</span>
        </div>
    </div>)


export default Titlebar