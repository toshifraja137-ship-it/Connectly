
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <Toaster
                position="bottom-center"
                gutter={12}
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: "#1e293b",
                        color: "#f8fafc",
                        borderRadius: "10px",
                        border: "1px solid #334155",
                        fontSize: "14px",
                        fontWeight: 500
                    },
                    success: {
                        iconTheme: { primary: "#22c55e", secondary: "#fff" }
                    },
                    error: {
                        iconTheme: { primary: "#ef4444", secondary: "#fff" }
                    }
                }}
            />
            <App />
        </AuthProvider>
    </React.StrictMode>
);
