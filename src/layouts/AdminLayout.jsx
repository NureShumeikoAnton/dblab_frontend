import React from 'react';
import './styles/Admin.css';
import AdminHeaderComponent from "../components/AdminHeaderComponent.jsx";

import AdminPageLayout from "./AdminPageLayout.jsx";

const AdminLayout = () => {
    return (
        <div className={"admin-layout-container"}>
            <AdminHeaderComponent />
            <main>
                <AdminPageLayout/>
            </main>
            <footer>
                <div className="footer-text">
                    <p>&copy; 2023 DBLAB. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default AdminLayout;