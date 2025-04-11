import { Outlet } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import "./styles/Main.css";

const MainLayout = () => {
    return (
        <div className={"main-layout-container"}>
            <HeaderComponent />
            <main>
                <Outlet />
            </main>
            <FooterComponent />
        </div>
    );
};

export default MainLayout;
