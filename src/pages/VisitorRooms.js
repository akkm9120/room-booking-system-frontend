import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitorRoomsApi, visitorBookingsApi } from '../services/visitorApi';
import toast from 'react-hot-toast';
import { 
  Search, MapPin, Users, DollarSign, Clock, 
  X, Calendar, AlertCircle, CheckCircle, Building2 
} from 'lucide-react';

const VisitorRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Booking form state
  const [bookingData, setBookingData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    description: '',
    attendees: 1,
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await visitorRoomsApi.getAllRooms();
      setRooms(response.data.data);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const roomTypes = [
    { value: 'all', label: 'All Rooms' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'conference_room', label: 'Conference Room' },
    { value: 'meeting_room', label: 'Meeting Room' },
    { value: 'lab', label: 'Lab' },
  ];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = 
      room.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || room.room_type === selectedType;
    
    return matchesSearch && matchesType && room.is_available;
  });

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setBookingData({ ...bookingData, booking_date: today });
    toast.success('Opening booking form');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!bookingData.booking_date || !bookingData.start_time || !bookingData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if end time is after start time
    if (bookingData.end_time <= bookingData.start_time) {
      toast.error('End time must be after start time');
      return;
    }

    // Format times as full datetime strings to match backend expectations
    const startDateTime = `${bookingData.booking_date}T${bookingData.start_time}:00`;
    const endDateTime = `${bookingData.booking_date}T${bookingData.end_time}:00`;

    setBookingLoading(true);
    try {
      // Pre-check availability to avoid 400 errors from conflicts
      try {
        const availability = await visitorRoomsApi.checkAvailability(selectedRoom.id, {
          booking_date: bookingData.booking_date,
          start_time: startDateTime,
          end_time: endDateTime,
        });
        if (availability.data && availability.data.available === false) {
          toast.error(availability.data.message || 'Room not available for the selected time');
          return;
        }
      } catch (availabilityError) {
        // If availability check fails, continue with booking attempt
        console.warn('Availability check failed, proceeding with booking:', availabilityError);
      }

      const payload = {
        room_id: selectedRoom.id,
        booking_date: bookingData.booking_date,
        start_time: startDateTime,
        end_time: endDateTime,
        purpose: bookingData.purpose,
        description: bookingData.description,
        attendees: bookingData.attendees,
      };

      await visitorBookingsApi.createBooking(payload);
      toast.success(
        selectedRoom.requires_approval
          ? 'Booking request submitted! Waiting for approval.'
          : 'Booking confirmed successfully!'
      );
      setShowBookingModal(false);
      setBookingData({
        booking_date: '',
        start_time: '',
        end_time: '',
        purpose: '',
        description: '',
        attendees: 1,
      });
      navigate('/visitor/bookings');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create booking';
      toast.error(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Rooms</h1>
        <p className="text-gray-600">Find and book the perfect room for your needs</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by room name, number, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Room Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {roomTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No rooms found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
            >
              {/* Room Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-white opacity-50" />
              </div>

              {/* Room Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {room.room_name}
                    </h3>
                    <p className="text-sm text-gray-500">{room.room_number}</p>
                  </div>
                  {room.requires_approval && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Approval Required
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {room.description}
                </p>

                {/* Room Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {room.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    Capacity: {room.capacity} people
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    ${room.hourly_rate}/hour
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {amenity.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Book Button */}
                <button
                  type="button"
                  onClick={() => handleBookRoom(room)}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Book Room</h2>
                <p className="text-sm text-gray-600">
                  {selectedRoom.room_name} - {selectedRoom.room_number}
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {/* Approval Notice */}
              {selectedRoom.requires_approval && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    This room requires approval. Your booking will be pending until approved by an administrator.
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.booking_date}
                    onChange={(e) => setBookingData({ ...bookingData, booking_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingData.start_time}
                    onChange={(e) => setBookingData({ ...bookingData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingData.end_time}
                    onChange={(e) => setBookingData({ ...bookingData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom.capacity}
                  value={bookingData.attendees}
                  onChange={(e) => setBookingData({ ...bookingData, attendees: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum capacity: {selectedRoom.capacity} people
                </p>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Team Meeting, Presentation, Workshop"
                  value={bookingData.purpose}
                  onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add any additional details about your booking..."
                  value={bookingData.description}
                  onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Estimated Cost */}
              {bookingData.start_time && bookingData.end_time && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-900">
                      Estimated Cost:
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      ${(() => {
                        const start = new Date(`2000-01-01T${bookingData.start_time}`);
                        const end = new Date(`2000-01-01T${bookingData.end_time}`);
                        const hours = (end - start) / (1000 * 60 * 60);
                        return (hours * parseFloat(selectedRoom.hourly_rate)).toFixed(2);
                      })()}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-1">
                    Rate: ${selectedRoom.hourly_rate}/hour
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorRooms;