import React from 'react';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { FileText, Download } from 'lucide-react';
import '../adminPages/styles/ReportsPage.css';

const ReportsPage = () => {
    const authHeader = useAuthHeader();

    const downloadFile = async (endpoint, filename) => {
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/report/${endpoint}`, {
                headers: { 'Authorization': authHeader },
                responseType: 'blob',
            });

            // Створення посилання для скачування
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Помилка при формуванні звіту");
        }
    };

    return (
        <div className="reports-page">
            <h1 className="reports-title">Генерація звітів</h1>
            
            <div className="reports-grid">
                {/* Картка для Плану */}
                <div className="report-card" onClick={() => downloadFile('plan', 'Plan_DBLAB.docx')}>
                    <div className="report-content">
                        <FileText size={64} color="#009CCF" strokeWidth={1.5} />
                        <h3 className="report-name">План роботи</h3>
                        <p className="report-description">
                            Завантажити автоматично сформований план роботи гуртка (список студентів, викладачів).
                        </p>
                        <button className="report-download-btn">
                            <Download size={18} /> Завантажити .DOCX
                        </button>
                    </div>
                </div>

                {/* Картка для Звіту */}
                <div className="report-card" onClick={() => downloadFile('year-report', 'Report_DBLAB.docx')}>
                    <div className="report-content">
                        <FileText size={64} color="#009CCF" strokeWidth={1.5} />
                        <h3 className="report-name">Річний звіт</h3>
                        <p className="report-description">
                            Завантажити звіт про результати (публікації, конференції) за поточний рік.
                        </p>
                        <button className="report-download-btn">
                            <Download size={18} /> Завантажити .DOCX
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;