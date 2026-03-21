import axios from 'axios';
import { io } from 'socket.io-client';

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const configuredBase = import.meta.env.VITE_API_BASE;
  if (configuredBase) {
    return normalizeBaseUrl(configuredBase);
  }

  return '';
};

const API_BASE_URL = resolveApiBaseUrl();
const API_BASE = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

export const buildAssetUrl = (assetPath) => (API_BASE_URL ? `${API_BASE_URL}${assetPath}` : assetPath);
export const socket = io(API_BASE_URL || undefined);
export { API_BASE_URL };

export const uploadVideo = (file, onProgress) => {
  const formData = new FormData();
  formData.append('video', file);

  return axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total) {
        return;
      }

      onProgress?.(Math.round((event.loaded * 100) / event.total));
    }
  });
};

export const extractFrames = (videoId, options, socketId) =>
  axios.post(`${API_BASE}/extract`, { ...options, videoId, socketId });

export const downloadZip = (payload) =>
  axios.post(`${API_BASE}/download`, payload, { responseType: 'blob' });

export const uploadAsset = (endpoint, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_BASE}/${endpoint}`, formData);
};
