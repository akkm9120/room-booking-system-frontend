import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { userService } from '../services/userService';
import { roomService } from '../services/roomService';
import { 
  Calendar, 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Filter,
  Download,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    rejectedBookings: 0,
    totalRooms: 0,
    totalUsers: 0,
    recentBookings: [],
    todayBookings: 0,
    thisWeekBookings: 0
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingService.getAllBookings,
  });

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomService.getAllRooms,
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
  });

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchBookings(),
      refetchRooms(),
      refetchUsers()
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    if (bookings?.data && rooms?.data && users?.data) {
      const bookingData = bookings.data;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const pendingCount = bookingData.filter(b => b.status === 'pending').length;
      const confirmedCount = bookingData.filter(b => b.status === 'confirmed').length;
      const rejectedCount = bookingData.filter(b => b.status === 'rejected').length;
      const todayCount = bookingData.filter(b => {
        const bookingDate = new Date(b.startTime);
        return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      const weekCount = bookingData.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= weekAgo;
      }).length;

      const recentBookings = bookingData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setStats({
        totalBookings: bookingData.length,
        pendingBookings: pendingCount,
        confirmedBookings: confirmedCount,
        rejectedBookings: rejectedCount,
        totalRooms: rooms.data.length,
        totalUsers: users.data.length,
        recentBookings,
        todayBookings: todayCount,
        thisWeekBookings: weekCount
      });
    }
  }, [bookings, rooms, users]);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendDirection, description, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {onClick && (
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-3">
            {trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock 
      },
      confirmed: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle 
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (bookingsLoading || roomsLoading || usersLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
        <p className="text-gray-500 text-sm">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          color="bg-blue-500"
          trend="+12% from last month"
          trendDirection="up"
          description={`${stats.thisWeekBookings} bookings this week`}
          onClick={() => navigate('/bookings')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingBookings}
          icon={AlertCircle}
          color="bg-yellow-500"
          description="Requires action"
          onClick={() => navigate('/bookings?status=pending')}
        />
        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          icon={Building}
          color="bg-green-500"
          description={`${stats.todayBookings} booked today`}
          onClick={() => navigate('/rooms')}
        />
        <StatCard
          title="Active Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-purple-500"
          trend="+5% from last month"
          trendDirection="up"
          onClick={() => navigate('/users')}
        />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Confirmed</h3>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.confirmedBookings}</p>
          <p className="text-xs text-green-700 mt-1">Active bookings</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-yellow-900">Pending</h3>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-900">{stats.pendingBookings}</p>
          <p className="text-xs text-yellow-700 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-900">Rejected</h3>
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.rejectedBookings}</p>
          <p className="text-xs text-red-700 mt-1">Declined requests</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
              <p className="text-sm text-gray-500 mt-1">Latest booking requests and updates</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
        
        {stats.recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentBookings.map((booking) => (
                  <tr 
                    key={booking.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {booking.Visitor?.name?.charAt(0) || 'N'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.Visitor?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.Visitor?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {booking.Room?.name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.startTime)}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {formatDate(booking.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFullDate(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="text-primary-600 hover:text-primary-900 font-medium inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No recent bookings found</p>
            <p className="text-sm text-gray-400 mt-1">New bookings will appear here</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/bookings')}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-lg hover:border-primary-200 transition-all duration-200 hover:-translate-y-1"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Bookings</h3>
            <p className="text-sm text-gray-600 mb-4">Review and approve pending booking requests</p>
            <div className="inline-flex items-center text-primary-600 font-medium text-sm">
              View Bookings
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </button>
          
          <button
            onClick={() => navigate('/rooms')}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-lg hover:border-primary-200 transition-all duration-200 hover:-translate-y-1"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Management</h3>
            <p className="text-sm text-gray-600 mb-4">Add, edit, or manage room availability</p>
            <div className="inline-flex items-center text-green-600 font-medium text-sm">
              Manage Rooms
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </button>
          
          <button
            onClick={() => navigate('/users')}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-lg hover:border-primary-200 transition-all duration-200 hover:-translate-y-1"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600 mb-4">View and manage registered users</p>
            <div className="inline-flex items-center text-purple-600 font-medium text-sm">
              Manage Users
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;