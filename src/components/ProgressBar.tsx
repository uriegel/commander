import "./ProgressBar.css"

export interface ProgressBarProps {
    value: number
}

const ProgressBar = ({ value }: ProgressBarProps) => (
    <div className="progressBarContainer">
    <div className="progressBarValue" style={{ width: `${value * 100}%` }} /></div>
)

export default ProgressBar