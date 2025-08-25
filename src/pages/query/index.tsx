import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { Button, Input } from "@nutui/nutui-react-taro";
import "./index.scss";
import BookList from "src/components/BookList";
import BookActionPanel from "src/components/BookActionPanel";
import { RETURN_LIST } from "src/constants/storageKeys";
import { updateReturnListBadge } from "src/utils/tabbar";
import { useAuthGuard } from "src/hooks/useAuthGuard";

const QueryPage = () => {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [recognizedISBN, setRecognizedISBN] = useState("");
  const [manualISBN, setManualISBN] = useState("978-7-5086-7635-7");
  const [books, setBooks] = useState<any[]>([]); // 存储已选的图书信息
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(
    null
  ); // 当前选择的图书索引
  const [goodCount, setGoodCount] = useState("");
  const [badCount, setBadCount] = useState("");
  const [returnList, setReturnList] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useAuthGuard();

  useDidShow(() => {
    const stored = Taro.getStorageSync(RETURN_LIST);
    updateReturnListBadge(stored.length);
    if (stored && Array.isArray(stored)) {
      setReturnList(stored);
    }
  });

  // OCR 拍照识别
  const handleTakePhoto = () => {
    setMessage("");
    Taro.chooseImage({
      count: 1,
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        Taro.getFileSystemManager().readFile({
          filePath,
          encoding: "base64",
          success: async (data) => {
            setLoading(true);
            try {
              const result = await Taro.cloud.callFunction({
                name: "ocr",
                data: { imageBase64: data.data },
              });

              let isbn = "";
              // 类型守卫：确保 result.result 是对象且包含 isbn 字段
              if (
                result.result &&
                typeof result.result === "object" &&
                "isbn" in result.result
              ) {
                const { formatted } = (result.result as any).isbn || {};
                isbn = formatted || "";
              }

              if (isbn) {
                setRecognizedISBN(isbn);
                setMessage("✅ 识别成功");
                fetchBooksByIsbn(isbn);
              } else {
                setMessage("⚠️ 识别失败，请重试或切换到手动输入");
              }
            } catch (e) {
              setMessage("⚠️ 识别出错，请重试或切换到手动输入");
            } finally {
              setLoading(false);
            }
          },
          fail: () => {
            // setMessage("⚠️ 读取图片失败，请重试");
          },
        });
      },
      fail: () => {
        // setMessage("⚠️ 选择图片失败");
      },
    });
  };
  const fetchBooksByIsbn = async (isbn: string) => {
    try {
      Taro.showLoading({ title: "查询中..." });

      const res = await Taro.cloud.callFunction({
        name: "queryBook",
        data: { isbn },
      });

      const result = res.result;
      if (
        result &&
        typeof result === "object" &&
        "code" in result &&
        (result as any).code === 0
      ) {
        const data = (result as any).data;
        setBooks(data);

        if (data.length === 1) {
          setSelectedBookIndex(0);
          setMessage("已自动选中唯一匹配图书");
          // Taro.showToast({ title: "已自动选中唯一匹配图书", icon: "success" });
        } else if (data.length > 1) {
          setSelectedBookIndex(null);
          setMessage("找到多本，请手动选择");
          // Taro.showToast({ title: "找到多本，请手动选择", icon: "none" });
        } else {
          setMessage("未找到图书");
          // Taro.showToast({ title: "未找到图书", icon: "none" });
        }
      } else {
        setMessage("未找到图书");
        setBooks([]);
      }
    } catch (err) {
      console.error("查询异常:", err);
      setMessage("查询失败");
    } finally {
      Taro.hideLoading();
    }
  };

  // 手动输入调用
  const handleManualSearch = () => {
    if (!manualISBN) {
      Taro.showToast({
        title: "请输入 ISBN",
        icon: "none",
      });
      return;
    }
    fetchBooksByIsbn(manualISBN);
  };

  const handleAddToReturnList = () => {
    if (selectedBookIndex === null) {
      Taro.showToast({
        title: "请先选择一本图书",
        icon: "error",
      });
      return;
    }

    const good = Number(goodCount) || 0;
    const bad = Number(badCount) || 0;

    if (good <= 0) {
      Taro.showToast({
        title: "请输入好书数量",
        icon: "error",
      });
      return;
    }
    if (bad <= 0) {
      Taro.showToast({
        title: "请输入残书数量",
        icon: "error",
      });
      return;
    }

    const book = books[selectedBookIndex];
    const newItem = {
      isbn: book.normISBN || "",
      publiser: book.publiser || "",
      title: book.书名 || "",
      author: book.作者 || "",
      price: book.定价 || 0,
      goodCount: goodCount,
      badCount: badCount,
    };

    const isDuplicate = returnList.some((item) => item.isbn === newItem.isbn);
    if (isDuplicate) {
      Taro.showToast({
        title: "记录已存在",
        icon: "error",
      });
      return;
    }

    const updatedReturnList = [...returnList, newItem];
    setReturnList(updatedReturnList);
    Taro.setStorage({
      key: RETURN_LIST,
      data: updatedReturnList,
    });
    updateReturnListBadge(updatedReturnList.length);
    setSelectedBookIndex(null);
    setGoodCount("");
    setBadCount("");

    Taro.showToast({
      title: "添加成功",
      icon: "success",
    });
  };

  const handleResetInputs = () => {
    setGoodCount("");
    setBadCount("");
    setSelectedBookIndex(null);
    setBooks([]);
    setManualISBN("");
    setRecognizedISBN("");
    setMessage("");
  };

  return (
    <View className="query-page container">
      <View className="tabs">
        <View
          className={`tab ${activeTab === "camera" ? "active" : ""}`}
          onClick={() => setActiveTab("camera")}
        >
          拍照识别
        </View>
        <View
          className={`tab ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          手动输入
        </View>
      </View>

      {activeTab === "camera" && (
        <View className="tab-content">
          <Button
            type="primary"
            onClick={handleTakePhoto}
            loading={loading}
            block
          >
            📷 拍照/选图识别 ISBN
          </Button>
          {recognizedISBN && (
            <Text className="isbn-text">识别结果: {recognizedISBN}</Text>
          )}
          {message && <Text className="message">{message}</Text>}
        </View>
      )}

      {activeTab === "manual" && (
        <View className="tab-content manual-input">
          <Input
            placeholder="请输入或粘贴 ISBN"
            value={manualISBN}
            onChange={(val) => setManualISBN(val)}
            type="text"
            className="isbn-input"
            clearable
          />
          <Button
            type="primary"
            onClick={handleManualSearch}
            loading={loading}
            block
          >
            🔍 查询
          </Button>
          {message && <Text className="message">{message}</Text>}
        </View>
      )}

      <View>
        <BookList
          books={books}
          selectedIndex={selectedBookIndex}
          onSelect={setSelectedBookIndex}
        />

        <BookActionPanel
          goodCount={goodCount}
          badCount={badCount}
          onGoodCountChange={setGoodCount}
          onBadCountChange={setBadCount}
          onAdd={handleAddToReturnList}
          onResetInputs={handleResetInputs}
        />
      </View>
    </View>
  );
};

export default QueryPage;
