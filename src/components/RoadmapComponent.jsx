import { useState } from 'react';
import './styles/Roadmap.css'; // Adjust the path as necessary

// Level colors from your specification
const levelColors = {
    Basic: "#ADD8E6",
    Beginner: "#32CD32",
    Intermediate: "#FFD700",
    Advanced: "#FF8C00",
    Expert: "#FF4500",
    Master: "#8A2BE2",
};

// Component for individual skill
const Skill = ({ skill }) => {
    return (
        <div className="skill">
            {skill.link ? (
                <a href={skill.link} target="_blank" rel="noopener noreferrer" className="skill-link">{skill.name}</a>
            ) : (
                <span>{skill.name}</span>
            )}
        </div>
    );
};

// Component for a section with skills
const Section = ({ section, color, isEven }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sectionStyle = {
        borderLeft: isEven ? 'none' : `4px solid ${color}`,
        borderRight: isEven ? `4px solid ${color}` : 'none',
    };

    return (
        <div className={`section-wrapper ${isEven ? 'section-right' : 'section-left'}`}>
            <div className="circle"></div>
            <div className={`section`} style={sectionStyle}>
                <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
                    <span className="section-name">{section.name}</span>
                    <span className="dropdown-icon">{isOpen ? '▼' : '►'}</span>
                </div>
                {isOpen && (
                    <div className="skills-container">
                        {section.skills.map((skill, index) => (
                            <Skill key={index} skill={skill}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const LevelBlock = ({level, color}) => {
    return (
        <div className="level-block">
            <div className="level-header" style={{backgroundColor: color}}>
                {level.name}
            </div>
            <div className="sections-container">
                {level.sections.map((section, index) => (
                    <Section
                        key={index}
                        section={section}
                        color={color}
                        isEven={(index % 2) === 1}
                    />
                ))}
            </div>
        </div>
    );
}

// Main Roadmap component
const RoadmapComponent = ({roadmapData}) => {
    return (
        <div className="roadmap-container">
            <h2 className="roadmap-title">Твоя карта розвитку</h2>
            <div className="roadmap">
                <div className="vertical-line"></div>

                {roadmapData.levels.map((level, levelIndex) => (
                    <LevelBlock
                        key={levelIndex}
                        level={level}
                        color={levelColors[level.name]}
                    />
                ))}
            </div>
        </div>
    );
};

export default RoadmapComponent;