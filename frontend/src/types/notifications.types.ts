export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  read: boolean;
  module: string;
  createdAt: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "slack" | "webhook" | "pagerduty";
  enabled: boolean;
  config: Record<string, string>;
}

export interface NotificationPreference {
  id: string;
  channelId: string;
  eventType: string;
  enabled: boolean;
}
