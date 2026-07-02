import React, { createContext, createRef, useState, useCallback } from 'react';
import { Outlet, Link } from 'react-router-dom';
import './styles/AdminPage.css';
import axios from 'axios';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import ModalNotificationComponent from '../components/ModalNotificationComponent.jsx';
import API_CONFIG from '../config/api.js';

export const NotificationContext = createContext();

const tables = [
    { name: 'Teachers', path: '/apanel/teachers' },
    { name: 'Disciplines', path: '/apanel/disciplines' },
    { name: 'Skills', path: '/apanel/skills' },
    { name: 'Levels', path: '/apanel/levels' },
    { name: 'Chapters', path: '/apanel/chapters' },
    { name: 'Languages', path: '/apanel/languages' },
    { name: 'Development Directions', path: '/apanel/developmentdirections' },
    { name: 'Discipline - Teacher', path: '/apanel/disciplineteacher' },
    { name: 'Discipline - Skill', path: '/apanel/disciplineskill' },
    { name: 'Lessons', path: '/apanel/lessons' },
    { name: 'Events', path: '/apanel/events' },
    { name: 'Materials', path: '/apanel/materials' },
    { name: 'Directions', path: '/apanel/directions' },
    { name: 'Proposals', path: '/apanel/proposals' },
    { name: 'Proposal Types', path: '/apanel/proposaltypes' },
    { name: 'Works', path: '/apanel/works' },
    { name: 'Result Types', path: '/apanel/resulttypes' },
    { name: 'Results', path: '/apanel/results' },
    { name: 'Magazines', path: '/apanel/magazines' },
    { name: 'Conferences', path: '/apanel/conferences' },
    { name: 'Competitions', path: '/apanel/competitions' },
    { name: 'Statistics', path: '/apanel/statistics' },
    { name: 'Reports', path: '/apanel/reports' },
    { name: 'Users', path: '/apanel/users' },
    { name: 'Expert Management', path: '/apanel/experts' },
];

function StorageWidget() {
    const authHeader = useAuthHeader();
    const [db, setDb] = useState(null);
    const [files, setFiles] = useState(null);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        const headers = { Authorization: authHeader };
        const [dbRes, filesRes] = await Promise.allSettled([
            axios.get(`${API_CONFIG.BASE_URL}/storage/getDb`, { headers }),
            axios.get(`${API_CONFIG.BASE_URL}/storage/getFiles`, { headers }),
        ]);
        setDb(dbRes.status === 'fulfilled' ? dbRes.value.data.size : '—');
        setFiles(filesRes.status === 'fulfilled' ? filesRes.value.data.sizeMB : '—');
        setLoading(false);
    }, [authHeader]);

    return (
        <div className="sidebar-storage">
            <div className="sidebar-storage__row">
                <span className="sidebar-storage__label">DB</span>
                <span className="sidebar-storage__value">{db ?? '—'}</span>
            </div>
            <div className="sidebar-storage__row">
                <span className="sidebar-storage__label">Files</span>
                <span className="sidebar-storage__value">{files ?? '—'}</span>
            </div>
            <button className="sidebar-storage__btn" onClick={refresh} disabled={loading}>
                {loading ? '…' : 'Refresh'}
            </button>
        </div>
    );
}

const AdminPageLayout = () => {
    const notificationRef = createRef();

    return (
        <div className="admin-page-layout">
            <aside className="sidebar">
                <StorageWidget />
                <ul>
                    {tables.map((table) => (
                        <li key={table.name}>
                            <Link to={table.path}>{table.name}</Link>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="main-content">
                <NotificationContext.Provider value={notificationRef}>
                    <Outlet />
                </NotificationContext.Provider>
            </main>
            <ModalNotificationComponent ref={notificationRef} />
        </div>
    );
};

export default AdminPageLayout;
