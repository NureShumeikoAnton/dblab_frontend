import React, {useEffect, useState} from 'react';
import './styles/Admin.css';
import AdminHeaderComponent from "../components/AdminHeaderComponent.jsx";
import axios from "axios";

import AdminPageLayout from "./AdminPageLayout.jsx";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const AdminLayout = () => {
    const [upToDate, setUpToDate] = useState([{}]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get("http://localhost:5000/cache/getLastUpdate", {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
            .then((response) => {
                setUpToDate(response.data);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, []);
    return (
        <div className={"admin-layout-container"}>
            <AdminHeaderComponent
                upToDate={upToDate}
            />
            <main>
                <AdminPageLayout/>
            </main>
            <footer>
                <div className="footer-text">
                    <p>Останнє оновлення: {new Date(upToDate[0].lastUpdate).toLocaleString()}</p>
                    <p>&copy; 2023 DBLAB. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default AdminLayout;