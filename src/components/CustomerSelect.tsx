import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, ScrollView } from "@tarojs/components";
import { Popup, Cell, Input, Button } from "@nutui/nutui-react-taro";

export interface Customer {
  _id: string;
  客户名称: string;
  客户编码: string;
  折扣: string;
}

interface CustomerSelectProps {
  value?: Customer | null; // 当前选中客户
  onChange?: (customer: Customer) => void; // 选中回调
  pageSize?: number;
  placeholder?: string;
}

const CustomerSelect = ({
  value,
  onChange,
  pageSize = 20,
  placeholder = "请选择客户",
}: CustomerSelectProps) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 加载客户
  const fetchCustomers = async (pageNum = 1, searchKey = "") => {
    setLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: "getCustomerList",
        data: { page: pageNum, pageSize, keyword: searchKey },
      });
      const result = res.result as any;
      if (result.success) {
        let list: Customer[] = result.data;
        if (pageNum === 1) {
          setCustomers(list);
        } else {
          setCustomers((prev) => [...prev, ...list]);
        }
        setTotal(result.total);
      } else {
        Taro.showToast({
          title: result.message || "获取客户失败",
          icon: "none",
        });
      }
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: "获取客户失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  // 打开弹窗
  const openPopup = () => {
    setPopupVisible(true);
    setPage(1);
    fetchCustomers(1, keyword);
  };

  // 滚动到底加载下一页
  const fetchNextPage = () => {
    if (customers.length < total && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(nextPage, keyword);
    }
  };

  // 选择客户
  const handleSelect = (customer: Customer) => {
    onChange && onChange(customer);
    setPopupVisible(false);
  };

  return (
    <View>
      <Cell
        title="客户"
        extra={value?.客户名称 || placeholder}
        onClick={openPopup}
      />

      <Popup
        visible={popupVisible}
        position="bottom"
        style={{ height: "60%" }}
        onClose={() => setPopupVisible(false)}
      >
        <View
          style={{
            padding: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#f8f8f8",
            borderBottom: "1px solid #eee",
          }}
        >
          <Input
            placeholder="搜索客户"
            value={keyword}
            onChange={(val) => setKeyword(val)}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "6px 12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          />
          <Button
            type="primary"
            size="small"
            style={{
              borderRadius: "20px",
              padding: "0 16px",
              lineHeight: "28px",
            }}
            onClick={() => {
              setPage(1);
              fetchCustomers(1, keyword);
            }}
          >
            搜索
          </Button>
        </View>

        <ScrollView
          style={{ height: "calc(100% - 50px)" }}
          scrollY
          onScrollToLower={fetchNextPage}
        >
          {customers.map((c) => (
            <Cell
              key={c._id}
              title={c.客户名称}
              extra={c.客户编码}
              onClick={() => handleSelect(c)}
            />
          ))}

          {customers.length === 0 && !loading && (
            <View style={{ textAlign: "center", padding: "20px" }}>
              暂无客户
            </View>
          )}
        </ScrollView>
      </Popup>
    </View>
  );
};

export default CustomerSelect;
