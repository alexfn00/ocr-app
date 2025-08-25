import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, ScrollView } from "@tarojs/components";
import { Popup, Cell, Input, Button } from "@nutui/nutui-react-taro";

export interface Publisher {
  _id: string;
  name: string;
}

interface PublisherSelectProps {
  value?: Publisher | null; // 当前选中出版社
  onChange?: (publisher: Publisher) => void; // 选中回调
  pageSize?: number;
  placeholder?: string;
}

const PublisherSelect = ({
  value,
  onChange,
  pageSize = 20,
  placeholder = "请选择出版社",
}: PublisherSelectProps) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 加载出版社
  const fetchPublishers = async (pageNum = 1, searchKey = "") => {
    setLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: "getPublisherList",
        data: { page: pageNum, pageSize, keyword: searchKey },
      });
      const result = res.result as any;
      console.log("fetchPublishers result:", result);
      if (result.success) {
        let list: Publisher[] = result.data;
        if (pageNum === 1) {
          setPublishers(list);
        } else {
          setPublishers((prev) => [...prev, ...list]);
        }
        setTotal(result.total);
      } else {
        Taro.showToast({
          title: result.message || "获取出版社失败",
          icon: "none",
        });
      }
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: "获取出版社失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  // 打开弹窗
  const openPopup = () => {
    setPopupVisible(true);
    setPage(1);
    fetchPublishers(1, keyword);
  };

  // 滚动到底加载下一页
  const fetchNextPage = () => {
    if (publishers.length < total && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPublishers(nextPage, keyword);
    }
  };

  // 选择出版社
  const handleSelect = (publisher: Publisher) => {
    onChange && onChange(publisher);
    setPopupVisible(false);
  };

  return (
    <View>
      <Cell
        title="出版社"
        extra={value?.name || placeholder}
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
            placeholder="搜索出版社"
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
              fetchPublishers(1, keyword);
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
          {publishers.map((p) => (
            <Cell key={p._id} title={p.name} onClick={() => handleSelect(p)} />
          ))}

          {publishers.length === 0 && !loading && (
            <View style={{ textAlign: "center", padding: "20px" }}>
              暂无出版社
            </View>
          )}
        </ScrollView>
      </Popup>
    </View>
  );
};

export default PublisherSelect;
