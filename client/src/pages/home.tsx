import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customerLookupSchema, type CustomerLookup, type PrintavoOrder, type PrintavoStatus, type ReorderRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RotateCcw, ExternalLink, Package, Mail, ArrowLeft, Filter, Image, CalendarDays, Hash, DollarSign } from "lucide-react";

function StatusFilterBar({ statuses, activeStatusIds, onToggle }: {
  statuses: PrintavoStatus[];
  activeStatusIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (statuses.length === 0) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="status-filter-bar">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter by Status</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const isActive = activeStatusIds.has(status.id);
          return (
            <button
              key={status.id}
              onClick={() => onToggle(status.id)}
              className={`
                relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border
                ${isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-transparent"
                }
              `}
              data-testid={`status-filter-${status.name}`}
            >
              {status.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: status.color }}
                />
              )}
              {status.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, onViewInvoice, onReorder }: {
  order: PrintavoOrder;
  onViewInvoice: (url: string) => void;
  onReorder: (order: PrintavoOrder) => void;
}) {
  return (
    <Card className="group hover-elevate transition-all duration-200" data-testid={`order-card-${order.visualId}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 h-40 sm:h-auto bg-muted/30 flex items-center justify-center sm:rounded-l-md overflow-hidden relative">
            {order.mockupUrl ? (
              <img
                src={order.mockupUrl}
                alt={`Mockup for order ${order.visualId}`}
                className="w-full h-full object-cover"
                data-testid={`mockup-image-${order.visualId}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                <Image className="w-10 h-10" />
                <span className="text-xs">No Mockup</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base" data-testid={`order-nickname-${order.visualId}`}>
                    {order.orderNickname || `Order #${order.visualId}`}
                  </h3>
                  {order.status && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={order.statusColor ? { backgroundColor: order.statusColor, color: '#fff' } : {}}
                      data-testid={`order-status-${order.visualId}`}
                    >
                      {order.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Hash className="w-3.5 h-3.5" />
                  <span data-testid={`order-id-${order.visualId}`}>{order.visualId}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {order.total && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span data-testid={`order-total-${order.visualId}`}>{order.total}</span>
                </div>
              )}
              {order.dueDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span data-testid={`order-due-${order.visualId}`}>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {order.lineItemCount !== undefined && order.lineItemCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>{order.lineItemCount} item{order.lineItemCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
              {order.publicUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewInvoice(order.publicUrl!)}
                  data-testid={`button-invoice-${order.visualId}`}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Invoice Link
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onReorder(order)}
                data-testid={`button-reorder-${order.visualId}`}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reorder Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 h-40 sm:h-auto">
            <Skeleton className="w-full h-full min-h-[160px] rounded-none sm:rounded-l-md" />
          </div>
          <div className="flex-1 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceModal({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (open) setIframeError(false);
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col" data-testid="invoice-modal">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>
            View your complete order invoice below
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0">
          {iframeError ? (
            <div className="w-full h-full rounded-md border flex flex-col items-center justify-center gap-4 text-center p-8">
              <ExternalLink className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Unable to display invoice inline.</p>
              <Button
                onClick={() => window.open(url, "_blank")}
                data-testid="button-open-invoice-new-tab"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open in New Tab
              </Button>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full rounded-md border"
              title="Printavo Invoice"
              onError={() => setIframeError(true)}
              data-testid="invoice-iframe"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReorderModal({ order, open, onClose }: { order: PrintavoOrder | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const form = useForm<{ notes: string }>({
    defaultValues: { notes: "" },
  });

  const reorderMutation = useMutation({
    mutationFn: async (data: ReorderRequest) => {
      const res = await apiRequest("POST", "/api/reorder", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reorder Request Sent",
        description: "Our sales team has been notified and will follow up with you shortly.",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Sending Reorder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!order) return null;

  const handleSubmit = form.handleSubmit((data) => {
    reorderMutation.mutate({
      orderId: order.id,
      visualId: order.visualId,
      orderNickname: order.orderNickname || undefined,
      customerName: order.customerName || undefined,
      customerEmail: order.customerEmail || "",
      notes: data.notes,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="reorder-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reorder Request
          </DialogTitle>
          <DialogDescription>
            We'll notify our sales team about your reorder for{" "}
            <strong>{order.orderNickname || `Order #${order.visualId}`}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">#{order.visualId}</span>
              </div>
              {order.orderNickname && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{order.orderNickname}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Additional Notes (optional)</FormLabel>
              <Textarea
                placeholder="Any changes or special instructions for this reorder..."
                className="resize-none"
                rows={3}
                {...form.register("notes")}
                data-testid="reorder-notes"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-reorder">
              Cancel
            </Button>
            <Button type="submit" disabled={reorderMutation.isPending} data-testid="button-confirm-reorder">
              {reorderMutation.isPending ? (
                <>
                  <Mail className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Send Reorder Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [activeStatusIds, setActiveStatusIds] = useState<Set<string>>(new Set());
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [reorderOrder, setReorderOrder] = useState<PrintavoOrder | null>(null);
  const [statusesInitialized, setStatusesInitialized] = useState(false);

  const lookupForm = useForm<CustomerLookup>({
    resolver: zodResolver(customerLookupSchema),
    defaultValues: { email: "" },
  });

  const statusesQuery = useQuery<PrintavoStatus[]>({
    queryKey: ["/api/statuses"],
    enabled: !!customerEmail,
  });

  useEffect(() => {
    if (statusesQuery.data && !statusesInitialized && statusesQuery.data.length > 0) {
      setActiveStatusIds(new Set(statusesQuery.data.map((s) => s.id)));
      setStatusesInitialized(true);
    }
  }, [statusesQuery.data, statusesInitialized]);

  const ordersQuery = useQuery<PrintavoOrder[]>({
    queryKey: ["/api/orders", encodeURIComponent(customerEmail || "")],
    enabled: !!customerEmail,
  });

  const filteredOrders = ordersQuery.data?.filter((order) => {
    if (activeStatusIds.size === 0) return true;
    const matchingStatus = statusesQuery.data?.find(s => s.name === order.status);
    return matchingStatus ? activeStatusIds.has(matchingStatus.id) : true;
  }) || [];

  const handleLookup = lookupForm.handleSubmit((data) => {
    setCustomerEmail(data.email);
    setStatusesInitialized(false);
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  });

  const toggleStatus = (id: string) => {
    setActiveStatusIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBack = () => {
    setCustomerEmail(null);
    setStatusesInitialized(false);
    lookupForm.reset();
  };

  if (!customerEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-app-title">
              Mint Printworks
            </h1>
            <p className="text-lg text-muted-foreground">
              Reorder Portal
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Enter your email address to view your order history and easily place a reorder.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleLookup} className="space-y-4">
                <Form {...lookupForm}>
                  <FormField
                    control={lookupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="you@company.com"
                              className="pl-9"
                              {...field}
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
                <Button type="submit" className="w-full" data-testid="button-lookup">
                  <Search className="w-4 h-4 mr-2" />
                  View My Orders
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-base" data-testid="text-dashboard-title">Your Orders</h1>
              <p className="text-xs text-muted-foreground" data-testid="text-customer-email">{customerEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs" data-testid="text-order-count">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {statusesQuery.data && statusesQuery.data.length > 0 && (
          <StatusFilterBar
            statuses={statusesQuery.data}
            activeStatusIds={activeStatusIds}
            onToggle={toggleStatus}
          />
        )}

        {ordersQuery.isLoading && (
          <div className="space-y-4" data-testid="loading-skeleton">
            {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
          </div>
        )}

        {ordersQuery.isError && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-destructive font-medium">Unable to load orders</p>
              <p className="text-sm text-muted-foreground">
                {ordersQuery.error instanceof Error ? ordersQuery.error.message : "Please try again later."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ordersQuery.refetch()}
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {ordersQuery.data && filteredOrders.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3 py-16">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground font-medium">No orders found</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {activeStatusIds.size < (statusesQuery.data?.length || 0)
                  ? "Try adjusting your status filters to see more orders."
                  : "We couldn't find any orders associated with this email address."}
              </p>
            </CardContent>
          </Card>
        )}

        {filteredOrders.length > 0 && (
          <div className="space-y-4" data-testid="orders-list">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewInvoice={(url) => setInvoiceUrl(url)}
                onReorder={(o) => setReorderOrder(o)}
              />
            ))}
          </div>
        )}
      </main>

      <InvoiceModal
        url={invoiceUrl || ""}
        open={!!invoiceUrl}
        onClose={() => setInvoiceUrl(null)}
      />
      <ReorderModal
        order={reorderOrder}
        open={!!reorderOrder}
        onClose={() => setReorderOrder(null)}
      />
    </div>
  );
}
