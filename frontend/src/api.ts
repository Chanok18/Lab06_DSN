import axios from 'axios';
import type { AuditLog, DocumentItem, EnvironmentContext, LoginResponse, User } from './types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

let authToken = localStorage.getItem('securedocs_token');
let environment: EnvironmentContext = {
  country: 'PERU',
  device: 'CORPORATIVO',
  time: '10:00',
  ip: '192.168.10.20'
};

export const setApiToken = (token: string | null) => {
  authToken = token;
};

export const setApiEnvironment = (next: EnvironmentContext) => {
  environment = next;
};

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  config.headers['x-country'] = environment.country;
  config.headers['x-device'] = environment.device;
  config.headers['x-time'] = environment.time;
  config.headers['x-forwarded-for'] = environment.ip;
  return config;
});

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password });

export const logout = () => api.post('/auth/logout');
export const getDocuments = () => api.get<{ documentos: DocumentItem[]; total_permitidos: number }>('/documentos');
export const getDocument = (id: number) => api.get<{ documento: DocumentItem }>(`/documentos/${id}`);
export const createDocument = (data: Record<string, unknown>) => api.post('/documentos', data);
export const updateDocument = (id: number, data: Record<string, unknown>) => api.put(`/documentos/${id}`, data);
export const deleteDocument = (id: number) => api.delete(`/documentos/${id}`);
export const approveDocument = (id: number) => api.post(`/documentos/${id}/aprobar`);
export const getUsers = () => api.get<{ usuarios: User[] }>('/usuarios');
export const updateUser = (id: number, data: Record<string, unknown>) => api.put(`/usuarios/${id}`, data);
export const setUserStatus = (id: number, estado: User['estado']) => api.patch(`/usuarios/${id}/estado`, { estado });
export const getAuditLogs = () => api.get<{ logs: AuditLog[] }>('/auditoria');
