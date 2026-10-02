import { Routes, Route } from "react-router-dom";

import Home from "../Pages/Home"
import MainPage from "../Pages/mainPage"

import React from 'react'

function AppRoutes() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/main" element={<MainPage />} />
            </Routes>
        </div>
    )
}

export default AppRoutes