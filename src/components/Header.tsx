import "./Header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Lamda } from "../utils/empresaData";

export const Header = () => {
    return (
        <header className="header-container">
            <div className="container">
                <div className="header-content">
                    <div className="header-main">
                        <div className="logo-section">
                            <div className="logo-wrapper">
                                <img
                                    src="/src/assets/Logo.jpg"
                                    alt="Logo de Lamda"
                                    className="logo"
                                />
                                <div className="alias-container">
                                    <span className="info-label">Alias:</span>
                                    <span className="alias-value">{Lamda.alias}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="info-grid">
                        <div className="info-column left">
                            <div className="info-row">
                                <span className="info-label">Titular:</span>
                                <span className="info-value">{Lamda.titular}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">DNI:</span>
                                <span className="info-value">{Lamda.dni}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">CUIT:</span>
                                <span className="info-value">{Lamda.cuit}</span>
                            </div>
                        </div>
                        <div className="info-column right">
                            <div className="info-row">
                                <span className="info-label">Tipo de Cuenta:</span>
                                <span className="info-value">{Lamda.tipoDeCuenta}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Número:</span>
                                <span className="info-value">{Lamda.numeroDeCuenta}</span>
                            </div>
                            <div className="info-row">
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