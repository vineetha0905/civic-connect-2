import { getToken } from './storage';
import { API_BASE_URL, ML_BASE_URL } from '../constants/config';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.mlBaseURL = ML_BASE_URL;
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      const errorMessage = error.reason 
        ? `${error.message || 'Error'}: ${error.reason}`
        : (error.message || 'Something went wrong');
      throw new Error(errorMessage);
    }
    return response.json();
  }

  // ================= FILE UPLOADS =================
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || 'image.jpg',
    });

    const token = await getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData
    });
    return this.handleResponse(response);
  }

  // ================= ML VALIDATION =================
  async validateReportWithML(payload, imageFile = null, timeoutMs = 45000, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
          const formData = new FormData();
          formData.append('report_id', payload.report_id || `${Date.now()}`);
          formData.append('description', payload.description || '');
          if (payload.user_id) {
            formData.append('user_id', payload.user_id);
          }
          if (payload.latitude !== undefined && payload.latitude !== null) {
            formData.append('latitude', payload.latitude.toString());
          }
          if (payload.longitude !== undefined && payload.longitude !== null) {
            formData.append('longitude', payload.longitude.toString());
          }
          if (imageFile) {
            formData.append('image', {
              uri: imageFile.uri,
              type: imageFile.type || 'image/jpeg',
              name: imageFile.fileName || 'image.jpg',
            });
          }

          const fetchPromise = fetch(`${this.mlBaseURL}/submit`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          
          const response = await Promise.race([
            fetchPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
            )
          ]);
          
          clearTimeout(timeoutId);
      
          const responseText = await response.text();
          let result;
          
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            if (attempt === retries) return null;
            continue;
          }
          
          if (!response.ok) {
            if (attempt === retries) return null;
            continue;
          }
          
          return result;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if ((fetchError.name === 'AbortError' || fetchError.message === 'TIMEOUT' ||
              fetchError.message.includes('Failed to fetch')) && attempt < retries) {
            continue;
          }
          if (attempt === retries) return null;
        }
      } catch (error) {
        if (error.message.includes('CORS')) return null;
        if (attempt === retries) return null;
        continue;
      }
    }
    return null;
  }

  // ================= AUTH =================
  async sendOtpByAadhaar(aadhaarNumber) {
    const response = await fetch(`${this.baseURL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber })
    });
    return this.handleResponse(response);
  }

  async sendOtpByMobile(mobile) {
    const response = await fetch(`${this.baseURL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    return this.handleResponse(response);
  }

  async sendOtpByEmail(email) {
    const response = await fetch(`${this.baseURL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return this.handleResponse(response);
  }

  async verifyOtp(mobile, email, otp) {
    const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, email, otp })
    });
    return this.handleResponse(response);
  }

  async verifyOtpByAadhaar(aadhaarNumber, otp) {
    const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber, otp })
    });
    return this.handleResponse(response);
  }

  async resendOtp(mobile, email) {
    const response = await fetch(`${this.baseURL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, email })
    });
    return this.handleResponse(response);
  }

  async login(mobile, email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, email, password })
    });
    return this.handleResponse(response);
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  async guestLogin() {
    const response = await fetch(`${this.baseURL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async adminLogin(credentials) {
    const response = await fetch(`${this.baseURL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return this.handleResponse(response);
  }

  async employeeLogin(credentials) {
    const response = await fetch(`${this.baseURL}/auth/employee-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return this.handleResponse(response);
  }

  async logout() {
    // Storage cleanup is handled in the component
  }

  // ================= ISSUES =================
  async getIssues(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues${queryString ? `?${queryString}` : ''}`, {
      headers
    });
    return this.handleResponse(response);
  }

  async getIssueById(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${id}`, {
      headers
    });
    return this.handleResponse(response);
  }

  async createIssue(issueData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify(issueData)
    });
    return this.handleResponse(response);
  }

  async updateIssue(id, issueData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(issueData)
    });
    return this.handleResponse(response);
  }

  async deleteIssue(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${id}`, {
      method: 'DELETE',
      headers
    });
    return this.handleResponse(response);
  }

  async upvoteIssue(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${id}/upvote`, {
      method: 'POST',
      headers
    });
    return this.handleResponse(response);
  }

  async getNearbyIssues(latitude, longitude, radius = 5000) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${this.baseURL}/issues/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
      { headers }
    );
    return this.handleResponse(response);
  }

  async getUserIssues(userId) {
    return this.getIssues({ userId });
  }

  // ================= COMMENTS =================
  async getComments(issueId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${issueId}/comments`, {
      headers
    });
    return this.handleResponse(response);
  }

  async addComment(issueId, comment) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/issues/${issueId}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: comment })
    });
    return this.handleResponse(response);
  }

  // ================= ADMIN =================
  async getAdminDashboard() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/dashboard`, {
      headers
    });
    return this.handleResponse(response);
  }

  async getAdminAnalytics() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/analytics`, {
      headers
    });
    return this.handleResponse(response);
  }

  async assignIssue(issueId, employeeId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/issues/${issueId}/assign`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ employeeId })
    });
    return this.handleResponse(response);
  }

  async updateIssueStatus(issueId, status) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/issues/${issueId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    return this.handleResponse(response);
  }

  async getAllUsers() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/users`, {
      headers
    });
    return this.handleResponse(response);
  }

  async updateUserStatus(userId, status) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    return this.handleResponse(response);
  }

  // ================= EMPLOYEE =================
  async getEmployeeIssues(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/employee/issues${queryString ? `?${queryString}` : ''}`, {
      headers
    });
    return this.handleResponse(response);
  }

  async acceptIssue(issueId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/employee/issues/${issueId}/accept`, {
      method: 'POST',
      headers
    });
    return this.handleResponse(response);
  }

  async resolveIssue(issueId, resolvedData) {
    const formData = new FormData();
    if (resolvedData.latitude !== undefined) {
      formData.append('latitude', resolvedData.latitude.toString());
    }
    if (resolvedData.longitude !== undefined) {
      formData.append('longitude', resolvedData.longitude.toString());
    }
    if (resolvedData.photo) {
      formData.append('photo', {
        uri: resolvedData.photo.uri,
        type: resolvedData.photo.type || 'image/jpeg',
        name: resolvedData.photo.fileName || 'photo.jpg',
      });
    }

    const token = await getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/employee/issues/${issueId}/resolve`, {
      method: 'POST',
      headers,
      body: formData
    });
    return this.handleResponse(response);
  }

  // ================= NOTIFICATIONS =================
  async getNotifications() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/notifications`, {
      headers
    });
    return this.handleResponse(response);
  }

  async markNotificationRead(notificationId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers
    });
    return this.handleResponse(response);
  }

  async markAllNotificationsRead() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/notifications/read-all`, {
      method: 'PUT',
      headers
    });
    return this.handleResponse(response);
  }

  // ================= PROFILE =================
  async updateProfile(profileData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  async getMyProfile() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers
    });
    return this.handleResponse(response);
  }
}

export default new ApiService();

