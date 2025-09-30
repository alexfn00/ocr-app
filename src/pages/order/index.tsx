import { useAuthGuard } from "src/hooks/useAuthGuard";

import OrderListPage from "src/components/OrderListPage";

export default function OrderPage() {
  useAuthGuard();
  return <OrderListPage title="📦 订单" mode="order" />;
}
