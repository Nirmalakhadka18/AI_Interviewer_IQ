import React from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

function Timer({ timeLeft, totalTime }) {
    const percentage = (timeLeft / totalTime) * 100

    return (
        <div className='w-28 h-28 mx-auto flex items-center justify-center'>
            <CircularProgressbar
                value={percentage}
                text={`${timeLeft}s`}
                styles={buildStyles({
                    textSize: "18px",
                    pathColor: "#10b981",
                    textColor: "#ef4444",
                    trailColor: "#e5e7eb",
                    textWeight: "bold",
                })}
            />
        </div>
    )
}

export default Timer