import './App.css'
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";

const App = () => {
    return (
        <div className="App">
            <Routes>
                <Route path={'/'} Component={MainLayout}>
                    <Route path={"/"} element={<HomePage/>}/>
                </Route>
            </Routes>
        </div>
    )
}

export default App
