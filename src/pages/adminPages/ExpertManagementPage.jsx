import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowUpDown, CheckCircle, XCircle, Mail, Users2, Hash, X } from 'lucide-react';
import dayjs from 'dayjs';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { MOCK_USERS, MOCK_EXPERT_REQUESTS } from '../../mocks/expertiseMockData.js';
import './styles/ExpertManagement.css';

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = { student: 'Студент', expert: 'Експерт', admin: 'Адмін' };
const STATUS_LABEL = { pending: 'Очікує', approved: 'Схвалено', rejected: 'Відхилено' };

function setUserRole(userId, role) {
    const idx = MOCK_USERS.findIndex(u => u.user_Id === userId);
    if (idx !== -1) MOCK_USERS[idx].role = role;
}

function setRequestStatus(requestId, status) {
    const idx = MOCK_EXPERT_REQUESTS.findIndex(r => r.request_Id === requestId);
    if (idx !== -1) MOCK_EXPERT_REQUESTS[idx].status = status;
}

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
    const [requests, setRequests] = useState([...MOCK_EXPERT_REQUESTS]);

    const sorted = [...requests].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
    );

    const handleApprove = (req) => {
        setUserRole(req.user_Id, 'expert');
        setRequestStatus(req.request_Id, 'approved');
        setRequests([...MOCK_EXPERT_REQUESTS]);
    };

    const handleReject = (req) => {
        setRequestStatus(req.request_Id, 'rejected');
        setRequests([...MOCK_EXPERT_REQUESTS]);
    };

    if (sorted.length === 0) {
        return <p className="expert-mgmt-empty">Запитів немає.</p>;
    }

    return (
        <div className="requests-list">
            {sorted.map(req => {
                const user = MOCK_USERS.find(u => u.user_Id === req.user_Id);
                return (
                <div key={req.request_Id} className={`request-card request-card--${req.status}`}>
                    <div className="request-card__header">
                        <span className="request-card__user">
                            <User size={14} /> {req.username}
                        </span>
                        <span className="request-card__date">
                            {dayjs(req.created_date).format('DD.MM.YYYY HH:mm')}
                        </span>
                        <span className={`request-card__status status-badge--${req.status}`}>
                            {STATUS_LABEL[req.status]}
                        </span>
                    </div>
                    {user && (
                        <div className="request-card__user-info">
                            <span className="request-card__info-item">
                                <User size={12} /> {user.full_name}
                            </span>
                            <span className="request-card__info-item">
                                <Mail size={12} /> {user.email}
                            </span>
                            {user.group && (
                                <span className="request-card__info-item">
                                    <Users2 size={12} /> {user.group}
                                </span>
                            )}
                            <span className="request-card__info-item">
                                <Hash size={12} /> ID: {user.user_Id}
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
                    {req.status === 'pending' && (
                        <div className="request-card__actions">
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
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
    const [users, setUsers] = useState([...MOCK_USERS]);
    const [roleFilter, setRoleFilter] = useState('');
    const [sortKey, setSortKey] = useState('username');
    const [sortDir, setSortDir] = useState('asc');
    const [confirmTarget, setConfirmTarget] = useState(null);

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

    const handleConfirmToggle = () => {
        const newRole = confirmTarget.role === 'expert' ? 'student' : 'expert';
        setUserRole(confirmTarget.user_Id, newRole);
        setUsers([...MOCK_USERS]);
        setConfirmTarget(null);
    };

    const SortTh = ({ field, label }) => (
        <th className="users-table__sortable" onClick={() => toggleSort(field)}>
            {label}{sortKey === field && <ArrowUpDown size={13} style={{ marginLeft: 4 }} />}
        </th>
    );

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
                                <strong>{confirmTarget.username}</strong>{' '}
                                ({confirmTarget.full_name})
                                {' '}з <strong>{ROLE_LABEL[confirmTarget.role]}</strong> на{' '}
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
                    <col className="col-fullname" />
                    <col className="col-email" />
                    <col className="col-group" />
                    <col className="col-role" />
                    <col className="col-action" />
                </colgroup>
                <thead>
                    <tr>
                        <SortTh field="username" label="Нікнейм" />
                        <SortTh field="full_name" label="ПІБ" />
                        <th>Email</th>
                        <th>Група</th>
                        <SortTh field="role" label="Роль" />
                        <th>Дія</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.map(u => (
                        <tr key={u.user_Id}>
                            <td>{u.username}</td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.group ?? '–'}</td>
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
