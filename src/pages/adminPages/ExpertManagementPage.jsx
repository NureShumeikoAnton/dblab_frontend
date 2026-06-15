import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowUpDown, CheckCircle, XCircle, Mail, Users2, Hash, X } from 'lucide-react';
import dayjs from 'dayjs';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import axios from 'axios';
import API_CONFIG from '../../config/api.js';
import { useToast } from '../../context/ToastContext';
import './styles/ExpertManagement.css';

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = { student: 'Студент', expert: 'Експерт', admin: 'Адмін' };
const STATUS_LABEL = { pending: 'Очікує', approved: 'Схвалено', rejected: 'Відхилено' };

// ── page ─────────────────────────────────────────────────────────────────────

const ExpertManagementPage = () => {
    const authUser = useAuthUser();
    const navigate = useNavigate();
    const [tab, setTab] = useState('requests');

    useEffect(() => {
        if (!authUser || authUser.role !== 'admin') {
            navigate('/');
        }
    }, [authUser, navigate]);

    return (
        <div className="expert-mgmt-page">
            <h1 className="expert-mgmt-title">Управління експертами</h1>
            <div className="expert-mgmt-tabs">
                <button
                    className={`expert-mgmt-tab ${tab === 'requests' ? 'active' : ''}`}
                    onClick={() => setTab('requests')}
                >
                    Запити на роль
                </button>
                <button
                    className={`expert-mgmt-tab ${tab === 'users' ? 'active' : ''}`}
                    onClick={() => setTab('users')}
                >
                    Користувачі
                </button>
            </div>

            {tab === 'requests' ? <RequestsTab /> : <UsersTab />}
        </div>
    );
};

export default ExpertManagementPage;

function RequestsTab() {
    const authHeader = useAuthHeader();
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [sortDir, setSortDir] = useState('asc');
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_CONFIG.BASE_URL}/expertRequest/getAll`, {
                headers: { 'Authorization': authHeader }
            });
            setRequests(res.data);
        } catch (error) {
            console.error('Failed to load expert requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const displayed = [...requests]
        .filter(req => statusFilter ? req.status === statusFilter : true)
        .sort((a, b) => {
            const diff = new Date(a.creation_date) - new Date(b.creation_date);
            return sortDir === 'asc' ? diff : -diff;
        });

    const handleApprove = async (req) => {
        try {
            // First update the user's role to expert
            if (req.User) {
                const { password, ...userData } = req.User;
                await axios.put(`${API_CONFIG.BASE_URL}/user/${req.user_id}`,
                    { ...userData, role: 'expert' },
                    { headers: { 'Authorization': authHeader } }
                );
            }

            // If role update succeeds (or wasn't needed), update request status
            await axios.put(`${API_CONFIG.BASE_URL}/expertRequest/update/${req.request_id}`, 
                { status: 'approved' },
                { headers: { 'Authorization': authHeader } }
            );
            
            addToast('Запит успішно схвалено', 'success');
            fetchRequests();
        } catch (error) {
            console.error('Failed to approve request', error);
            addToast('Не вдалося призначити роль експерта', 'error');
        }
    };

    const handleReject = async (req) => {
        try {
            await axios.put(`${API_CONFIG.BASE_URL}/expertRequest/update/${req.request_id}`, 
                { status: 'rejected' },
                { headers: { 'Authorization': authHeader } }
            );
            fetchRequests();
        } catch (error) {
            console.error('Failed to reject request', error);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/expertRequest/delete/${confirmDeleteTarget.request_id}`, {
                headers: { 'Authorization': authHeader }
            });
            fetchRequests();
            setConfirmDeleteTarget(null);
        } catch (error) {
            console.error('Failed to delete request', error);
        }
    };

    if (loading) {
        return <p className="expert-mgmt-empty">Завантаження...</p>;
    }

    return (
        <div className="requests-tab-container">
            {/* Delete Confirmation Modal */}
            {confirmDeleteTarget && (
                <div className="modal-overlay" onClick={() => setConfirmDeleteTarget(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-card__header">
                            <p className="modal-card__title">Видалення запиту</p>
                            <button className="modal-card__close" onClick={() => setConfirmDeleteTarget(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-card__body">
                            <p>
                                Ви впевнені, що хочете видалити цей запит від користувача{' '}
                                <strong>{confirmDeleteTarget.User?.nickname || 'Невідомий'}</strong>?
                            </p>
                            <p className="confirm-delete-warning">
                                Ця дія є незворотною.
                            </p>
                            <div className="modal-card__actions">
                                <button className="cancel-btn-text" onClick={() => setConfirmDeleteTarget(null)}>
                                    Скасувати
                                </button>
                                <button className="req-reject-btn" onClick={handleDeleteConfirm}>
                                    Видалити
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Sort */}
            <div className="users-tab-controls users-tab-controls-container">
                <div className="users-filter-group">
                    {['', 'pending', 'approved', 'rejected'].map(s => (
                        <button
                            key={s}
                            className={`users-filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === '' ? 'Усі' : STATUS_LABEL[s]}
                        </button>
                    ))}
                </div>
                <div className="users-tab-sort-container">
                    <button
                        className="users-filter-btn users-filter-btn-sort"
                        onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                        title={sortDir === 'desc' ? 'Спочатку старі' : 'Спочатку нові'}
                    >
                        <ArrowUpDown size={15} />
                        {sortDir === 'desc' ? 'Спочатку старі' : 'Спочатку нові'}
                    </button>
                </div>
            </div>

            {displayed.length === 0 ? (
                <p className="expert-mgmt-empty">Запитів немає.</p>
            ) : (
                <div className="requests-list">
                    {displayed.map(req => {
                        const user = req.User;
                        return (
                        <div key={req.request_id} className={`request-card request-card--${req.status}`}>
                            <div className="request-card__header">
                                <span className="request-card__user">
                                    <User size={14} /> {user?.nickname || 'Невідомий'}
                                </span>
                                <span className="request-card__date">
                                    {dayjs(req.creation_date).format('DD.MM.YYYY HH:mm')}
                                </span>
                                <span className={`request-card__status status-badge--${req.status}`}>
                                    {STATUS_LABEL[req.status]}
                                </span>
                            </div>
                            {user && (
                                <div className="request-card__user-info">
                                    <span className="request-card__info-item">
                                        <Mail size={12} /> {user.email}
                                    </span>
                                    {user.student_group && (
                                        <span className="request-card__info-item">
                                            <Users2 size={12} /> {user.student_group}
                                        </span>
                                    )}
                                    <span className="request-card__info-item">
                                        <Hash size={12} /> ID: {user.user_Id || user.user_id}
                                    </span>
                                </div>
                            )}
                            {req.message ? (
                                <p className="request-card__message">«{req.message}»</p>
                            ) : (
                                <p className="request-card__message request-card__message--empty">
                                    Без повідомлення
                                </p>
                            )}
                            
                            <div className="request-card__actions request-card__actions-container">
                                <div className="request-card__actions-group">
                                    {req.status === 'pending' && (
                                        <>
                                            <button
                                                className="req-approve-btn"
                                                onClick={() => handleApprove(req)}
                                            >
                                                <CheckCircle size={14} /> Схвалити
                                            </button>
                                            <button
                                                className="req-reject-btn"
                                                onClick={() => handleReject(req)}
                                            >
                                                <XCircle size={14} /> Відхилити
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button
                                    className="req-reject-btn req-reject-btn-outline"
                                    onClick={() => setConfirmDeleteTarget(req)}
                                >
                                    <X size={14} /> Видалити
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
    const authHeader = useAuthHeader();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [sortKey, setSortKey] = useState('nickname');
    const [sortDir, setSortDir] = useState('asc');
    const [confirmTarget, setConfirmTarget] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_CONFIG.BASE_URL}/user/getall`, {
                headers: { 'Authorization': authHeader }
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const displayed = [...users]
        .filter(u => roleFilter ? u.role === roleFilter : true)
        .sort((a, b) => {
            const va = String(a[sortKey] ?? '').toLowerCase();
            const vb = String(b[sortKey] ?? '').toLowerCase();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });

    const handleConfirmToggle = async () => {
        const newRole = confirmTarget.role === 'expert' ? 'student' : 'expert';
        try {
            const { password, ...userData } = confirmTarget;
            await axios.put(`${API_CONFIG.BASE_URL}/user/${confirmTarget.user_Id}`,
                { ...userData, role: newRole },
                { headers: { 'Authorization': authHeader } }
            );
            fetchUsers();
            setConfirmTarget(null);
        } catch (error) {
            console.error('Failed to toggle user role', error);
        }
    };

    const SortTh = ({ field, label }) => (
        <th className="users-table__sortable" onClick={() => toggleSort(field)}>
            {label}{sortKey === field && <ArrowUpDown size={13} className="sort-icon-ml" />}
        </th>
    );

    if (loading) {
        return <p className="expert-mgmt-empty">Завантаження...</p>;
    }

    return (
        <div>
            {/* Confirmation modal */}
            {confirmTarget && (
                <div className="modal-overlay" onClick={() => setConfirmTarget(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-card__header">
                            <p className="modal-card__title">Зміна ролі</p>
                            <button className="modal-card__close" onClick={() => setConfirmTarget(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-card__body">
                            <p>
                                Змінити роль користувача{' '}
                                <strong>{confirmTarget.nickname}</strong>{' '}
                                з <strong>{ROLE_LABEL[confirmTarget.role]}</strong> на{' '}
                                <strong>{ROLE_LABEL[confirmTarget.role === 'expert' ? 'student' : 'expert']}</strong>?
                            </p>
                            <div className="modal-card__actions">
                                <button className="cancel-btn-text" onClick={() => setConfirmTarget(null)}>
                                    Скасувати
                                </button>
                                <button
                                    className={confirmTarget.role === 'expert' ? 'req-reject-btn' : 'req-approve-btn'}
                                    onClick={handleConfirmToggle}
                                >
                                    Підтвердити
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="users-tab-controls">
                <div className="users-filter-group">
                    {['', 'student', 'expert', 'admin'].map(r => (
                        <button
                            key={r}
                            className={`users-filter-btn ${roleFilter === r ? 'active' : ''}`}
                            onClick={() => setRoleFilter(r)}
                        >
                            {r === '' ? 'Усі' : ROLE_LABEL[r]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <table className="users-table">
                <colgroup>
                    <col className="col-username" />
                    <col className="col-email" />
                    <col className="col-group" />
                    <col className="col-role" />
                    <col className="col-action" />
                </colgroup>
                <thead>
                    <tr>
                        <SortTh field="nickname" label="Нікнейм" />
                        <SortTh field="email" label="Email" />
                        <SortTh field="student_group" label="Група" />
                        <SortTh field="role" label="Роль" />
                        <th>Дія</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.map(u => (
                        <tr key={u.user_Id}>
                            <td>{u.nickname || 'Невідомий'}</td>
                            <td>{u.email}</td>
                            <td>{u.student_group ?? '–'}</td>
                            <td>
                                <span className={`role-badge role-badge--${u.role}`}>
                                    {ROLE_LABEL[u.role]}
                                </span>
                            </td>
                            <td>
                                {u.role !== 'admin' && (
                                    <button
                                        className={u.role === 'expert' ? 'req-reject-btn' : 'req-approve-btn'}
                                        onClick={() => setConfirmTarget(u)}
                                    >
                                        {u.role === 'expert' ? 'Зробити студентом' : 'Зробити експертом'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
