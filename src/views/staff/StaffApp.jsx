import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Toaster } from 'react-hot-toast';

import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import InventoryPage from './pages/InventoryPage';
import AddOrderPage from './pages/AddOrderPage';
import OrdersPendingPage from './pages/OrdersPendingPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import AddCustomerPage from './pages/AddCustomerPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import DeliveryPage from './pages/DeliveryPage';
import AddDeliveryPage from './pages/AddDeliveryPage';
import DeliveryDetailsPage from './pages/DeliveryDetailsPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SalesTodayPage from './pages/SalesTodayPage';
import RevenueTodayPage from './pages/RevenueTodayPage';
import ReportsPage from './pages/ReportsPage';
import AppLayout from './layouts/AppLayout';

function StaffRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="billing/new" element={<CreateInvoicePage />} />
        <Route path="billing/invoice/:id" element={<InvoiceDetailsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<AddProductPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="orders/new" element={<AddOrderPage />} />
        <Route path="orders/pending" element={<OrdersPendingPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<AddCustomerPage />} />
        <Route path="customers/:id" element={<CustomerDetailsPage />} />
        <Route path="deliveries" element={<DeliveryPage />} />
        <Route path="deliveries/new" element={<AddDeliveryPage />} />
        <Route path="deliveries/:id" element={<DeliveryDetailsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/change-password" element={<ChangePasswordPage />} />
        <Route path="sales/today" element={<SalesTodayPage />} />
        <Route path="revenue/today" element={<RevenueTodayPage />} />
        <Route path="reports/today" element={<ReportsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function StaffApp() {
  return (
    <HashRouter>
      <DataProvider>
        <AuthProvider>
          <StaffRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </DataProvider>
    </HashRouter>
  );
}
