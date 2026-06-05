import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateEntry,
  useUpdateEntry,
  useListCategories,
  useListSubcategories,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const entrySchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  mainCategoryId: z.coerce.number().min(1, { message: "القسم الرئيسي مطلوب" }),
  subCategory: z.string().min(1, { message: "القسم الفرعي مطلوب" }),
  address: z.string().min(1, { message: "العنوان مطلوب" }),
  phone: z.string().optional(),
  notes: z.string().optional(),
  socialUrl: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

interface EntryFormProps {
  initialData?: Entry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntryForm({ initialData, onSuccess, onCancel }: EntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const { data: categories } = useListCategories();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      name: initialData?.name || "",
      mainCategoryId: initialData?.mainCategoryId || 0,
      subCategory: initialData?.subCategory || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      notes: initialData?.notes || "",
      socialUrl: initialData?.socialUrl || "",
    },
  });

  const selectedCategoryId = form.watch("mainCategoryId");
  const { data: subcategories } = useListSubcategories(
    { categoryId: selectedCategoryId },
    { query: { enabled: !!selectedCategoryId, queryKey: ["subcategories", selectedCategoryId] } }
  );

  const onSubmit = (data: EntryFormValues) => {
    if (initialData) {
      updateEntry.mutate(
        { id: initialData.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
            toast({ title: "تم التعديل بنجاح" });
            onSuccess?.();
          },
          onError: () => {
            toast({ title: "حدث خطأ", variant: "destructive" });
          },
        }
      );
    } else {
      createEntry.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
            toast({ title: "تمت الإضافة بنجاح" });
            form.reset();
            onSuccess?.();
          },
          onError: () => {
            toast({ title: "حدث خطأ", variant: "destructive" });
          },
        }
      );
    }
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم</FormLabel>
                <FormControl>
                  <Input placeholder="اسم الفعالية / الدكتور / المتجر..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mainCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>القسم الرئيسي</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>القسم الفرعي / التخصص</FormLabel>
                <FormControl>
                  <Input placeholder="اكتب التخصص أو اختر..." {...field} list="subcategories-list" />
                </FormControl>
                <datalist id="subcategories-list">
                  {subcategories?.map((sub) => (
                    <option key={sub.id} value={sub.name} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان</FormLabel>
                <FormControl>
                  <Input placeholder="المنطقة، الشارع..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <FormControl>
                  <Input placeholder="09..." {...field} dir="ltr" className="text-right" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رابط التواصل</FormLabel>
                <FormControl>
                  <Input placeholder="فيسبوك، انستغرام..." {...field} dir="ltr" className="text-right" />
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
              <FormLabel>ملاحظات إضافية</FormLabel>
              <FormControl>
                <Textarea placeholder="أوقات الدوام، تفاصيل أخرى..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {initialData ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
