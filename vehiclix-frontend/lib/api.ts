const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090/api/v1';

export class ApiError extends Error {
  public code: string;
  public details?: unknown;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vehiclix_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorData = { code: 'HTTP_ERROR', message: `Request failed with status ${res.status}` };
    try {
      const json = await res.json();
      if (json.error) errorData = json.error;
    } catch {
      // Body was not JSON
    }
    throw new ApiError(errorData.message, errorData.code, res.status);
  }

  const json = await res.json();
  return json.data;
}

export const api = {
  // Public Calculator
  estimateTripCost: (data: { distance: number; mileage: number; fuelPrice: number; fuelType: string }) =>
    request<{ distance: number; mileage: number; fuelPrice: number; fuelType: string; fuelRequired: number; estimatedCost: number }>(
      '/calculator/estimate',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  // Dashboard
  getDashboard: () => request<any>('/dashboard'),

  // Profile
  getProfile: () => request<any>('/users/profile'),
  updateProfile: (data: any) => request<any>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: () => request<any>('/users/account', { method: 'DELETE' }),

  // Vehicles
  listVehicles: () => request<any[]>('/vehicles'),
  getVehicle: (id: string) => request<any>(`/vehicles/${id}`),
  createVehicle: (data: any) => request<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, data: any) => request<any>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVehicle: (id: string) => request<any>(`/vehicles/${id}`, { method: 'DELETE' }),

  // Fuel
  listFuel: (vehicleId?: string) => request<any[]>(vehicleId ? `/fuel?vehicleId=${vehicleId}` : '/fuel'),
  getFuelStats: (vehicleId?: string) => request<any>(vehicleId ? `/fuel/stats?vehicleId=${vehicleId}` : '/fuel/stats'),
  getFuel: (id: string) => request<any>(`/fuel/${id}`),
  createFuel: (data: any) => request<any>('/fuel', { method: 'POST', body: JSON.stringify(data) }),
  updateFuel: (id: string, data: any) => request<any>(`/fuel/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFuel: (id: string) => request<any>(`/fuel/${id}`, { method: 'DELETE' }),

  // Services
  listServices: (vehicleId?: string) => request<any[]>(vehicleId ? `/services?vehicleId=${vehicleId}` : '/services'),
  getService: (id: string) => request<any>(`/services/${id}`),
  createService: (data: any) => request<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: any) => request<any>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: (id: string) => request<any>(`/services/${id}`, { method: 'DELETE' }),

  // Trips
  listTrips: () => request<any[]>('/trips'),
  getTrip: (id: string) => request<any>(`/trips/${id}`),
  createTrip: (data: any) => request<any>('/trips', { method: 'POST', body: JSON.stringify(data) }),
  updateTrip: (id: string, data: any) => request<any>(`/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTrip: (id: string) => request<any>(`/trips/${id}`, { method: 'DELETE' }),
  addParticipant: (tripId: string, data: any) => request<any>(`/trips/${tripId}/participants`, { method: 'POST', body: JSON.stringify(data) }),
  removeParticipant: (tripId: string, partId: string) => request<any>(`/trips/${tripId}/participants/${partId}`, { method: 'DELETE' }),
  createExpense: (tripId: string, data: any) => request<any>(`/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (tripId: string, expId: string) => request<any>(`/trips/${tripId}/expenses/${expId}`, { method: 'DELETE' }),
  getTripSplit: (tripId: string) => request<any>(`/trips/${tripId}/split`),

  // Reports
  downloadVehicleReportUrl: (vehicleId: string) => `${API_BASE_URL}/reports/vehicle/${vehicleId}`,
  downloadTripReportUrl: (tripId: string) => `${API_BASE_URL}/reports/trip/${tripId}`,

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  listAdminUsers: (search?: string) => request<any[]>(search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users'),
};
