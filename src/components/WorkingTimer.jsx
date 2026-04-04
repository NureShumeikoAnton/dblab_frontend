import React, { useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import './styles/WorkingTimer.css';

const pad = (n) => String(n).padStart(2, '0');

const formatElapsed = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatDate = (date) => {
    const day = pad(date.getDate());
    const month = date.toLocaleString('en', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

const formatTime = (date) =>
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const WorkingTimer = () => {
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (isPaused) return;
        const id = setInterval(() => {
            setElapsed((e) => e + 1);
            setNow(new Date());
        }, 1000);
        return () => clearInterval(id);
    }, [isPaused]);

    return (
        <div className={`working-timer${isPaused ? ' working-timer--paused' : ''}`}>
            <span className="working-timer__text">{formatDate(now)}</span>
            <span className="working-timer__text working-timer__clock">{formatTime(now)}</span>
            <span className="working-timer__divider">·</span>
            <button
                className="working-timer__pause"
                onClick={() => setIsPaused((p) => !p)}
                title={isPaused ? 'Resume timer' : 'Pause timer'}
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
            >
                {isPaused ? <Play size={11} /> : <Pause size={11} />}
            </button>
            <span className="working-timer__text working-timer__elapsed">
                Working: {formatElapsed(elapsed)}
            </span>
        </div>
    );
};

export default WorkingTimer;
