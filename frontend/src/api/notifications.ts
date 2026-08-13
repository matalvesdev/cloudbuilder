import { api } from "./client";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  module: string;
  read: boolean;
  createdAt: string;
}

export function listNotifications(orgId?: string): Promise<Notification[]> {
  return api.get(`/notifications${orgId ? `?orgId=${orgId}` : ""}`);
}

export function markAsRead(id: string): Promise<void> {
  return api.put(`/notifications/${id}/read`);
}

export function markAllAsRead(orgId: string): Promise<void> {
  return api.put(`/notifications/read-all?orgId=${orgId}`);
}

export function deleteNotification(id: string): Promise<void> {
  return api.delete(`/notifications/${id}`);
}

export function listChannels(orgId: string): Promise<any[]> {
  return api.get(`/notifications/channels?orgId=${orgId}`);
}

export function createChannel(orgId: string, channel: any): Promise<any> {
  return api.post(`/notifications/channels?orgId=${orgId}`, channel);
}

export function updateChannel(orgId: string, channelId: string, data: any): Promise<any> {
  return api.put(`/notifications/channels/${channelId}?orgId=${orgId}`, data);
}

export function deleteChannel(orgId: string, channelId: string): Promise<void> {
  return api.delete(`/notifications/channels/${channelId}?orgId=${orgId}`);
}

export function listPreferences(orgId: string): Promise<any[]> {
  return api.get(`/notifications/preferences?orgId=${orgId}`);
}

export function updatePreference(orgId: string, prefId: string, enabled: boolean): Promise<any> {
  return api.put(`/notifications/preferences/${prefId}?orgId=${orgId}`, { enabled });
}

export const notificationsApi = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  listChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  listPreferences,
  updatePreference,
};

export const notificationApi = notificationsApi;
