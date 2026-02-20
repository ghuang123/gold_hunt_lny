import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './screens/Landing.jsx'
import Courtyard from './screens/Courtyard.jsx'
import Room from './screens/Room.jsx'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/courtyard" element={<Courtyard />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
