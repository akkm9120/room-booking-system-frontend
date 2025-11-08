import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const Bookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editForm, setEditForm] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    attendees: 1,
  });
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const isAdmin = role === 'admin';

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings', isAdmin],
    queryFn: isAdmin ? bookingService.getAllBookings : bookingService.getMyBookings,
  });

  const approveMutation = useMutation({
    mutationFn: bookingService.approveBooking,
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking approved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve booking');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => bookingService.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking rejected successfully');
      setRejectReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: bookingService.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookingService.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking updated successfully');
      setShowEditModal(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    },
  });

  const handleApprove = (bookingId) => {
    if (window.confirm('Are you sure you want to approve this booking?')) {
      approveMutation.mutate(bookingId);
    }
  };

  const handleReject = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleDelete = (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      deleteMutation.mutate(bookingId);
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({ id: selectedBooking.id, reason: rejectReason });
    setShowModal(false);
    setSelectedBooking(null);
  };

  const handleCancel = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (!selectedBooking) return;
    cancelMutation.mutate(selectedBooking.id);
  };

  const openEdit = (booking) => {
    setSelectedBooking(booking);
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`;
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    setEditForm({
      booking_date: dateStr,
      start_time: startTimeStr,
      end_time: endTimeStr,
      purpose: booking.purpose || '',
      attendees: booking.expected_attendees || 1,
    });
    setShowEditModal(true);
  };

  const submitEdit = () => {
    if (!selectedBooking) return;
    const startDateTime = `${editForm.booking_date}T${editForm.start_time}:00`;
    const endDateTime = `${editForm.booking_date}T${editForm.end_time}:00`;

    const payload = {
      booking_date: editForm.booking_date,
      start_time: startDateTime,
      end_time: endDateTime,
      purpose: editForm.purpose,
      expected_attendees: editForm.attendees,
    };

    updateMutation.mutate({ id: selectedBooking.id, data: payload });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border border-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border border-red-200', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: X }
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${config.color}`}>
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings?.data?.filter(booking => {
    const term = searchTerm.trim().toLowerCase();
    const visitorName = `${booking.visitor?.first_name || ''} ${booking.visitor?.last_name || ''}`.trim().toLowerCase();
    const visitorEmail = booking.visitor?.email?.toLowerCase() || '';
    const roomName = booking.room?.room_name?.toLowerCase() || '';
    
    const matchesSearch = term
      ? visitorName.includes(term) || visitorEmail.includes(term) || roomName.includes(term)
      : true;
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isAdmin ? 'Booking Management' : 'My Bookings'}
        </h1>
        <div className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
          Total: {filteredBookings.length} bookings
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
        <div className="flex items-center mb-3">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-700">Filters</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={isAdmin ? "Search by visitor name, email, or room..." : "Search by room name..."}
                className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {`${booking.visitor?.first_name || ''} ${booking.visitor?.last_name || ''}`.trim() || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.visitor?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.visitor?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {booking.room?.room_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Capacity: {booking.room?.capacity || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDate(booking.start_time)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(booking.end_time)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate" title={booking.purpose}>
                        {booking.purpose || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        ${booking.total_cost || booking.room?.hourly_rate || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {isAdmin && (
                          <>
                            {booking.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(booking.id)}
                                  disabled={approveMutation.isLoading}
                                  className="inline-flex items-center justify-center p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(booking)}
                                  disabled={rejectMutation.isLoading}
                                  className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancel(booking)}
                                disabled={cancelMutation.isLoading}
                                className="inline-flex items-center justify-center p-2 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                title="Cancel Booking"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => openEdit(booking)}
                              className="inline-flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              title="Update Booking"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              disabled={deleteMutation.isLoading}
                              className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Delete Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(booking)}
                              className="inline-flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              title="Update Booking"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              disabled={deleteMutation.isLoading}
                              className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Delete Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            // Implement a detailed view if needed
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
            <div className="flex items-center mb-4 text-red-600 border-b pb-3">
              <XCircle className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Reject Booking</h3>
            </div>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this booking:</p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all mb-4"
              rows={3}
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
            <div className="flex items-center mb-4 text-yellow-600 border-b pb-3">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Cancel Booking</h3>
            </div>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowCancelModal(false)} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                No, Keep It
              </button>
              <button 
                onClick={confirmCancel} 
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all">
            <div className="flex items-center mb-4 text-blue-600 border-b pb-3">
              <Edit className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Update Booking</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={editForm.booking_date}
                  onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={editForm.attendees}
                  onChange={(e) => setEditForm({ ...editForm, attendees: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={editForm.purpose}
                  onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={submitEdit} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;