import { Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Header from './components/Header'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import PartsPage from './pages/PartsPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import BuyPage from './pages/BuyPage'
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
import TermsPage from './pages/TermsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            {/* صفحات عمومی — همه قابل دسترسی */}
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/makers" element={<MakersPage />} />
            <Route path="/makers/:id" element={<MakerDetailPage />} />
            <Route path="/wizard" element={<WizardPage />} />

            {/* احراز هویت — نیاز به ورود */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* پروژه‌ها و سفارشات — فقط کاربران لاگین‌شده */}
            <Route path="/projects" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <ProjectDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/buy" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <BuyPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute allowedRoles={['Member', 'Maker', 'Supplier', 'Admin']}>
                <OrderDetailPage />
              </ProtectedRoute>
            } />

            {/* پنل صنعتگر — فقط صنعتگر */}
            <Route path="/maker/dashboard" element={
              <ProtectedRoute allowedRoles={['Maker']}>
                <MakerDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/maker/jobs" element={
              <ProtectedRoute allowedRoles={['Maker']}>
                <MakerJobsPage />
              </ProtectedRoute>
            } />
            <Route path="/maker/services" element={
              <ProtectedRoute allowedRoles={['Maker']}>
                <MakerServicesPage />
              </ProtectedRoute>
            } />

            {/* پنل تأمین‌کننده — فقط تأمین‌کننده */}
            <Route path="/supplier/dashboard" element={
              <ProtectedRoute allowedRoles={['Supplier']}>
                <SupplierDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/supplier/products" element={
              <ProtectedRoute allowedRoles={['Supplier']}>
                <SupplierProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/supplier/orders" element={
              <ProtectedRoute allowedRoles={['Supplier']}>
                <SupplierOrdersPage />
              </ProtectedRoute>
            } />

            {/* صفحات قانونی */}
            <Route path="/terms" element={<TermsPage />} />

            {/* پنل مدیریت — فقط مدیر */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/recipes" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminRecipesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/suppliers" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminSuppliersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminAuditPage />
              </ProtectedRoute>
            } />

            {/* ۴۰۴ */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
