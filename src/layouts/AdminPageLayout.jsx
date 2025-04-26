import React from 'react';
import {Outlet} from 'react-router-dom';
import './styles/AdminPage.css';
import {Link} from 'react-router-dom';
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const AdminPageLayout = () => {
    const tables = [
        {name: 'Teachers', path: '/apanel/teachers'},
        {name: 'Disciplines', path: '/apanel/disciplines'},
        {name: 'Skills', path: '/apanel/skills'},
        {name: 'Levels', path: '/apanel/levels'},
        {name: 'Chapters', path: '/apanel/chapters'},
        {name: 'Languages', path: '/apanel/languages'},
    ];

    const authHeader = useAuthHeader();

    const handleUpdate = () => {
        axios.post('http://localhost:5000/cache/update', null, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
            .then(response => {
                console.log('Cache updated successfully:', response.data);
                alert("Cache updated successfully");
            })
            .catch(error => {
                console.error('Error updating cache:', error);
                alert("Error updating cache");
            });
    }

    return (
        <div className="admin-page-layout">
            <aside className="sidebar">
                <button className="update-button" onClick={handleUpdate}>Update cache</button>
                <ul>
                    {tables.map((table) => (
                        <li key={table.name}>
                            <Link to={`${table.path}`}>
                                {table.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="main-content">
                <Outlet/>
            </main>
        </div>
    );
};

export default AdminPageLayout;