import { useState } from "react";
import { 
  useListBookings, 
  useUpdateBookingStatus,
  useGetBooking,
  useGetBookingStats
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListBookingsQueryKey, getGetBookingStatsQueryKey } from "@workspace/api-client-react";

export default function Admin() {
  const { data: bookings, isLoading } = useListBookings();
  const { data: stats } = useGetBookingStats();
  const updateStatus = useUpdateBookingStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const { data: selectedBooking, isLoading: loadingBooking } = useGetBooking(selectedBookingId as number, {
    query: { enabled: !!selectedBookingId }
  });

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus.mutate(
      { 
        id, 
        data: { status: newStatus as any } 
      },
      {
        onSuccess: () => {
          toast({ title: "Estado actualizado" });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error al actualizar" });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "confirmed": return "Confirmada";
      case "completed": return "Completada";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-serif font-medium mb-8">Panel de Administración</h1>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="text-sm text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-serif">{stats.total}</div>
            </div>
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="text-sm text-muted-foreground mb-1">Pendientes</div>
              <div className="text-2xl font-serif text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="text-sm text-muted-foreground mb-1">Confirmadas</div>
              <div className="text-2xl font-serif text-blue-600">{stats.confirmed}</div>
            </div>
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="text-sm text-muted-foreground mb-1">Ingresos de Reservas</div>
              <div className="text-2xl font-serif text-green-600">{stats.depositsPaid}€</div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando reservas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(booking.appointmentDate).toLocaleDateString('es-ES')}</div>
                      <div className="text-xs text-muted-foreground">{booking.appointmentTime}</div>
                    </TableCell>
                    <TableCell>
                      <div>{booking.clientName}</div>
                      <div className="text-xs text-muted-foreground">{booking.clientEmail}</div>
                    </TableCell>
                    <TableCell>{booking.serviceName || `Servicio #${booking.serviceId}`}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)} variant="outline">
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedBookingId(booking.id)}
                        >
                          Ver detalles
                        </Button>
                        <Select 
                          defaultValue={booking.status}
                          onValueChange={(val) => handleStatusChange(booking.id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay reservas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!selectedBookingId} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Reserva #{selectedBooking?.id}</DialogTitle>
          </DialogHeader>
          {loadingBooking ? (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          ) : selectedBooking ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Cliente</div>
                  <div>{selectedBooking.clientName}</div>
                  <div className="text-sm text-muted-foreground">{selectedBooking.clientEmail}</div>
                  <div className="text-sm text-muted-foreground">{selectedBooking.clientPhone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Cita</div>
                  <div>{new Date(selectedBooking.appointmentDate).toLocaleDateString('es-ES')} a las {selectedBooking.appointmentTime}</div>
                  <div className="text-sm text-muted-foreground">{selectedBooking.serviceName}</div>
                </div>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Notas del cliente</div>
                  <div className="bg-secondary/20 p-3 rounded-lg text-sm">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Estado del pago</div>
                  <div>
                    {selectedBooking.depositPaid ? (
                      <Badge className="bg-green-100 text-green-800" variant="outline">Pagado ({selectedBooking.depositAmount}€)</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800" variant="outline">Pendiente</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Estado de la reserva</div>
                  <Badge className={getStatusColor(selectedBooking.status)} variant="outline">
                    {getStatusLabel(selectedBooking.status)}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
