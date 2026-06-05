import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteEntry,
  useRateEntry,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import type { Entry, Category } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Phone, Edit, Trash2, Globe, Star } from "lucide-react";
import { EntryForm } from "./entry-form";
import { Badge } from "@/components/ui/badge";

interface EntryCardProps {
  entry: Entry;
  category?: Category;
}

export function EntryCard({ entry, category }: EntryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteEntry = useDeleteEntry();
  const rateEntry = useRateEntry();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteEntry.mutate(
      { id: entry.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          toast({ title: "تم الحذف بنجاح" });
        },
        onError: () => {
          toast({ title: "حدث خطأ", variant: "destructive" });
        },
      }
    );
  };

  const handleRate = (rating: number) => {
    rateEntry.mutate(
      { id: entry.id, data: { rating } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          toast({ title: "تم التقييم بنجاح" });
        },
      }
    );
  };

  const color = category?.color || "var(--primary)";

  return (
    <div 
      className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Badge variant="secondary" className="mb-2" style={{ backgroundColor: `${color}20`, color: color }}>
              {category?.name || "غير محدد"}
            </Badge>
            <h3 className="text-xl font-bold tracking-tight">{entry.name}</h3>
            {entry.subCategory && (
              <p className="text-sm font-medium text-muted-foreground mt-1">{entry.subCategory}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm font-bold mr-1">{entry.rating ? Number(entry.rating).toFixed(1) : "-"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-4 text-sm flex-1">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{entry.address}</span>
          </div>
          
          {entry.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span dir="ltr" className="text-right">{entry.phone}</span>
            </div>
          )}

          {entry.socialUrl && (
            <div className="flex items-center gap-2 text-primary hover:underline">
              <Globe className="h-4 w-4 shrink-0" />
              <a href={entry.socialUrl.startsWith('http') ? entry.socialUrl : `https://${entry.socialUrl}`} target="_blank" rel="noopener noreferrer" className="truncate">
                {entry.socialUrl}
              </a>
            </div>
          )}

          {entry.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs border">
              {entry.notes}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-1 dir-ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                className="text-muted-foreground hover:text-amber-500 transition-colors focus:outline-none"
                title={`تقييم بـ ${star} نجوم`}
              >
                <Star className="h-5 w-5" />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>تعديل بيانات {entry.name}</DialogTitle>
                </DialogHeader>
                <EntryForm 
                  initialData={entry} 
                  onSuccess={() => setIsEditDialogOpen(false)} 
                  onCancel={() => setIsEditDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف {entry.name}؟ لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
