import axios from 'axios';

const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL;

const api = axios.create({
  baseURL: SCRIPT_URL,
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
});

export const apiService = {
  /**
   * Check user authentication via GAS
   */
  async checkAuth(email: string) {
    const response = await api.get('', {
      params: {
        action: 'checkAuth',
        email: email,
      },
    });
    return response.data;
  },

  /**
   * Get application data from GAS
   */
  async getData(role?: string, userName?: string) {
    const response = await api.get('', {
      params: {
        action: 'getData',
        role,
        userName,
      },
    });
    return response.data;
  },

  /**
   * Process PDF text using AI in GAS backend
   */
  async processAI(text: string, type: 'borang' | 'profile', email: string) {
    const response = await api.post('', {
      action: 'processAI',
      type,
      text,
      email,
    });
    return response.data;
  },

  /**
   * Delete or clear a record
   */
  async deleteRecord(row: number, deleteType: 'padam_semua' | 'padam_syor', user: string, email: string) {
    const response = await api.post('', {
      action: 'deleteRecord',
      row,
      deleteType,
      user,
      email,
    });
    return response.data;
  },

  /**
   * Create Drive folder
   */
  async createDriveFolder(companyName: string, applicationType: string, userName: string, email: string) {
    const response = await api.post('', {
      action: 'createDriveFolder',
      company_name: companyName,
      application_type: applicationType,
      user_name: userName,
      email,
    });
    return response.data;
  },

  /**
   * Search YouTube videos via GAS
   */
  async searchYoutube(query: string) {
    const response = await api.post('', {
      action: 'searchYoutube',
      query,
    });
    return response.data;
  },

  /**
   * Get Queue Data for SPI
   */
  async getQueueData() {
    const response = await api.post('', {
      action: 'getQueueData',
    });
    return response.data;
  },

  /**
   * Update or Insert a record
   */
  async saveRecord(data: any) {
    const response = await api.post('', data);
    return response.data;
  },
};
