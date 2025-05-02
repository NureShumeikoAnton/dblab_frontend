import React from 'react';
import {useEffect, useState} from 'react';
import RoadmapComponent from "../components/RoadmapComponent.jsx";
import axios from "axios";

import './styles/DirectionDetails.css';

const frontendRoadmapData = {
    direction: {
        development_direction_Id: 1,
        development_direction_name: "Фронтенд",
        development_direction_Description: "Навчись створювати сайти"
    },
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
        },
        {
            name: "Expert",
            sections: [
                {
                    name: "Оптимізація",
                    skills: [
                        { name: "Code Splitting", link: "https://reactjs.org/docs/code-splitting.html" },
                        { name: "Мемоізація", link: "https://reactjs.org/docs/react-api.html#reactmemo" },
                        { name: "Профілювання", link: "https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html" }
                    ]
                }
            ]
        },
        {
            name: "Master",
            sections: [
                {
                    name: "Архітектура",
                    skills: [
                        { name: "Design Patterns", link: "https://www.patterns.dev/" },
                        { name: "Micro Frontends", link: "https://micro-frontends.org/" },
                        { name: "Isomorphic/Universal Apps", link: "https://nextjs.org/" }
                    ]
                }
            ]
        }
    ]
};

const DirectionDetailsPage = () => {
    const [loading, setLoading] = useState(false);
    const [direction, setDirection] = useState(frontendRoadmapData);

    useEffect(() => {
        axios.get(`http://localhost:5000/developmentDirection/getRoad/${window.location.pathname.split('/').pop()}`)
            .then(response => {
                console.log(response.data);
                setDirection(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching direction details:", error);
            });
    }, []);

    if(loading) {
        return (
            <div className="loading">
                <h1>Loading...</h1>
            </div>
        );
    }

    return (
        <div>
            <div className="direction-header-container">
                <h1>{direction.direction.development_direction_name}</h1>
                <h2>{direction.direction.development_direction_Description}</h2>
            </div>
            <RoadmapComponent
                roadmapData={direction}
            />
        </div>
    );
};

export default DirectionDetailsPage;