import React, { useState } from "react";
import { View, Text, Picker } from "@tarojs/components";
import { Input, Button } from "@nutui/nutui-react-taro";
import styles from "./BookActionPanel.module.scss";
import { RETURN_LIST, ORDER_LIST } from "src/constants/storageKeys";
import { updateBadge } from "src/utils/tabbar";
import Taro, { useDidShow } from "@tarojs/taro";

interface BookActionPanelProps {
  selectedBook: any;
  // onAdd: () => void;
  onResetInputs: () => void;
}

const NumberInput = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <View
    className={styles.inputGroup}
    style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
  >
    <Text style={{ width: 90 }}>{label}</Text>
    <Input
      type="number"
      placeholder={placeholder}
      value={value}
      clearable
      style={{ flex: 1 }}
      onChange={(val) => {
        if (/^\d*$/.test(val)) {
          onChange(val);
        }
      }}
    />
  </View>
);

const BookActionPanel: React.FC<BookActionPanelProps> = ({
  selectedBook,
  onResetInputs,
}) => {
  const [goodCount, setGoodCount] = useState("");
  const [badCount, setBadCount] = useState("");
  const [returnList, setReturnList] = useState<any[]>([]);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [mode, setMode] = useState<"return" | "order">("return");

  const modeOptions = [
    { text: "退书", value: "return" },
    { text: "订单", value: "order" },
  ];

  const handleModeChange = (e: any) => {
    setMode(modeOptions[e.detail.value].value as "return" | "order");
  };
  useDidShow(() => {
    const return_stored = Taro.getStorageSync(RETURN_LIST);
    const order_stored = Taro.getStorageSync(ORDER_LIST);
    updateBadge(return_stored.length, 1);
    if (return_stored && Array.isArray(return_stored)) {
      setReturnList(return_stored);
    }
    updateBadge(order_stored.length, 2);
    if (order_stored && Array.isArray(order_stored)) {
      setOrderList(order_stored);
    }
  });

  const onAdd = () => {
    if (selectedBook === null) {
      Taro.showToast({
        title: "请先选择一本图书",
        icon: "error",
      });
      return;
    }

    const good = Number(goodCount) || 0;
    const bad = Number(badCount) || 0;

    if (good <= 0) {
      if (mode === "order") {
        Taro.showToast({
          title: "请输入订单数量",
          icon: "error",
        });
      } else {
        Taro.showToast({
          title: "请输入好书数量",
          icon: "error",
        });
      }
      return;
    }
    if (mode === "return" && bad <= 0) {
      Taro.showToast({
        title: "请输入残书数量",
        icon: "error",
      });
      return;
    }

    const newItem = {
      isbn: selectedBook.normISBN || "",
      publiser: selectedBook.publiser || "",
      title: selectedBook.书名 || "",
      author: selectedBook.作者 || "",
      price: selectedBook.定价 || 0,
      count: goodCount,
      badCount: badCount,
    };

    let isDuplicate = false;
    if (mode === "return") {
      isDuplicate = returnList.some((item) => item.isbn === newItem.isbn);
      console.log("returnList", returnList);
    } else {
      isDuplicate = orderList.some((item) => item.isbn === newItem.isbn);
      console.log("orderList", orderList);
    }
    console.log("isDuplicate", isDuplicate);

    if (isDuplicate) {
      Taro.showToast({
        title: "记录已存在",
        icon: "error",
      });
      return;
    }

    if (mode === "return") {
      const updatedReturnList = [...returnList, newItem];
      setReturnList(updatedReturnList);
      Taro.setStorage({
        key: RETURN_LIST,
        data: updatedReturnList,
      });
      updateBadge(updatedReturnList.length);
    } else {
      const updatedOrderList = [...orderList, newItem];
      setOrderList(updatedOrderList);
      Taro.setStorage({
        key: ORDER_LIST,
        data: updatedOrderList,
      });
      updateBadge(updatedOrderList.length, 2);
    }
    setGoodCount("");
    setBadCount("");

    Taro.showToast({
      title: "添加成功",
      icon: "success",
    });
  };

  return (
    <View className={styles.actionPanel}>
      {/* 模式选择 */}
      <View style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ width: 90 }}>模式选择：</Text>
        <Picker
          mode="selector"
          range={modeOptions.map((o) => o.text)}
          value={modeOptions.findIndex((o) => o.value === mode)}
          onChange={handleModeChange}
        >
          <View
            style={{
              flex: 1, // 宽度自动占满剩余空间
              height: 40,
              width: "100%",
              lineHeight: "40px",
              padding: "0 24px",
              // border: "1px solid #ccc",
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>{modeOptions.find((o) => o.value === mode)?.text}</Text>
            <Text style={{ fontSize: 12, color: "#999", marginLeft: 12 }}>
              ▼
            </Text>{" "}
            {/* 下拉箭头 */}
          </View>
        </Picker>
      </View>

      {/* 好书数量 */}
      <NumberInput
        label={mode === "return" ? "好书数量：" : "订单数量："}
        placeholder={mode === "return" ? "请输入好书数量" : "请输入订单数量"}
        value={goodCount}
        onChange={setGoodCount}
      />

      {/* 残书数量（仅退书模式显示） */}
      {mode === "return" && (
        <NumberInput
          label="残书数量："
          placeholder="请输入残书数量"
          value={badCount}
          onChange={setBadCount}
        />
      )}

      {/* 操作按钮 */}
      <View
        className="action-buttons"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "12px",
        }}
      >
        <Button
          type="primary"
          style={{ flex: 1, maxWidth: 160, minWidth: 120, textAlign: "center" }}
          onClick={onAdd}
        >
          {mode === "return" ? "添加到退货单" : "添加到订单"}
        </Button>
        <Button
          type="default"
          style={{ flex: 1, maxWidth: 160, minWidth: 120, textAlign: "center" }}
          onClick={onResetInputs}
        >
          识别下一个
        </Button>
      </View>
    </View>
  );
};

export default BookActionPanel;
