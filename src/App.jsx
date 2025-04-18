import './App.css'
import {Route, Routes} from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";

import MainLayout from "./layouts/MainLayout.jsx";



const App = () => {
    const data = [
        {
            "level": "Basic",
            "sections": [
                {
                    "title": "SQL Fundamentals",
                    "skills": [
                        { "name": "SELECT Queries", "link": "/select-queries" },
                        { "name": "JOINs", "link": "/joins" }
                    ]
                },
                {
                    "title": "Excel for Data Analysis",
                    "skills": [
                        { "name": "Pivot Tables", "link": "/pivot-tables" },
                        { "name": "Data Cleaning", "link": null }
                    ]
                }
            ]
        },
        {
            "level": "Beginner",
            "sections": [
                {
                    "title": "Python",
                    "skills": [
                        { "name": "Data Structures", "link": "/data-structures" },
                        { "name": "OOP Basics", "link": "/oop-basics" }
                    ]
                },
                {
                    "title": "Statistics",
                    "skills": [
                        { "name": "Descriptive Statistics", "link": "/descriptive-statistics" },
                        { "name": "Probability Theory", "link": null }
                    ]
                }
            ]
        }
    ]


    return (
        <div className="App">
            <Routes>
                <Route path={'/'} Component={MainLayout}>
                    <Route path={"/"} element={<HomePage/>}/>
                    <Route path={"/courses"} element={<CoursesPage/>}/>
                    <Route path={"/schedule"} element={<SchedulePage/>}/>
                    <Route path={"/contact"} element={<ContactPage/>}/>
                </Route>
            </Routes>
        </div>
    )
}

export default App
