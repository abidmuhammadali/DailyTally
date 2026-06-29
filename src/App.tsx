import { Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Shops from './pages/Shops'
import ShopDetail from './pages/ShopDetail'
import ShopExpenses from './pages/ShopExpenses'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops"
        element={
          <ProtectedRoute>
            <Shops />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/:id"
        element={
          <ProtectedRoute>
            <ShopDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/:id/expenses"
        element={
          <ProtectedRoute>
            <ShopExpenses />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App