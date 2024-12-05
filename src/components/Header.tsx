import "./Header.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const Header = () => {
    return (
        <header className="bg-light py-3 shadow">
            <div className="container d-flex align-items-center justify-content-center">
                <img
                    src="/src/assets/Logo.jpg"
                    alt="Logo de Lamda"
                    className="img-fluid"
                    style={{ width: "350px" }}
                />
            </div>
        </header>
    )
}