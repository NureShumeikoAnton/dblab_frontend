import { Outlet } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";

const MainLayout = () => {
    return (
        <div>
            <HeaderComponent />
            <main>
                <Outlet />
            </main>
            <FooterComponent />
        </div>
    );
};

export default MainLayout;
