// API Configuration
export interface APIConfig {
  baseURL: string;
  useJWT: boolean;
  useSession: boolean;
}

// FastAPI configuration
const API_CONFIG: APIConfig = {
  baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000',
  useJWT: true,
  useSession: false,
};

// Get current API configuration
export function getAPIConfig(): APIConfig {
  return API_CONFIG;
}

// API client
export class APIClient {
  private config: APIConfig;

  constructor() {
    this.config = getAPIConfig();
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.config.useJWT) {
      const token = localStorage.getItem('auth-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    // Add credentials for session-based auth
    if (this.config.useSession) {
      config.credentials = 'include';
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(username: string, password: string) {
    const data = await this.request<{ user: any; token?: string; accessToken?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store JWT token if using JWT auth
    if (this.config.useJWT) {
      const token = data.accessToken || data.token;
      if (token) {
        localStorage.setItem('auth-token', token);
      }
    }

    return data;
  }

  async logout() {
    if (this.config.useJWT) {
      localStorage.removeItem('auth-token');
    } else {
      await this.request('/api/auth/logout', { method: 'POST' });
    }
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient(); 