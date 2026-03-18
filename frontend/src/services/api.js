import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3500';
const API_BASE = `${API_BASE_URL}/api`;
export const socket = io(API_BASE_URL);

export const uploadVideo = (file, onProgress) => {
  const formData = new FormData();
  formData.append('video', file);

  return axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total))
  });
};

export const extractFrames = (videoId, options, socketId) => {
  return axios.post(`${API_BASE}/extract`, { ...options, videoId, socketId });
};

export const downloadZip = (frameIds, zipName) => {
  return axios.post(`${API_BASE}/download`, { frameIds, zipName }, { responseType: 'blob' });
};
