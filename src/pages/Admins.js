import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserPlus, 
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Admins = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if current user is super admin
  const isSuperAdmin = user?.role === 'super_admin';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'admin'
  });

  const { data: admins, isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: adminService.getAllAdmins,
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      toast.success('Admin created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      const validationMessage = error.response?.data?.errors?.[0]?.msg;
      toast.error(validationMessage || error.response?.data?.message || 'Failed to create admin');
    },
  });

  const activateMutation = useMutation({
    mutationFn: adminService.activateAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      toast.success('Admin activated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to activate admin');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: adminService.deactivateAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      toast.success('Admin deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate admin');
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'admin'
    });
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'username') {
      // Enforce backend constraint: only letters, numbers, and underscores
      processedValue = value
        .replace(/\s+/g, '_') // convert whitespace to underscores
        .replace(/[^a-zA-Z0-9_]/g, ''); // strip invalid characters
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submissionData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
  phone: formData.phone ? formData.phone.trim() : '',
      role: formData.role
    };
    
    // Basic validation
    if (!submissionData.username || !submissionData.email || !submissionData.password || 
        !submissionData.first_name || !submissionData.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Username validation to mirror backend rules
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(submissionData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submissionData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation
    if (submissionData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    createMutation.mutate(submissionData);
  };

  const handleActivateAdmin = (adminId) => {
    if (window.confirm('Are you sure you want to activate this admin?')) {
      activateMutation.mutate(adminId);
    }
  };

  const handleDeactivateAdmin = (adminId) => {
    if (window.confirm('Are you sure you want to deactivate this admin?')) {
      deactivateMutation.mutate(adminId);
    }
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        role === 'super_admin' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        <Shield className="h-3 w-3 mr-1" />
        {role === 'super_admin' ? 'Super Admin' : 'Admin'}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <UserCheck className="h-3 w-3 mr-1" />
        ) : (
          <UserX className="h-3 w-3 mr-1" />
        )}
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAdmins = admins?.data?.filter(admin => {
    const matchesSearch = 
      admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || admin.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && admin.is_active) ||
      (statusFilter === 'inactive' && !admin.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only super administrators can manage admin accounts.</p>
      </div>
    );
  }

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
        <UserPlus className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load admins</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Create Admin
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, username, or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAdmins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Admin</th>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Contact</th>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Role</th>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Status</th>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Created</th>
                  <th className="px-4 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">
                      <div>
                        <div className="font-medium text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{admin.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">{getRoleBadge(admin.role)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">{getStatusBadge(admin.is_active)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(admin.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200 bg-white">
                      <div className="flex space-x-2">
                        {admin.is_active ? (
                          <button
                            onClick={() => handleDeactivateAdmin(admin.id)}
                            disabled={deactivateMutation.isLoading || admin.id === user?.id}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={admin.id === user?.id ? "Cannot deactivate yourself" : "Deactivate Admin"}
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateAdmin(admin.id)}
                            disabled={activateMutation.isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-2 rounded text-sm"
                            title="Activate Admin"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No admins found</p>
          </div>
        )}
      </div>

      {/* Admin Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {admins?.data?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Total Admins</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {admins?.data?.filter(a => a.role === 'super_admin').length || 0}
          </div>
          <div className="text-sm text-gray-600">Super Admins</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {admins?.data?.filter(a => a.is_active).length || 0}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {admins?.data?.filter(a => !a.is_active).length || 0}
          </div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create New Admin</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., john_doe"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Allowed characters: letters, numbers, underscores. Spaces convert to underscores automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="admin@uow.edu.au"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+61-2-4221-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Super admins can create and manage other admin accounts.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
