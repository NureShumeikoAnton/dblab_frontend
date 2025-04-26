import './App.css'
import {Route, Routes} from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import DirectionDetailsPage from "./pages/DirectionDetailsPage.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Teachers from "./pages/adminPages/teachers.jsx";
import Languages from "./pages/adminPages/languages.jsx";


const App = () => {


    return (
        <div className="App">
            <Routes>
                <Route path={'/'} Component={MainLayout}>
                    <Route path={"/"} element={<HomePage/>}/>
                    <Route path={"/courses"} element={<CoursesPage/>}/>
                    <Route path={"/courses/:courseId"} element={<CourseDetailsPage/>}/>
                    <Route path={"/directions"}></Route>
                    <Route path={"/directions/:directionId"} element={<DirectionDetailsPage/>}></Route>
                    <Route path={"/schedule"} element={<SchedulePage/>}/>
                    <Route path={"/contact"} element={<ContactPage/>}/>
                </Route>
                <Route path={'/apanel'} Component={AdminLayout}>
                    <Route path={"teachers"} element={<Teachers/>}></Route>
                    <Route path={"languages"} element={<Languages/>}></Route>
                </Route>
                <Route path={"/test"} element={<TestPage/>}></Route>
            </Routes>
        </div>
    )
}

export default App
