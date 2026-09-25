export interface AdminNotification {
  id: string;
  order_id: string;
  order_number: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationRepository {
  listRecent(limit: number): Promise<AdminNotification[]>;
  countUnread(): Promise<number>;
  /** Returns false when the notification does not exist. */
  markRead(id: string): Promise<boolean>;
}
