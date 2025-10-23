import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { useForm } from 'react-hook-form';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  MapPin,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Rooms = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const queryClient = useQueryClient();

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomService.getAllRooms,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createMutation = useMutation({
    mutationFn: roomService.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Room created successfully');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create room');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomService.updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Room updated successfully');
      setShowModal(false);
      setEditingRoom(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update room');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: roomService.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Room deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    },
  });

  const handleCreateRoom = () => {
    setEditingRoom(null);
    reset();
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    reset({
      room_number: room.room_number,
      room_name: room.room_name,
      location: room.location,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      room_type: room.room_type,
      description: room.description,
      hourly_rate: room.hourly_rate,
      is_available: room.is_available,
      requires_approval: room.requires_approval
    });
    setShowModal(true);
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      deleteMutation.mutate(roomId);
    }
  };

  const onSubmit = (data) => {
    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredRooms = rooms?.data?.filter(room =>
    room.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        <Building className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load rooms</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
        <button
          onClick={handleCreateRoom}
          className="btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Room
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms by name or location..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="card border border-gray-200 rounded-xl shadow-sm bg-white">
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-gray-200">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{room.room_name}</h3>
                  <div className="text-sm text-gray-600 font-medium mt-1">{room.room_number}</div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {room.location}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300"
                    title="Edit Room"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300"
                    title="Delete Room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 border-b border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Capacity: {room.capacity} people
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Type:</strong> {room.room_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Building:</strong> {room.building}, Floor {room.floor}
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Rate:</strong> ${room.hourly_rate}/hour
                </div>

                {room.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 border-l-2 border-gray-200 pl-3">
                    {room.description}
                  </p>
                )}

                {room.amenities && room.amenities.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>Amenities:</strong> {room.amenities.join(', ')}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 flex items-center justify-between bg-gray-50 rounded-b-xl">
                <div className="flex flex-col space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      room.is_available 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                    {room.is_available ? 'Available' : 'Unavailable'}
                  </span>
                  {room.requires_approval && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Requires Approval
                    </span>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No rooms found</p>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRoom(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Room Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.room_number ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., CR201"
                  {...register('room_number', { required: 'Room number is required' })}
                />
                {errors.room_number && (
                  <p className="mt-2 text-sm text-red-600">{errors.room_number.message}</p>
                )}
              </div>

              {/* Room Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.room_name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., Conference Room 201"
                  {...register('room_name', { required: 'Room name is required' })}
                />
                {errors.room_name && (
                  <p className="mt-2 text-sm text-red-600">{errors.room_name.message}</p>
                )}
              </div>

              {/* Building & Floor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Building</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.building ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Building 2"
                    {...register('building', { required: 'Building is required' })}
                  />
                  {errors.building && (
                    <p className="mt-2 text-sm text-red-600">{errors.building.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.floor ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 2"
                    {...register('floor', { required: 'Floor is required' })}
                  />
                  {errors.floor && (
                    <p className="mt-2 text-sm text-red-600">{errors.floor.message}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., Building 2, Second Floor"
                  {...register('location', { required: 'Location is required' })}
                />
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              {/* Capacity & Hourly Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 20"
                    {...register('capacity', { 
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Capacity must be at least 1' }
                    })}
                  />
                  {errors.capacity && (
                    <p className="mt-2 text-sm text-red-600">{errors.capacity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hourly_rate ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 25.00"
                    {...register('hourly_rate', { 
                      required: 'Hourly rate is required',
                      min: { value: 0, message: 'Rate must be 0 or greater' }
                    })}
                  />
                  {errors.hourly_rate && (
                    <p className="mt-2 text-sm text-red-600">{errors.hourly_rate.message}</p>
                  )}
                </div>
              </div>

              {/* Room Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                <select
                  className={`w-full px-4 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.room_type ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('room_type', { required: 'Room type is required' })}
                >
                  <option value="">Select room type</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="conference_room">Conference Room</option>
                  <option value="meeting_room">Meeting Room</option>
                  <option value="lab">Lab</option>
                  <option value="classroom">Classroom</option>
                  <option value="office">Office</option>
                </select>
                {errors.room_type && (
                  <p className="mt-2 text-sm text-red-600">{errors.room_type.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                  placeholder="Brief description of the room..."
                  {...register('description')}
                />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_available"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('is_available')}
                  />
                  <label htmlFor="is_available" className="ml-3 block text-sm font-medium text-gray-900">
                    Available for booking
                  </label>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="requires_approval"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('requires_approval')}
                  />
                  <label htmlFor="requires_approval" className="ml-3 block text-sm font-medium text-gray-900">
                    Requires approval
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoom(null);
                    reset();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingRoom
                    ? 'Update Room'
                    : 'Create Room'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;