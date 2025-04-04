import { BrowserRouter, Route, Routes } from "react-router-dom";
import SocketProvider from "./Components/VideoCalling/context/SocketProvider";
import Room from "./Components/VideoCalling/screens/Room";
import Home from "./Components/Home/Home";
import Maintenance from '../Maintenance';

const isUnderMaintenance = true;

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={isUnderMaintenance ? <Maintenance /> : <Home />}
          />
          <Route path="/nitExclusive" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
