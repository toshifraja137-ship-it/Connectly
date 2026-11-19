
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/Notfound";
import Navbar from "./components/Navbar";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";

function App() {
    return (
        <BrowserRouter>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
