import React, {useEffect, useState} from 'react';
import './styles/Admin.css';
import AdminHeaderComponent from "../components/AdminHeaderComponent.jsx";
import axios from "axios";
import API_CONFIG from '../config/api.js';

import AdminPageLayout from "./AdminPageLayout.jsx";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";

const AdminLayout = () => {
    const [upToDate, setUpToDate] = useState([{}]);
    const authHeader = useAuthHeader();
    const authUser = useAuthUser();

    if (!authUser || authUser.role !== 'admin') {
        return null;
    }

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/cache/getLastUpdate`, {
            headers: {
                'Authorization': authHeader
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