import { BrowserRouter, Route, Routes } from "react-router-dom"
import SocketProvider from "./Components/VideoCalling/context/SocketProvider";
import Room from "./Components/VideoCalling/screens/Room"
function App() {

  return (
    <>
      <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Room/>} />
            </Routes>
          </BrowserRouter>
      </SocketProvider>
    </>
  )
}

export default App
 