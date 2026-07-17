import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './modules/dashboard/DashboardPage'
import ProductCatalogPage from './modules/catalog/ProductCatalogPage'
import SuppliersPage from './modules/suppliers/SuppliersPage'
import PurchaseOrderPage from './modules/purchase-order/PurchaseOrderPage'
import LogisticsPage from './modules/logistics/LogisticsPage'
import CustomsPage from './modules/customs/CustomsPage'
import CostAllocationPage from './modules/allocation/CostAllocationPage'
import PricingPage from './modules/pricing/PricingPage'
import ImportHistoryPage from './modules/history/ImportHistoryPage'
import SimulatorPage from './modules/simulator/SimulatorPage'
import QuotationsPage from './modules/quotations/QuotationsPage'
import SettingsPage from './modules/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductCatalogPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchase-order" element={<PurchaseOrderPage />} />
        <Route path="logistics" element={<LogisticsPage />} />
        <Route path="customs" element={<CustomsPage />} />
        <Route path="allocation" element={<CostAllocationPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="history" element={<ImportHistoryPage />} />
        <Route path="simulator" element={<SimulatorPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
