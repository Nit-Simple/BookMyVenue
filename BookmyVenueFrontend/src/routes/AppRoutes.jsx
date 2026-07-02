import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home'
import VenueList from '../pages/VenueList'
import MyBookings from '../pages/MyBookings'
import VenueDetails from '../pages/VenueDetails'
import Booking from '../pages/Booking'

import Login from '../pages/Login'

import ManagerLayout from '../layouts/ManagerLayout'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import ManagerVenues from '../pages/manager/ManagerVenues'
import AddVenue from '../pages/manager/AddVenue'
import ManagerVenueBooking from '../pages/manager/ManagerVenueBooking'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/venues" element={<VenueList />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/venues/:venueId" element={<VenueDetails />} />
        <Route path="/venues/:venueId/book" element={<Booking />} />
      </Route>

      <Route path="/manager" element={<ManagerLayout />}>
        <Route index element={<ManagerDashboard />} />
        <Route path="venues" element={<ManagerVenues />} />
        <Route path="venues/new" element={<AddVenue />} />
        <Route path="venues/:venueId/bookings" element={<ManagerVenueBooking />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes

