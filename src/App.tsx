import { lazy, Suspense } from 'react';
import RouteMetadata from '@/components/RouteMetadata';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
const NotFound = lazy(() => import("./pages/NotFound"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const EntryPage = lazy(() => import("./pages/EntryPage"));
const Dictionary = lazy(() => import("./pages/Dictionary"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const ReviewRevisions = lazy(() => import("./pages/ReviewRevisions"));
const EditEntry = lazy(() => import("./pages/EditEntry"));
const HelpWikiSyntax = lazy(() => import("./pages/HelpWikiSyntax"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <RouteMetadata />
          <Suspense fallback={<div role="status" className="container py-24 text-center">טוען עמוד…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/entry/:slug" element={<EntryPage />} />
            <Route path="/edit/:slug" element={<EditEntry />} />
            <Route path="/edit" element={<EditEntry />} />
            <Route path="/help/wiki-syntax" element={<HelpWikiSyntax />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/revisions" element={<ReviewRevisions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
