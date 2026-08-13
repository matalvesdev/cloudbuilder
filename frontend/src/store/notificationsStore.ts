import { create } from "zustand";
import type {
  NotificationEvent,
  NotificationChannel,
  NotificationPreference,
} from "@/types/notifications.types";
import { notificationApi } from "@/api/notifications";

interface NotificationState {
  notifications: NotificationEvent[];
  unreadCount: number;
  channels: NotificationChannel[];
  preferences: NotificationPreference[];
  loading: boolean;
  error: string | null;

  fetchNotifications: (orgId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (orgId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchChannels: (orgId: string) => Promise<void>;
  createChannel: (
    orgId: string,
    channel: Omit<NotificationChannel, "id">,
  ) => Promise<void>;
  updateChannel: (
    orgId: string,
    channelId: string,
    channel: Partial<NotificationChannel>,
  ) => Promise<void>;
  deleteChannel: (orgId: string, channelId: string) => Promise<void>;
  fetchPreferences: (orgId: string) => Promise<void>;
  updatePreference: (
    orgId: string,
    prefId: string,
    enabled: boolean,
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  channels: [],
  preferences: [],
  loading: false,
  error: null,

  fetchNotifications: async (orgId) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationApi.listNotifications(orgId);
      const unread = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount: unread, loading: false });
    } catch {
      set({ error: "Falha ao carregar notificações", loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {
      /* silent */
    }
  },

  markAllAsRead: async (orgId) => {
    try {
      await notificationApi.markAllAsRead(orgId);
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      /* silent */
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      const wasUnread =
        get().notifications.find((n) => n.id === id)?.read === false;
      set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      }));
    } catch {
      /* silent */
    }
  },

  fetchChannels: async (orgId) => {
    try {
      const channels = await notificationApi.listChannels(orgId);
      set({ channels });
    } catch {
      /* silent */
    }
  },

  createChannel: async (orgId, channel) => {
    set({ loading: true, error: null });
    try {
      const created = await notificationApi.createChannel(orgId, channel);
      set((s) => ({ channels: [...s.channels, created], loading: false }));
    } catch {
      set({ error: "Falha ao criar canal", loading: false });
    }
  },

  updateChannel: async (orgId, channelId, channel) => {
    try {
      const updated = await notificationApi.updateChannel(
        orgId,
        channelId,
        channel,
      );
      set((s) => ({
        channels: s.channels.map((c) => (c.id === channelId ? updated : c)),
      }));
    } catch {
      /* silent */
    }
  },

  deleteChannel: async (orgId, channelId) => {
    try {
      await notificationApi.deleteChannel(orgId, channelId);
      set((s) => ({ channels: s.channels.filter((c) => c.id !== channelId) }));
    } catch {
      /* silent */
    }
  },

  fetchPreferences: async (orgId) => {
    try {
      const preferences = await notificationApi.listPreferences(orgId);
      set({ preferences });
    } catch {
      /* silent */
    }
  },

  updatePreference: async (orgId, prefId, enabled) => {
    try {
      const updated = await notificationApi.updatePreference(
        orgId,
        prefId,
        enabled,
      );
      set((s) => ({
        preferences: s.preferences.map((p) => (p.id === prefId ? updated : p)),
      }));
    } catch {
      /* silent */
    }
  },
}));
