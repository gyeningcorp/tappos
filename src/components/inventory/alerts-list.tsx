'use client'
"use client";

import { useState } from "react";
import { AlertTriangle, Check, X, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Alert {
  id: string;
  productName: string;
  productId: string;
  currentStock: number;
  threshold: number;
  isRead: boolean;
  createdAt: string;
}

interface AlertsListProps {
  alerts: Alert[];
  onUpdate: () => void;
}

export function AlertsList({ alerts, onUpdate }: AlertsListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  async function markAsRead(alertIds: string[]) {
    setLoading(alertIds[0]);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds, action: "markRead" }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      onUpdate();
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    } finally {
      setLoading(null);
    }
  }

  async function dismiss(alertIds: string[]) {
    setLoading(alertIds[0]);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds, action: "dismiss" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      onUpdate();
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    } finally {
      setLoading(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No alerts</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You will see alerts here when products are running low on stock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Inventory Alerts</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              markAsRead(alerts.filter((a) => !a.isRead).map((a) => a.id))
            }
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`p-4 ${
              !alert.isRead ? "border-amber-300 bg-amber-50/50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-5 w-5 shrink-0 ${
                    alert.currentStock <= 0
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}
                />
                <div>
                  <p className="font-medium">{alert.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Current stock:{" "}
                    <span
                      className={
                        alert.currentStock <= 0
                          ? "text-red-600 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {alert.currentStock}
                    </span>{" "}
                    / Threshold: {alert.threshold}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!alert.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={loading === alert.id}
                    onClick={() => markAsRead([alert.id])}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  disabled={loading === alert.id}
                  onClick={() => dismiss([alert.id])}
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
