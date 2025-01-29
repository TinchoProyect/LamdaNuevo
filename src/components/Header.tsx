import React from 'react';
import "./Header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Lamda } from "../utils/empresaData";

export const Header = () => {
    return (
        <header className="header-container">
            <div className="container">
                <div className="header-main">
                    {/* Sección Logo - Tamaño original */}
                    <div className="logo-section">
                        <div className="logo-wrapper">
                            <img
                                src="/src/assets/Logo.jpg"
                                alt="Lamda Banking"
                                className="logo"
                                loading="lazy"
                            />
                        </div>
                    </div>

                    {/* Datos Bancarios - Estructura mejorada */}
                    <div className="account-info">
                        <div className="bank-data-container">
                            <div className="info-item">
                                <span className="info-label">Cuenta:</span>
                                <span className="info-value">{Lamda.tipoDeCuenta}</span>
                            </div>
                            
                            <div className="info-item">
                                <span className="info-label">N° Cuenta:</span>
                                <span className="info-value">{Lamda.numeroDeCuenta}</span>
                            </div>
                            
                            <div className="info-item">
                                <span className="info-label">CBU:</span>
                                <span className="info-value">{Lamda.cbu}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};