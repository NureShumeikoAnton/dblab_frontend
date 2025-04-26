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

// Example data structure for a single direction
const frontendRoadmapData = {
    direction: "Фронтенд",
    levels: [
        {
            name: "Basic",
            sections: [
                {
                    name: "HTML",
                    skills: [
                        { name: "Структура HTML документу", link: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure" },
                        { name: "Семантичні теги", link: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/HTML_text_fundamentals" },
                        { name: "Форми та валідація", link: "https://developer.mozilla.org/en-US/docs/Learn/Forms" }
                    ]
                },
                {
                    name: "CSS",
                    skills: [
                        { name: "Селектори", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors" },
                        { name: "Блочна модель", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model" },
                        { name: "Flexbox", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" }
                    ]
                }
            ]
        },
        {
            name: "Beginner",
            sections: [
                {
                    name: "JavaScript",
                    skills: [
                        { name: "Типи даних", link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures" },
                        { name: "Функції", link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions" },
                        { name: "DOM маніпуляції", link: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model" }
                    ]
                },
                {
                    name: "Інструменти розробника",
                    skills: [
                        { name: "Chrome DevTools", link: "https://developer.chrome.com/docs/devtools/" },
                        { name: "VS Code", link: "https://code.visualstudio.com/" },
                        { name: "Git основи", link: "https://git-scm.com/book/en/v2/Getting-Started-Git-Basics" }
                    ]
                }
            ]
        },
        {
            name: "Intermediate",
            sections: [
                {
                    name: "React",
                    skills: [
                        { name: "Компоненти та пропси", link: "https://reactjs.org/docs/components-and-props.html" },
                        { name: "Стан та життєвий цикл", link: "https://reactjs.org/docs/state-and-lifecycle.html" },
                        { name: "Hooks", link: "https://reactjs.org/docs/hooks-intro.html" }
                    ]
                },
                {
                    name: "Стилізація в React",
                    skills: [
                        { name: "CSS Modules", link: "https://github.com/css-modules/css-modules" },
                        { name: "Styled Components", link: "https://styled-components.com/" },
                        { name: "Tailwind CSS", link: "https://tailwindcss.com/" }
                    ]
                }
            ]
        },
        {
            name: "Advanced",
            sections: [
                {
                    name: "Стан додатку",
                    skills: [
                        { name: "Redux", link: "https://redux.js.org/" },
                        { name: "Context API", link: "https://reactjs.org/docs/context.html" },
                        { name: "React Query", link: "https://react-query.tanstack.com/" }
                    ]
                }
            ]
        }
    ]
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
const RoadmapComponent = () => {
    const roadmapData = frontendRoadmapData;

    return (
        <div className="roadmap-container">
            <h2 className="roadmap-title">{roadmapData.direction}</h2>
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