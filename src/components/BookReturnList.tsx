import { View, Text } from "@tarojs/components";
import { Input, Button } from "@nutui/nutui-react-taro";
import styles from "./BookReturnList.module.scss";

export interface ReturnItem {
  isbn: string;
  title?: string;
  author?: string;
  price?: string | number;
  goodCount: number;
  badCount: number;
}

interface BookReturnListProps {
  items: ReturnItem[];
  updateCount: (
    index: number,
    field: "goodCount" | "badCount",
    value: string
  ) => void;
  handleDelete: (index: number) => void;
}

export default function BookReturnList({
  items,
  updateCount,
  handleDelete,
}: BookReturnListProps) {
  if (!items.length) {
    return <View className={styles.emptyTip}>退货单暂无数据</View>;
  }

  return (
    <View>
      {items.map((item, index) => (
        <View key={item.isbn + index} className={styles.returnItem}>
          <View className={styles.info}>
            <Text className={styles.title}>{item.title || "书名未知"}</Text>
            <Text className={styles.authorPrice}>
              {item.author || "作者未知"} / {item.price || "定价未知"}
            </Text>
            <Text className={styles.isbn}>ISBN: {item.isbn}</Text>
          </View>

          <View className={styles.counts}>
            <View className={styles.countGroup}>
              <Text>好书：</Text>
              <Input
                type="number"
                value={String(item.goodCount)}
                onChange={(val) => updateCount(index, "goodCount", val)}
                placeholder="0"
                clearable
              />
            </View>
            <View className={styles.countGroup}>
              <Text>残书：</Text>
              <Input
                type="number"
                value={String(item.badCount)}
                onChange={(val) => updateCount(index, "badCount", val)}
                placeholder="0"
                clearable
              />
            </View>
            <Button
              type="warning"
              size="small"
              className={styles.deleteBtn}
              onClick={() => handleDelete(index)}
            >
              删除
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
