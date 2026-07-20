const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.trollzstore.com.ng';

class SellerApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    if (typeof window !== 'undefined') return localStorage.getItem('seller_token');
    return null;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  }

  // Auth
  sellerLogin(email, password) {
    return this.request('/api/seller/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Dashboard overview
  getDashboard() {
    return this.request('/api/seller/dashboard');
  }

  // Products
  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/seller/products${qs ? `?${qs}` : ''}`);
  }

  createProduct(data) {
    return this.request('/api/seller/products', { method: 'POST', body: JSON.stringify(data) });
  }

  updateProduct(id, data) {
    return this.request(`/api/seller/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteProduct(id) {
    return this.request(`/api/seller/products/${id}`, { method: 'DELETE' });
  }

  uploadProductImage(file) {
    const token = this.getToken();
    const fd = new FormData();
    fd.append('image', file);
    return fetch(`${this.baseUrl}/api/seller/products/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then((r) => r.json());
  }

  // Orders
  getOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/seller/orders${qs ? `?${qs}` : ''}`);
  }

  getOrder(id) {
    return this.request(`/api/seller/orders/${id}`);
  }

  // Analytics
  getAnalytics(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/seller/analytics${qs ? `?${qs}` : ''}`);
  }

  // Team
  getTeam() {
    return this.request('/api/seller/team');
  }

  inviteTeamMember(data) {
    return this.request('/api/seller/team/invite', { method: 'POST', body: JSON.stringify(data) });
  }

  removeTeamMember(id) {
    return this.request(`/api/seller/team/${id}`, { method: 'DELETE' });
  }

  updateTeamMemberRole(id, role) {
    return this.request(`/api/seller/team/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}

export const apiClient = new SellerApiClient();

