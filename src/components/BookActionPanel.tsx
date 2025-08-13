import React from "react";
import { View, Text } from "@tarojs/components";
import { Input, Button } from "@nutui/nutui-react-taro";
import styles from "./BookActionPanel.module.scss";

interface BookActionPanelProps {
  goodCount: string;
  badCount: string;
  onGoodCountChange: (val: string) => void;
  onBadCountChange: (val: string) => void;
  onAdd: () => void;
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
  <View className={styles.inputGroup}>
    <Text>{label}</Text>
    <Input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(val) => {
        if (/^\d*$/.test(val)) {
          onChange(val);
        }
      }}
    />
  </View>
);

const BookActionPanel: React.FC<BookActionPanelProps> = ({
  goodCount,
  badCount,
  onGoodCountChange,
  onBadCountChange,
  onAdd,
  onResetInputs,
}) => {
  return (
    <View className={styles.actionPanel}>
      <NumberInput
        label="好书数量："
        placeholder="请输入好书数量"
        value={goodCount}
        onChange={onGoodCountChange}
      />
      <NumberInput
        label="残书数量："
        placeholder="请输入残书数量"
        value={badCount}
        onChange={onBadCountChange}
      />
      <View
        className="action-buttons"
        style={{ display: "flex", justifyContent: "center", gap: "12px" }}
      >
        <Button
          type="primary"
          style={{ flex: 1, maxWidth: 160, minWidth: 120, textAlign: "center" }}
          onClick={onAdd}
        >
          添加到退货单
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
