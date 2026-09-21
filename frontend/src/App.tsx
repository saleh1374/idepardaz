import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import PartsPage from './pages/PartsPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProfilePage from './pages/ProfilePage'
import WizardPage from './pages/WizardPage'
import MakersPage from './pages/MakersPage'
import MakerDetailPage from './pages/MakerDetailPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminPage from './pages/AdminPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRecipesPage from './pages/AdminRecipesPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminAuditPage from './pages/AdminAuditPage'
import AdminSuppliersPage from './pages/AdminSuppliersPage'
import MakerDashboardPage from './pages/MakerDashboardPage'
import MakerJobsPage from './pages/MakerJobsPage'
import MakerServicesPage from './pages/MakerServicesPage'
import SupplierDashboardPage from './pages/SupplierDashboardPage'
import SupplierProductsPage from './pages/SupplierProductsPage'
import SupplierOrdersPage from './pages/SupplierOrdersPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            {/* صفحات عمومی */}
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/makers" element={<MakersPage />} />
            <Route path="/makers/:id" element={<MakerDetailPage />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* پروژه‌ها و سفارشات */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />

            {/* پنل صنعتگر */}
            <Route path="/maker/dashboard" element={<MakerDashboardPage />} />
            <Route path="/maker/jobs" element={<MakerJobsPage />} />
            <Route path="/maker/services" element={<MakerServicesPage />} />

            {/* پنل تأمین‌کننده */}
            <Route path="/supplier/dashboard" element={<SupplierDashboardPage />} />
            <Route path="/supplier/products" element={<SupplierProductsPage />} />
            <Route path="/supplier/orders" element={<SupplierOrdersPage />} />

            {/* پنل مدیریت */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/recipes" element={<AdminRecipesPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/suppliers" element={<AdminSuppliersPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />

            {/* ۴۰۴ */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
