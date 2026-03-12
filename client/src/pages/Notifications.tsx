import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Bell, Check, Loader2 } from "lucide-react";

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const notifications = trpc.notification.list.useQuery(undefined, { enabled: isAuthenticated });
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });
  const utils = trpc.useUtils();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view notifications</h2>
      </div>
    );
  }

  const items = notifications.data || [];
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {notifications.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((n) => (
              <Card
                key={n.id}
                className={`transition-colors ${!n.read ? "bg-primary/3 border-primary/20" : ""}`}
                onClick={() => { if (!n.read) markRead.mutate({ id: n.id }); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{n.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-GH", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {n.link && (
                      <Link href={n.link}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bell className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg mb-2">No notifications</h3>
              <p className="text-muted-foreground text-sm">You're all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
