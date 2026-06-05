import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useListEntries,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EntryCard } from "@/components/entry-card";
import { EntryForm } from "@/components/entry-form";
import { useTheme } from "@/components/theme-provider";
import { Search, Plus, Moon, Sun, Settings, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  
  const selectedCategoryId = activeTab === "all" ? undefined : Number(activeTab);
  
  const { data: entriesData, isLoading, isFetching } = useListEntries(
    { search, categoryId: selectedCategoryId },
    { query: { queryKey: getListEntriesQueryKey({ search, categoryId: selectedCategoryId }) } }
  );

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">دليل مدينة حمص</h1>
            {entriesData?.total !== undefined && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {entriesData.total} فعالية
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-primary-foreground hover:bg-white/10" title="تحديث">
              <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-primary-foreground hover:bg-white/10" title="تغيير المظهر">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" title="لوحة التحكم">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Search & Add */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث عن اسم، تخصص، منطقة..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen} className="w-full md:w-auto">
            <CollapsibleTrigger asChild>
              <Button className="w-full md:w-auto gap-2">
                <Plus className="h-4 w-4" />
                إضافة فعالية جديدة
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 p-6 bg-card border rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">إضافة فعالية</h2>
              <EntryForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Categories Tabs */}
        {categories && categories.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-muted p-1">
                <TabsTrigger value="all" className="px-6">الكل</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id.toString()} className="px-6 gap-2">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}

        {/* Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-5 space-y-4 shadow-sm">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : entriesData?.results && entriesData.results.length > 0 ? (
            entriesData.results.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                category={categories?.find(c => c.id === entry.mainCategoryId)} 
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <p className="text-lg">لا يوجد نتائج تطابق بحثك</p>
              <p className="text-sm mt-2">جرب بكلمات أخرى أو قم بإضافة الفعالية بنفسك</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-muted py-8 text-center text-muted-foreground border-t">
        <p>دليل مدينة حمص الخدمي والتجاري - منصة مفتوحة للجميع</p>
      </footer>
    </div>
  );
}
