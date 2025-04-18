import React, { useState } from "react";
import axios from "axios";
import { User, Mail, Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react";
import InputFieldComponent from "./InputFieldComponent.jsx";
import "./styles/AuthModal.css";
import useSignIn from "react-auth-kit/hooks/useSignIn";

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
            // Login validation
            if (!formData.email && !formData.login) {
                newErrors.emailOrLogin = "Email or Login is required";
            }
            if (!formData.password) {
                newErrors.password = "Password is required";
            }
        } else {
            // Registration validation
            if (!formData.login) {
                newErrors.login = "Login is required";
            } else if (!/^[a-zA-Z0-9]+$/.test(formData.login)) {
                newErrors.login = "Login can only contain English letters and numbers";
            }

            if (!formData.nickname) {
                newErrors.nickname = "Nickname is required";
            }

            if (!formData.email) {
                newErrors.email = "Email is required";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Email is invalid";
            }

            if (!formData.password) {
                newErrors.password = "Password is required";
            } else if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Please confirm your password";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            setApiError("");

            const response = await axios.post("http://localhost:5000/auth/login", {
                login: formData.email,
                email: formData.email,
                password: formData.password
            });

            // Handle successful login with react-auth-kit
            signIn({
                auth: {
                    token: response.data.token,
                    type: 'Bearer'
                }
            })

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
            console.error("Login error:", error);
            setApiError(
                error.response?.data?.message ||
                "Failed to login. Please check your credentials."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            setIsLoading(true);
            setApiError("");

            const response = await axios.post("http://localhost:5000/auth/register", {
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
                    login: "Login is busy"
                });
                setApiError("Login is busy");
            }
            else {
                setApiError(
                    error.response?.data?.message ||
                    "Failed to register. Please try again."
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
                    <h2>{isLogin ? "Sign In" : "Create Account"}</h2>
                </div>

                <div className="auth-tabs">
                    <button
                        className={isLogin ? "active-tab" : ""}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button
                        className={!isLogin ? "active-tab" : ""}
                        onClick={() => setIsLogin(false)}
                    >
                        Register
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
                                label="Login"
                                name="login"
                                icon={<User size={20} />}
                                placeholder="Enter your login"
                                value={formData.login}
                                onChange={handleChange}
                                error={errors.login}
                            />
                            <p className="input-note">Note: Will be hidden from other users</p>

                            <InputFieldComponent
                                label="Nickname"
                                name="nickname"
                                icon={<User size={20} />}
                                placeholder="Enter your nickname (e.g. John Smith)"
                                value={formData.nickname}
                                onChange={handleChange}
                                error={errors.nickname}
                            />
                            <p className="input-note">Note: Will be shown to everyone</p>
                        </>
                    )}

                    <InputFieldComponent
                        label={isLogin ? "Email or Login" : "Email"}
                        name="email"
                        icon={<Mail size={20} />}
                        placeholder={isLogin ? "Enter your email or login" : "Enter your email"}
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email || errors.emailOrLogin}
                    />

                    <InputFieldComponent
                        label="Password"
                        name="password"
                        icon={<Lock size={20} />}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        isPassword={true}
                    />

                    {!isLogin && (
                        <InputFieldComponent
                            label="Confirm Password"
                            name="confirmPassword"
                            icon={<Lock size={20} />}
                            placeholder="Confirm your password"
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
                                <span>Remember Me</span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Processing..."
                            : (isLogin ? "Sign In" : "Create Account")
                        }
                    </button>

                    <div className="auth-switch">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={toggleView}
                                className="switch-btn"
                            >
                                {isLogin ? "Register" : "Login"}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModalComponent;