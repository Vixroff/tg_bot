import { Navigate, createBrowserRouter } from "react-router-dom";

import { RootLayout } from "./ui/RootLayout";
import { CatalogPage } from "./pages/CatalogPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailsPage } from "./pages/OrderDetailsPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <CatalogPage /> },
        { path: "cart", element: <CartPage /> },
        { path: "checkout", element: <CheckoutPage /> },
        { path: "orders", element: <OrdersPage /> },
        { path: "orders/:orderId", element: <OrderDetailsPage /> },
        {
          path: "admin",
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate to="products" replace /> },
            { path: "products", element: <AdminProductsPage /> },
            { path: "orders", element: <AdminOrdersPage /> },
            { path: "users", element: <AdminUsersPage /> }
          ]
        }
      ]
    }
  ],
  { basename: "/app" }
);

