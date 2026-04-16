import './App.css'
import {Route, Routes} from "react-router-dom";
import { RequireAuth } from 'react-auth-kit';

import HomePage from "./pages/HomePage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import DirectionsPage from "./pages/DirectionsPage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import DirectionDetailsPage from "./pages/DirectionDetailsPage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";

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
import Lessons from "./pages/adminPages/lessons.jsx";
import Events from "./pages/adminPages/events.jsx";
import Materials from './pages/adminPages/materials.jsx';
import ResourcePage from './pages/ResourcePage.jsx';
import MyResourcesPage from './pages/MyResourcesPage.jsx';
import StackPage from './pages/StackPage.jsx';
import MyStacksPage from './pages/MyStacksPage.jsx';

import Directions from './pages/adminPages/directions.jsx';
import Proposals from './pages/adminPages/proposals.jsx';
import ProposalTypes from './pages/adminPages/proposalTypes.jsx';
import Results from './pages/adminPages/results.jsx';
import ResultTypes from './pages/adminPages/resultTypes.jsx';
import Works from './pages/adminPages/works.jsx';
import Magazines from './pages/adminPages/magazines.jsx';
import Conferences from './pages/adminPages/conferences.jsx';
import Competitions from './pages/adminPages/competitions.jsx';
import Statistics from './pages/adminPages/statistics.jsx';
import MagazineStatistics from './pages/adminPages/magazineStatistics.jsx';
import PeriodStatistics from './pages/adminPages/periodStatistics.jsx';
import StudentProposals from './pages/StudentProposals';
import StudentResults from './pages/StudentResults';
import StudentDirections from './pages/StudentDirections';
import ReportsPage from './pages/adminPages/ReportsPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudentWorkDetails from './pages/StudentWorkDetails';
import WorkPage from './pages/WorkPage';

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
                    <Route path={"/library"} element={<LibraryPage/>}/>
                    <Route path={"/library/resource/:resourceId"} element={<ResourcePage/>}/>
                    <Route path={"/library/myresources/:userId"} element={<MyResourcesPage/>}/>
                    <Route path={"/library/mystacks/:userId"} element={<MyStacksPage/>}/>
                    <Route path={"/library/stack/:stackId"} element={<StackPage/>}/>
                    <Route path={"/studentproposals"} element={<StudentProposals/>}/>
                    <Route path={"/studentresults"} element={<StudentResults/>}/>
                    <Route path={"/studentdirections"} element={<StudentDirections/>}/>
                    <Route path={"/dashboard"} element={<Dashboard/>}/>
                    <Route path="/work/:id" element={<RequireAuth fallbackPath="/"><StudentWorkDetails/></RequireAuth>} />
                    <Route path="/workpage/:id" element={<WorkPage/>} />
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
                    <Route path={"lessons"} element={<Lessons/>}></Route>
                    <Route path={"events"} element={<Events/>}></Route>
                    <Route path={"materials"} element={<Materials/>}></Route>
                    
                    <Route path={"directions"} element={<Directions/>}></Route>
                    <Route path={"proposals"} element={<Proposals/>}></Route>
                    <Route path={"proposaltypes"} element={<ProposalTypes/>}></Route>
                    <Route path={"works"} element={<Works/>}></Route>
                    <Route path={"resulttypes"} element={<ResultTypes/>}></Route>
                    <Route path={"magazines"} element={<Magazines/>}></Route>
                    <Route path={"conferences"} element={<Conferences/>}></Route>
                    <Route path={"competitions"} element={<Competitions/>}></Route>
                    <Route path={"results"} element={<Results/>}></Route>
                    <Route path={"statistics"} element={<Statistics/>}></Route>
                    <Route path={"statistics/magazines"} element={<MagazineStatistics/>}></Route>
                    <Route path={"statistics/period"} element={<PeriodStatistics/>}></Route>
                    <Route path={"reports"} element={<ReportsPage/>}></Route>
                </Route>
            </Routes>
        </div>
    )
}

export default App
