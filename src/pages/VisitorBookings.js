import React, { useState, useEffect } from 'react';
import { visitorBookingsApi } from '../services/visitorApi';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, MapPin, Users, DollarSign, 
  CheckCircle, XCircle, AlertCircle, X, Trash2, History 
} from 'lucide-react';
import { format } from 'date-fns';

const VisitorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active or history
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'active' 
        ? await visitorBookingsApi.getAllBookings()
        : await visitorBookingsApi.getBookingHistory();
      setBookings(response.data.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelLoading(true);
    try {
      await visitorBookingsApi.cancelBooking(selectedBooking.id);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: AlertCircle,
        label: 'Pending',
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Confirmed',
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Cancelled',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Rejected',
      },
      completed: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: CheckCircle,
        label: 'Completed',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your room bookings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Active Bookings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Booking History
            </button>
          </nav>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {activeTab === 'active' ? 'No active bookings' : 'No booking history'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {activeTab === 'active' 
              ? 'Book a room to get started!' 
              : 'Your completed bookings will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {booking.room?.room_name || 'Room'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Reference: <span className="font-mono font-medium">{booking.booking_reference}</span>
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(booking.booking_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {booking.room?.location || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {booking.attendees} attendees
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Purpose:</span> {booking.purpose}
                    </p>
                    {booking.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.description}
                      </p>
                    )}
                  </div>

                  {booking.total_cost && (
                    <div className="mt-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        Total Cost: ${parseFloat(booking.total_cost).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {activeTab === 'active' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                      className="flex-1 lg:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {booking.admin_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {booking.admin_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this booking?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Room:</span> {selectedBooking.room?.room_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span> {formatDate(selectedBooking.booking_date)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Time:</span> {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Reference:</span> {selectedBooking.booking_reference}
                </p>
              </div>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorBookings;