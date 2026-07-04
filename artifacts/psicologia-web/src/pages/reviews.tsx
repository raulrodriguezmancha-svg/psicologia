import { useListReviews, useGetReviewStats, useCreateReview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const reviewSchema = z.object({
  authorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Por favor, escribe un comentario más descriptivo (mín. 10 caracteres)")
});

export default function Reviews() {
  const { data: reviews, isLoading: loadingReviews } = useListReviews();
  const { data: stats } = useGetReviewStats();
  const createReview = useCreateReview();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      authorName: "",
      rating: 5,
      comment: ""
    }
  });

  const onSubmit = (data: z.infer<typeof reviewSchema>) => {
    createReview.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "¡Reseña enviada!",
          description: "Tu reseña ha sido enviada y está pendiente de moderación.",
        });
        setOpen(false);
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Hubo un problema al enviar tu reseña. Inténtalo de nuevo.",
        });
      }
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-accent text-accent' : 'fill-muted text-muted'}`} 
      />
    ));
  };

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-4">Experiencias</h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Lee las opiniones de personas que han confiado en mí para acompañarles en su proceso terapéutico.
              </p>
            </div>
            
            {stats && (
              <div className="flex items-center gap-6 bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <div className="text-center">
                  <div className="text-5xl font-serif text-foreground font-medium">{stats.averageRating.toFixed(1)}</div>
                  <div className="flex justify-center my-2">
                    {renderStars(Math.round(stats.averageRating))}
                  </div>
                  <div className="text-sm text-muted-foreground">{stats.totalReviews} reseñas en total</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-end max-w-5xl mx-auto mb-8">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">Dejar una reseña</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Comparte tu experiencia</DialogTitle>
                <DialogDescription>
                  Tu opinión ayuda a otras personas a dar el paso hacia la terapia.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre o iniciales</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. María G." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valoración</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => field.onChange(star)}
                                className="focus:outline-none"
                              >
                                <Star 
                                  className={`h-8 w-8 ${star <= field.value ? 'fill-accent text-accent' : 'fill-muted text-muted hover:fill-accent/50'}`} 
                                />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu comentario</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="¿Cómo ha sido tu experiencia con la terapia?" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={createReview.isPending}>
                    {createReview.isPending ? "Enviando..." : "Enviar reseña"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {loadingReviews ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : reviews?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Aún no hay reseñas disponibles.
            </div>
          ) : (
            reviews?.map((review) => (
              <Card key={review.id} className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-center gap-4 space-y-0">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{review.authorName}</div>
                    <div className="flex mt-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    "{review.comment}"
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground/60">
                    {new Date(review.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
