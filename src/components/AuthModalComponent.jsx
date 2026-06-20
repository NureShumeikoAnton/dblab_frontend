import React, { useState } from "react";
import axios from "axios";
import { User, Mail, Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react";
import InputFieldComponent from "./InputFieldComponent.jsx";
import "./styles/AuthModal.css";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import API_CONFIG from '../config/api.js';

const AuthModalComponent = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const signIn = useSignIn();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const [formData, setFormData] = useState({
        login: "",
        nickname: "",
        email: "",
        password: "",
        confirmPassword: "",
        rememberMe: false
    });

    const [errors, setErrors] = useState({});

    const toggleView = () => {
        setIsLogin(!isLogin);
        setErrors({});
        setApiError("");
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });

        // Clear errors when typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ""
            });
        }
        if (apiError) {
            setApiError("");
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (isLogin) {
            if (!formData.email && !formData.login) {
                newErrors.emailOrLogin = "Введіть email або логін";
            }
            if (!formData.password) {
                newErrors.password = "Введіть пароль";
            }
        } else {
            if (!formData.login) {
                newErrors.login = "Введіть логін";
            } else if (!/^[a-zA-Z0-9]+$/.test(formData.login)) {
                newErrors.login = "Логін може містити лише латинські літери та цифри";
            }

            if (!formData.nickname) {
                newErrors.nickname = "Введіть нікнейм";
            }

            if (!formData.email) {
                newErrors.email = "Введіть email";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Невірний формат email";
            }

            if (!formData.password) {
                newErrors.password = "Введіть пароль";
            } else if (formData.password.length < 6) {
                newErrors.password = "Пароль повинен містити не менше 6 символів";
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Підтвердіть пароль";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Паролі не співпадають";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            setApiError("");

            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, {
                login: formData.email,
                email: formData.email,
                password: formData.password
            });

            // Handle successful login with react-auth-kit
            console.log("Login Response:", response.data);

            const user = response.data.user; 

            signIn({
                auth: {
                    token: response.data.token,
                    type: 'Bearer'
                },
                userState: {
                    username: response.data.nickname,
                    user_Id: response.data.user_Id,
                    role: user.role
                }
            });

            console.log("Збережено в Auth State:", { username: user.nickname, id: user.id });

            // clear form data
            setFormData({
                login: "",
                nickname: "",
                email: "",
                password: "",
                confirmPassword: "",
                rememberMe: false
            });

            onClose();

            window.location.reload();
        } catch (error) {
            console.error("Login error:", error);
            setApiError(
                error.response?.data?.message ||
                "Помилка входу. Перевірте ваші дані."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            setIsLoading(true);
            setApiError("");

            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/register`, {
                login: formData.login,
                nickname: formData.nickname,
                email: formData.email,
                password: formData.password
            });

            console.log("Registration response:", response.data);

            // After successful registration
            // clear form data
            setFormData({
                login: "",
                nickname: "",
                email: "",
                password: "",
                confirmPassword: "",
                rememberMe: false
            });

            onClose();
        } catch (error) {
            console.error("Registration error:", error);

            // Handle specific errors from backend
            if (error.response?.status === 400) {
                setErrors({
                    ...errors,
                    login: "Цей логін вже зайнятий"
                });
                setApiError("Цей логін вже зайнятий");
            }
            else {
                setApiError(
                    error.response?.data?.message ||
                    "Помилка реєстрації. Спробуйте ще раз."
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            if (isLogin) {
                handleLogin();
            } else {
                handleRegister();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="auth-modal">
                <button
                    onClick={onClose}
                    className="modal-close"
                >
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <h2>{isLogin ? "Вхід" : "Створити акаунт"}</h2>
                </div>

                <div className="auth-tabs">
                    <button
                        className={isLogin ? "active-tab" : ""}
                        onClick={() => setIsLogin(true)}
                    >
                        Вхід
                    </button>
                    <button
                        className={!isLogin ? "active-tab" : ""}
                        onClick={() => setIsLogin(false)}
                    >
                        Реєстрація
                    </button>
                </div>

                {apiError && (
                    <div className="api-error">
                        <AlertCircle size={16} />
                        <span>{apiError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <InputFieldComponent
                                label="Логін"
                                name="login"
                                icon={<User size={20} />}
                                placeholder="Введіть ваш логін"
                                value={formData.login}
                                onChange={handleChange}
                                error={errors.login}
                            />
                            <p className="input-note">Примітка: не відображається іншим користувачам</p>

                            <InputFieldComponent
                                label="Нікнейм"
                                name="nickname"
                                icon={<User size={20} />}
                                placeholder="Введіть нікнейм (напр. Іван Іваненко)"
                                value={formData.nickname}
                                onChange={handleChange}
                                error={errors.nickname}
                            />
                            <p className="input-note">Примітка: відображається усім користувачам</p>
                        </>
                    )}

                    <InputFieldComponent
                        label={isLogin ? "Email або логін" : "Email"}
                        name="email"
                        icon={<Mail size={20} />}
                        placeholder={isLogin ? "Введіть ваш email або логін" : "Введіть ваш email"}
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email || errors.emailOrLogin}
                    />

                    <InputFieldComponent
                        label="Пароль"
                        name="password"
                        icon={<Lock size={20} />}
                        placeholder="Введіть ваш пароль"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        isPassword={true}
                    />

                    {!isLogin && (
                        <InputFieldComponent
                            label="Підтвердіть пароль"
                            name="confirmPassword"
                            icon={<Lock size={20} />}
                            placeholder="Повторіть ваш пароль"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            isPassword={true}
                        />
                    )}

                    {isLogin && (
                        <div className="remember-me">
                            <label>
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Запам'ятати мене</span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Завантаження..."
                            : (isLogin ? "Увійти" : "Створити акаунт")
                        }
                    </button>

                    <div className="auth-switch">
                        <p>
                            {isLogin ? "Немає акаунту? " : "Вже маєте акаунт? "}
                            <button
                                type="button"
                                onClick={toggleView}
                                className="switch-btn"
                            >
                                {isLogin ? "Зареєструватись" : "Увійти"}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModalComponent;