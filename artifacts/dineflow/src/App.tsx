import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import MenuPage from "@/pages/menu";
import CartPage from "@/pages/cart";
import OrderTrackingPage from "@/pages/order-tracking";
import BillPage from "@/pages/bill";
import PaidPage from "@/pages/paid";
import HistoryPage from "@/pages/history";
import AdminLoginPage from "@/pages/admin/login";
import { AdminLayout } from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminOrderDetailPage from "@/pages/admin/order-detail";
import AdminMenuPage from "@/pages/admin/menu";
import AdminTablesPage from "@/pages/admin/tables";
import AdminEarningsPage from "@/pages/admin/earnings";
import AdminStaffPage from "@/pages/admin/staff";
import AdminSettingsPage from "@/pages/admin/settings";

function withAdmin(Component: React.ComponentType) {
  return () => (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        {/* Customer */}
        <Route path="/" component={LandingPage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/order/:id" component={OrderTrackingPage} />
        <Route path="/order/:id/bill" component={BillPage} />
        <Route path="/order/:id/paid" component={PaidPage} />
        <Route path="/history" component={HistoryPage} />

        {/* Admin */}
        <Route path="/admin" component={() => <Redirect to="/admin/dashboard" />} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/dashboard" component={withAdmin(AdminDashboard)} />
        <Route path="/admin/orders" component={withAdmin(AdminOrdersPage)} />
        <Route path="/admin/orders/:id" component={withAdmin(AdminOrderDetailPage)} />
        <Route path="/admin/menu" component={withAdmin(AdminMenuPage)} />
        <Route path="/admin/tables" component={withAdmin(AdminTablesPage)} />
        <Route path="/admin/earnings" component={withAdmin(AdminEarningsPage)} />
        <Route path="/admin/staff" component={withAdmin(AdminStaffPage)} />
        <Route path="/admin/settings" component={withAdmin(AdminSettingsPage)} />

        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default App;
