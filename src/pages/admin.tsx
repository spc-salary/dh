import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useListSubcategories,
  useCreateSubcategory,
  useDeleteSubcategory,
  useListEntries,
  getListCategoriesQueryKey,
  getListSubcategoriesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Trash2, Plus, Edit, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: categories } = useListCategories();
  const { data: entriesData } = useListEntries({ limit: 1 });
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const createSubcategory = useCreateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#0ea5e9");
  
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("");
  
  const [selectedMainCatForSub, setSelectedMainCatForSub] = useState<string>("");
  const [newSubName, setNewSubName] = useState("");

  const { data: subcategories } = useListSubcategories(
    { categoryId: selectedMainCatForSub ? Number(selectedMainCatForSub) : undefined },
    { query: { enabled: true, queryKey: ["admin-subcategories", selectedMainCatForSub] } }
  );

  const handleCreateCategory = () => {
    if (!newCatName) return;
    createCategory.mutate(
      { data: { name: newCatName, color: newCatColor, emoji: "" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setNewCatName("");
          toast({ title: "تمت إضافة القسم بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };
  
  const startEditingCat = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
  };
  
  const handleUpdateCategory = (id: number) => {
    if (!editCatName) return;
    updateCategory.mutate(
      { id, data: { name: editCatName, color: editCatColor } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setEditingCatId(null);
          toast({ title: "تم تعديل القسم بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "تم الحذف بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleCreateSubcategory = () => {
    if (!newSubName || !selectedMainCatForSub) return;
    createSubcategory.mutate(
      { data: { name: newSubName, mainCategoryId: Number(selectedMainCatForSub) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-subcategories", selectedMainCatForSub] });
          queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey() });
          setNewSubName("");
          toast({ title: "تمت إضافة القسم الفرعي بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleDeleteSubcategory = (id: number) => {
    deleteSubcategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-subcategories", selectedMainCatForSub] });
          queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey() });
          toast({ title: "تم الحذف بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الفعاليات</CardDescription>
              <CardTitle className="text-4xl">{entriesData?.total || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الأقسام الرئيسية</CardDescription>
              <CardTitle className="text-4xl">{categories?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Categories */}
          <Card>
            <CardHeader>
              <CardTitle>الأقسام الرئيسية</CardTitle>
              <CardDescription>إدارة أقسام الدليل الأساسية (أطباء، مطاعم...)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-2 bg-muted p-4 rounded-lg">
                <div className="flex-1 space-y-1">
                  <Label>اسم القسم</Label>
                  <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="مثال: أطباء" />
                </div>
                <div className="w-20 space-y-1">
                  <Label>اللون</Label>
                  <Input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 p-1" />
                </div>
                <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                  <Plus className="h-4 w-4 ml-2" /> إضافة
                </Button>
              </div>

              <div className="space-y-2">
                {categories?.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-md">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input type="color" value={editCatColor} onChange={(e) => setEditCatColor(e.target.value)} className="h-8 w-12 p-0.5" />
                        <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="h-8 flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateCategory(cat.id)} className="text-green-600">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingCatId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEditingCat(cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف قسم "{cat.name}"؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} className="bg-destructive text-destructive-foreground">
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subcategories */}
          <Card>
            <CardHeader>
              <CardTitle>الأقسام الفرعية</CardTitle>
              <CardDescription>التخصصات التابعة لكل قسم (عظمية، أسنان...)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <div className="space-y-1">
                  <Label>القسم الرئيسي</Label>
                  <Select value={selectedMainCatForSub} onValueChange={setSelectedMainCatForSub}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم الرئيسي..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedMainCatForSub && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label>اسم القسم الفرعي</Label>
                      <Input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="مثال: طب أطفال" />
                    </div>
                    <Button onClick={handleCreateSubcategory} disabled={createSubcategory.isPending}>
                      <Plus className="h-4 w-4 ml-2" /> إضافة
                    </Button>
                  </div>
                )}
              </div>

              {selectedMainCatForSub && (
                <div className="space-y-2">
                  {subcategories?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا يوجد أقسام فرعية مسجلة هنا</p>
                  ) : (
                    subcategories?.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-md">
                        <span className="font-medium">{sub.name}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف التخصص "{sub.name}"؟
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSubcategory(sub.id)} className="bg-destructive text-destructive-foreground">
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
