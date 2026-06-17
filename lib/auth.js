export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('seller_token');
}

export function login(token, seller) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('seller_token', token);
    if (seller?.name) localStorage.setItem('seller_name', seller.name);
    if (seller?.email) localStorage.setItem('seller_email', seller.email);
    if (seller?.store_name) localStorage.setItem('seller_store', seller.store_name);
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_email');
    localStorage.removeItem('seller_store');
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('seller_token');
}

export function getSellerName() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('seller_name');
}

export function getSellerStore() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('seller_store');
}

