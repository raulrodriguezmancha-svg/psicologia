import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useListServices, useGetAvailability, useCreateBooking, useCreatePaymentCheckout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ChevronLeft, Calendar as CalendarIcon, Clock, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";

const personalInfoSchema = z.object({
  clientName: z.string().min(2, "Nombre requerido"),
  clientEmail: z.string().email("Correo electrónico inválido"),
  clientPhone: z.string().min(9, "Teléfono inválido"),
  notes: z.string().optional(),
});

export default function Booking() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Step State: 1 = Service, 2 = Date/Time, 3 = Info
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Queries
  const { data: services, isLoading: loadingServices } = useListServices();
  const selectedService = services?.find(s => s.id === selectedServiceId);
  
  const currentMonth = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}` : undefined;
  const { data: availability, isLoading: loadingAvail } = useGetAvailability(currentMonth ? { month: currentMonth } : undefined);

  // Mutations
  const createBooking = useCreateBooking();
  const createCheckout = useCreatePaymentCheckout();

  // Forms
  const form = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
    }
  });

  // Derived Availability Data
  const availableSlotsForDate = useMemo(() => {
    if (!selectedDate || !availability) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return availability.filter(slot => slot.date === dateStr && slot.available).map(s => s.time).sort();
  }, [selectedDate, availability]);

  const disabledDays = useMemo(() => {
    if (!availability) return [];
    // A simple hack: Disable all dates before today, weekends, and dates with no available slots.
    // In a real app, you'd accurately compute this from the `availability` array for the given month.
    return [
      { before: new Date() },
      (date: Date) => date.getDay() === 0 || date.getDay() === 6 // Disable weekends
    ];
  }, [availability]);

  // Handlers
  const handleServiceSelect = (id: number) => {
    setSelectedServiceId(id);
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const onSubmit = async (data: z.infer<typeof personalInfoSchema>) => {
    if (!selectedServiceId || !selectedDate || !selectedTime || !selectedService) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];

    createBooking.mutate({
      data: {
        serviceId: selectedServiceId,
        appointmentDate: dateStr,
        appointmentTime: selectedTime,
        ...data
      }
    }, {
      onSuccess: (booking) => {
        createCheckout.mutate({
          data: {
            bookingId: booking.id,
            depositAmount: selectedService.depositAmount
          }
        }, {
          onSuccess: (checkout) => {
            window.location.href = checkout.checkoutUrl;
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo iniciar el proceso de pago. Contáctanos por favor."
            });
          }
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear la reserva. Intenta en otro momento."
        });
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Progress Bar */}
        <div className="mb-12">
          <h1 className="text-3xl font-serif text-foreground font-medium mb-8 text-center">Reservar sesión</h1>
          <div className="flex items-center justify-center">
            <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {step > 1 ? <CheckCircle2 size={16} /> : "1"}
              </div>
              <span className="text-xs font-medium">Servicio</span>
            </div>
            <div className={`w-16 h-1 mx-2 rounded ${step >= 2 ? 'bg-primary/50' : 'bg-secondary'}`} />
            <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {step > 2 ? <CheckCircle2 size={16} /> : "2"}
              </div>
              <span className="text-xs font-medium">Fecha</span>
            </div>
            <div className={`w-16 h-1 mx-2 rounded ${step >= 3 ? 'bg-primary/50' : 'bg-secondary'}`} />
            <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                3
              </div>
              <span className="text-xs font-medium">Datos</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Step 1: Services */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-serif mb-6">Selecciona el tipo de sesión</h2>
              {loadingServices ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary/50 animate-pulse rounded-xl" />)}
                </div>
              ) : (
                <div className="grid gap-4">
                  {services?.map((service) => (
                    <div 
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={`p-6 rounded-xl border transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 group ${selectedServiceId === service.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 bg-background'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{service.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={14} /> {service.duration} min</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-lg">{service.price}€</div>
                          <div className="text-xs text-muted-foreground">Reserva: {service.depositAmount}€</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="flex flex-col md:flex-row min-h-[500px]">
              <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border/50 p-8 bg-secondary/10">
                <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} className="mr-1" /> Volver a servicios
                </Button>
                <h2 className="text-xl font-serif mb-6">¿Cuándo te viene mejor?</h2>
                <div className="flex justify-center bg-background rounded-xl p-4 shadow-sm border border-border/50">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                    disabled={disabledDays as any}
                    locale={es}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-1/2 p-8 bg-background">
                {selectedDate ? (
                  <>
                    <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                      <CalendarIcon size={18} className="text-primary" />
                      {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    
                    {loadingAvail ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-secondary/50 animate-pulse rounded-lg" />)}
                      </div>
                    ) : availableSlotsForDate.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {availableSlotsForDate.map(time => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            className={`h-12 text-base ${selectedTime === time ? 'shadow-md ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground flex flex-col items-center bg-secondary/20 rounded-xl">
                        <Clock size={32} className="mb-3 opacity-20" />
                        <p>No hay horas disponibles este día.</p>
                        <p className="text-sm">Por favor, selecciona otra fecha.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12 md:py-0">
                    <CalendarIcon size={48} className="mb-4 opacity-20" />
                    <p>Selecciona un día en el calendario<br/>para ver las horas disponibles</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Info & Checkout */}
          {step === 3 && (
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 bg-primary text-primary-foreground p-8 flex flex-col">
                <Button variant="ghost" className="self-start mb-8 -ml-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setStep(2)}>
                  <ChevronLeft size={16} className="mr-1" /> Volver
                </Button>
                
                <h3 className="font-serif text-xl font-medium mb-6">Resumen de tu cita</h3>
                
                <div className="space-y-6 flex-grow">
                  <div>
                    <div className="text-sm text-primary-foreground/70 mb-1">Servicio</div>
                    <div className="font-medium">{selectedService?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-primary-foreground/70 mb-1">Fecha y hora</div>
                    <div className="font-medium capitalize">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div className="font-medium">{selectedTime}</div>
                  </div>
                  <div className="pt-6 border-t border-primary-foreground/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-primary-foreground/70">Precio total</span>
                      <span>{selectedService?.price}€</span>
                    </div>
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span>Reserva hoy</span>
                      <span>{selectedService?.depositAmount}€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3 p-8 bg-background">
                <h2 className="text-2xl font-serif mb-6">Tus datos</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Ana Martínez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="ana@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+34 600 000 000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de la consulta (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Escribe brevemente el motivo por el que solicitas consulta..." 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-base rounded-full shadow-lg shadow-primary/20" 
                        disabled={createBooking.isPending || createCheckout.isPending}
                      >
                        {createBooking.isPending || createCheckout.isPending ? (
                          "Procesando..."
                        ) : (
                          <>Pagar reserva de {selectedService?.depositAmount}€ <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-4">
                        Serás redirigido a Stripe para realizar el pago de forma segura.
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
