"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconBell } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  level: "info" | "warning" | "critical";
  createdAt: string;
};

type Props = {
  labels: {
    notifications: string;
    noNotifications: string;
  };
};

type NotificationsResponse = {
  unreadCount: number;
  notifications: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

const PAGE_SIZE = 20;

function levelTone(level: NotificationItem["level"]) {
  if (level === "critical") {
    return "border-red-500/40 bg-red-500/10 text-red-700";
  }
  if (level === "warning") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700";
  }
  return "border-border bg-muted text-muted-foreground";
}

export function NotificationsMenu({ labels }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasLoadedOnce = useRef(false);
  const hasShownLoadErrorToast = useRef(false);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = useCallback(async ({
    cursor = null,
    append = false,
  }: {
    cursor?: string | null;
    append?: boolean;
  } = {}) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const searchParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
      });
      if (cursor) {
        searchParams.set("cursor", cursor);
      }

      const response = await fetch(`/api/admin/notifications?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("failed to load notifications");
      }

      const data = (await response.json()) as NotificationsResponse;

      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      setHasMore(Boolean(data.hasMore));
      setNextCursor(typeof data.nextCursor === "string" ? data.nextCursor : null);
      const nextItems = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications((previous) => (append ? [...previous, ...nextItems] : nextItems));
      setHasNewNotification(false);
      hasShownLoadErrorToast.current = false;
      hasLoadedOnce.current = true;
    } catch {
      if (!hasShownLoadErrorToast.current) {
        toast.error("알림을 불러오지 못했습니다.");
        hasShownLoadErrorToast.current = true;
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/admin/notifications/stream");

    void loadNotifications();

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          hasNew?: boolean;
          unreadCount?: number;
        };

        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        if (data.hasNew) {
          setHasNewNotification(true);
        }
        hasShownLoadErrorToast.current = false;
      } catch {
        if (!hasShownLoadErrorToast.current) {
          toast.error("알림을 불러오지 못했습니다.");
          hasShownLoadErrorToast.current = true;
        }
      }
    };

    eventSource.onerror = () => {
      if (!hasShownLoadErrorToast.current) {
        toast.error("알림 연결이 끊겼습니다. 재연결 중입니다.");
        hasShownLoadErrorToast.current = true;
      }
    };

    return () => {
      eventSource.close();
    };
  }, [loadNotifications]);

  const loadMore = useCallback(() => {
    if (!isOpen || !hasMore || isLoading || isLoadingMore || !nextCursor) {
      return;
    }

    void loadNotifications({ cursor: nextCursor, append: true });
  }, [hasMore, isLoading, isLoadingMore, isOpen, loadNotifications, nextCursor]);

  useEffect(() => {
    if (!isOpen || !hasMore || typeof IntersectionObserver === "undefined") {
      return;
    }

    const root = listContainerRef.current;
    const target = loadMoreTriggerRef.current;
    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadMore();
            break;
          }
        }
      },
      {
        root,
        rootMargin: "120px",
      },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isOpen, loadMore, notifications.length]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      return;
    }

    if (!hasLoadedOnce.current && !isLoading) {
      void loadNotifications();
      return;
    }

    if (hasNewNotification) {
      void loadNotifications();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button aria-label={labels.notifications} className="relative" size="icon" variant="outline">
          <IconBell className="size-4" />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 justify-center px-1 py-0 text-[10px]" variant="destructive">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
        <DropdownMenuLabel className="px-3 py-2">{labels.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 space-y-2 overflow-y-auto p-3" ref={listContainerRef}>
          {isLoading && notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{labels.noNotifications}</p>
          ) : (
            notifications.map((item) => (
              <div
                className={`rounded-md border p-2 ${levelTone(item.level)}`}
                key={item.id}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs">{item.description}</p>
              </div>
            ))
          )}
          {hasMore ? <div aria-hidden="true" className="h-2" ref={loadMoreTriggerRef} /> : null}
          {isLoadingMore ? <p className="text-center text-xs text-muted-foreground">...</p> : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
