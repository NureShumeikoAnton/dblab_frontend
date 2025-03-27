import { Outlet } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";

const MainLayout = () => {
    return (
        <div>
            <HeaderComponent />
            <main>
                <Outlet /> {/* This will render the active route component */}
            </main>
        </div>
    );
};

export default MainLayout;
