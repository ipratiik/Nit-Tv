import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Provider } from "react-redux"
import SocketProvider from "./Components/VideoCalling/context/SocketProvider";
import Room from "./Components/VideoCalling/screens/Room"
function App() {

  return (
    <>
      <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Room roomHeight={500} roomWidth={500} />} />
            </Routes>
          </BrowserRouter>
      </SocketProvider>
    </>
  )
}

export default App
 