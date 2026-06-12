import React from 'react';
import './styles/InteractiveGuideComponent.css';

const steps = [
    {
        number: '01',
        title: 'Create a Project',
        desc: 'Give it a name and description. A project is the top-level container for one or more database schemas.',
    },
    {
        number: '02',
        title: 'Build Your Schema',
        desc: 'Add tables, define columns with data types, and draw relationships on a visual canvas.',
    },
    {
        number: '03',
        title: 'Normalize Step by Step',
        desc: 'Walk through 1NF → 2NF → 3NF with guided hints that detect violations automatically.',
    },
];

const InteractiveGuideComponent = () => (
    <aside className="iguide">
        <div className="iguide__header">
            <span className="iguide__badge">How it works</span>
            <p className="iguide__tagline">
                Design, normalize, and export your database schema — all in one place.
            </p>
        </div>
        <div className="iguide__steps">
            {steps.map((s, i) => (
                <div className="iguide__step" key={i}>
                    <div className="iguide__step-num">{s.number}</div>
                    <div className="iguide__step-content">
                        <strong className="iguide__step-title">{s.title}</strong>
                        <span className="iguide__step-desc">{s.desc}</span>
                    </div>
                </div>
            ))}
        </div>
    </aside>
);

export default InteractiveGuideComponent;
