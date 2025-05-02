import './App.css'
import {Route, Routes} from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import DirectionsPage from "./pages/DirectionsPage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import DirectionDetailsPage from "./pages/DirectionDetailsPage.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Teachers from "./pages/adminPages/teachers.jsx";
import Languages from "./pages/adminPages/languages.jsx";
import Skills from "./pages/adminPages/skills.jsx";
import Disciplines from "./pages/adminPages/disciplines.jsx";
import DevelopmentDirections from "./pages/adminPages/developmentDirections.jsx";
import Levels from "./pages/adminPages/levels.jsx";
import Chapters from "./pages/adminPages/chapters.jsx";
import DisciplineTeachers from "./pages/adminPages/disciplineTeachers.jsx";
import DisciplineSkills from "./pages/adminPages/disciplineSkills.jsx";


const App = () => {


    return (
        <div className="App">
            <Routes>
                <Route path={'/'} Component={MainLayout}>
                    <Route path={"/"} element={<HomePage/>}/>
                    <Route path={"/courses"} element={<CoursesPage/>}/>
                    <Route path={"/courses/:courseId"} element={<CourseDetailsPage/>}/>
                    <Route path={"/directions"} element={<DirectionsPage/>}/>
                    <Route path={"/directions/:directionId"} element={<DirectionDetailsPage/>}></Route>
                    <Route path={"/schedule"} element={<SchedulePage/>}/>
                    <Route path={"/contact"} element={<ContactPage/>}/>
                </Route>
                <Route path={'/apanel'} Component={AdminLayout}>
                    <Route path={"teachers"} element={<Teachers/>}></Route>
                    <Route path={"languages"} element={<Languages/>}></Route>
                    <Route path={"skills"} element={<Skills/>}></Route>
                    <Route path={"disciplines"} element={<Disciplines/>}></Route>
                    <Route path={"developmentdirections"} element={<DevelopmentDirections/>}></Route>
                    <Route path={"levels"} element={<Levels/>}></Route>
                    <Route path={"chapters"} element={<Chapters/>}></Route>
                    <Route path={"disciplineteacher"} element={<DisciplineTeachers/>}></Route>
                    <Route path={"disciplineskill"} element={<DisciplineSkills/>}></Route>
                </Route>
            </Routes>
        </div>
    )
}

export default App
