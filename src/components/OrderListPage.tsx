import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { Button } from "@nutui/nutui-react-taro";
import BookReturnList from "src/components/BookReturnList";
import CustomerSelect, { Customer } from "src/components/CustomerSelect";
import { updateBadge } from "src/utils/tabbar";
import styles from "./OrderListPage.module.scss";
import { ORDER_LIST } from "src/constants/storageKeys";
import { RETURN_LIST } from "src/constants/storageKeys";

interface BookItem {
  isbn: string;
  title?: string;
  author?: string;
  price?: number;
  count: number;
  badCount?: number;
}

interface CloudFunctionResponse {
  success: boolean;
  message?: string;
  fileID?: string;
  downloadUrl?: string;
}

function isHttpUrlResponse(
  res: CloudFunctionResponse
): res is CloudFunctionResponse & { downloadUrl: string } {
  return (
    typeof res.downloadUrl === "string" && /^https?:\/\//.test(res.downloadUrl)
  );
}

interface OrderListPageProps {
  title: string;
  mode: "return" | "order";
}

export default function OrderListPage({ title, mode }: OrderListPageProps) {
  const [itemList, setItemList] = useState<BookItem[]>([]);
  const [generatedFileID, setGeneratedFileID] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useDidShow(() => {
    const saved = Taro.getStorageSync(
      mode === "return" ? RETURN_LIST : ORDER_LIST
    );
    if (Array.isArray(saved)) setItemList(saved);
  });

  const saveList = (newList: BookItem[]) => {
    setItemList(newList);
    Taro.setStorageSync(mode === "return" ? RETURN_LIST : ORDER_LIST, newList);
  };

  const handleClearAll = () => {
    Taro.showModal({
      title: `确认清空${title}？`,
      content: "此操作不可撤销",
      success: (res) => {
        if (res.confirm) {
          saveList([]);
          if (mode === "return") updateBadge(0, 2);
          else updateBadge(0, 1);
          Taro.showToast({ title: "已清空", icon: "success" });
        }
      },
    });
  };

  const generateExcel = async (
    customerCode: string,
    customerName: string,
    discount: string,
    items: BookItem[]
  ) => {
    try {
      Taro.showLoading({ title: "生成中..." });
      console.log("生成Excel参数:", {
        mode,
        customerCode,
        customerName,
        discount,
        items,
      });

      const res = await Taro.cloud.callFunction({
        name: "generateReturnExcel",
        data: { mode, customerCode, customerName, discount, items },
      });

      const result = res.result as CloudFunctionResponse;
      if (!result?.success) {
        Taro.showToast({ title: result?.message || "生成失败", icon: "none" });
        console.error("生成Excel失败:", result?.message);
        return;
      }

      if (isHttpUrlResponse(result)) {
        Taro.showToast({ title: "生成成功", icon: "success" });
        return result.downloadUrl;
      }
    } catch (err: any) {
      console.error("生成Excel失败:", err);
      Taro.showToast({
        title: err.message || "操作失败",
        icon: "none",
        duration: 3000,
      });
    } finally {
      Taro.hideLoading();
    }
  };

  const copyDownloadUrl = (url: string) => {
    Taro.setClipboardData({
      data: url,
      success: () => {
        setCopied(true);
        Taro.showToast({ title: "下载链接已复制", icon: "success" });
      },
      fail: () => {
        setCopied(false);
        Taro.showToast({ title: "复制失败，请重试", icon: "none" });
      },
    });
  };

  return (
    <View className={styles["book-list-container"]}>
      <View className={styles["book-list-title"]}>
        {mode == "return" ? "📦 退货单" : "📦 订单"}
      </View>

      {itemList.length === 0 && (
        <View className={styles["book-list-empty"]}>
          {title}暂无数据，去查询添加吧！
        </View>
      )}

      <BookReturnList
        mode={mode}
        items={itemList.map((item) => ({
          ...item,
          badCount: typeof item.badCount === "number" ? item.badCount : 0,
        }))}
        updateCount={(index, field, val) => {
          const newList = [...itemList];
          newList[index] = { ...newList[index], [field]: Number(val) || 0 };
          saveList(newList);
        }}
        handleDelete={(index) => {
          const newList = [...itemList];
          newList.splice(index, 1);
          saveList(newList);
        }}
      />

      <CustomerSelect
        value={selectedCustomer}
        onChange={(c) => setSelectedCustomer(c)}
        placeholder="请选择客户"
      />

      <View
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          width: "100%",
        }}
      >
        <Button
          type="primary"
          style={{ flex: 1 }}
          disabled={itemList.length === 0}
          onClick={async () => {
            if (!selectedCustomer) {
              Taro.showToast({ title: "请先选择客户", icon: "none" });
              return;
            }
            console.log("selectedCustomer:", selectedCustomer);
            console.log("itemList:", itemList);
            const fileID = await generateExcel(
              selectedCustomer.客户编码,
              selectedCustomer.客户名称,
              selectedCustomer.折扣,
              itemList
            );
            if (fileID) setGeneratedFileID(fileID);
          }}
        >
          生成{mode == "return" ? "退货单" : "订单"}
        </Button>
        <Button
          type="success"
          style={{ flex: 1 }}
          disabled={!generatedFileID}
          onClick={() => generatedFileID && copyDownloadUrl(generatedFileID)}
        >
          复制下载链接
        </Button>
      </View>

      <View className={styles["book-list-actions"]}>
        {copied && (
          <Text className={styles.message}>链接已复制，请在浏览器中打开</Text>
        )}
        <Button
          type="default"
          block
          disabled={itemList.length === 0}
          onClick={handleClearAll}
          className={styles["clear-btn"]}
        >
          清空{mode == "return" ? "退货单" : "订单"}
        </Button>
      </View>
    </View>
  );
}
