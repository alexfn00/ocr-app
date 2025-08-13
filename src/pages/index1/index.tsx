import { useState } from "react";
import Taro from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import { Button, Input } from "@nutui/nutui-react-taro";

import "./index.scss";
import { useAuthGuard } from "src/hooks/useAuthGuard";

const NumberInput = ({ label, placeholder, value, onChange }) => (
  <View className="input-group">
    <Text>{label}</Text>
    <Input
      type="number"
      placeholder={placeholder}
      value={String(value)}
      onChange={(val) => {
        if (/^\d*$/.test(val)) {
          onChange(val);
        }
      }}
    />
  </View>
);

function Index() {
  const [text, setText] = useState("");
  const [isbnInput, setIsbnInput] = useState("978-7-5086-7635");
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(
    null
  );
  const [goodCount, setGoodCount] = useState("");
  const [badCount, setBadCount] = useState("");
  const [returnList, setReturnList] = useState<any[]>([]);

  useAuthGuard();
  const handleOcrClick = () => {
    Taro.showModal({
      title: "图片识别说明",
      content: "请选择图书封底或封面的照片，以识别ISBN号。",
      confirmText: "开始识别",
      success: (res) => {
        if (res.confirm) {
          handleOcr(); // 真正执行 OCR 操作
        }
      },
    });
  };

  const handleOcr = () => {
    Taro.chooseImage({
      count: 1,
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        Taro.getFileSystemManager().readFile({
          filePath,
          encoding: "base64",
          success: async (data) => {
            const result = await Taro.cloud.callFunction({
              name: "ocr",
              data: {
                imageBase64: data.data,
              },
            });
            if (result.result && typeof result.result === "object") {
              const { formatted, digits } = result.result.isbn;
              setText(formatted || "");
              if (digits) {
                // searchByIsbn(formatted);
              } else {
                // Taro.atMessage({ message: "未识别到 ISBN", type: "warning" });
                setText("");
              }
            } else {
              // Taro.atMessage({ message: "OCR 失败", type: "error" });
              setText("");
            }
          },
        });
      },
    });
  };

  const searchByIsbn = async (isbn: string) => {
    console.log("searchByIsbn", isbn);
    if (!isbn) {
      Taro.showToast({
        title: "请输入 ISBN",
        icon: "none",
      });
      return;
    }

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
          Taro.showToast({ title: "已自动选中唯一匹配图书", icon: "success" });
        } else if (data.length > 1) {
          setSelectedBookIndex(null);
          Taro.showToast({ title: "找到多本，请手动选择", icon: "none" });
        } else {
          Taro.showToast({ title: "未找到图书", icon: "none" });
        }
        // Taro.showToast({ title: "查询成功", icon: "success" });
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("查询异常:", err);
    } finally {
      Taro.hideLoading();
    }
  };

  interface CloudFunctionResponse {
    success: boolean;
    message?: string;

    /**
     * 云文件ID（cloud:// 开头），优先级高于 downloadUrl
     * @example "cloud://prod-7g1d2.7072-prod/file.xlsx"
     */
    fileID?: string;

    /**
     * 兼容旧版的HTTP下载链接（当fileID不存在时使用）
     * @deprecated 建议迁移到fileID方式
     */
    downloadUrl?: string;
  }

  // 类型守卫方法
  function isCloudFileResponse(
    res: CloudFunctionResponse
  ): res is CloudFunctionResponse & { fileID: string } {
    return typeof res.fileID === "string" && res.fileID.startsWith("cloud://");
  }

  function isHttpUrlResponse(
    res: CloudFunctionResponse
  ): res is CloudFunctionResponse & { downloadUrl: string } {
    return (
      typeof res.downloadUrl === "string" &&
      /^https?:\/\//.test(res.downloadUrl)
    );
  }

  // 更新后的函数实现
  const generateExcel = async (
    items: { isbn: string; goodCount: number; badCount: number }[]
  ) => {
    try {
      const res = await Taro.cloud.callFunction({
        name: "generateReturnExcel",
        data: { items },
      });

      const result = res.result as CloudFunctionResponse;
      console.log("result", result);
      if (!result?.success) {
        throw new Error(result?.message || "生成失败");
      }

      // 优先使用fileID下载
      if (isCloudFileResponse(result)) {
        const downloadRes = await Taro.cloud.downloadFile({
          fileID: result.fileID,
        });

        await Taro.openDocument({
          filePath: downloadRes.tempFilePath,
          fileType: "xlsx",
        });
        return;
      }

      // 兼容旧版downloadUrl
      if (isHttpUrlResponse(result)) {
        const { tempFilePath } = await Taro.downloadFile({
          url: result.downloadUrl,
        });

        await Taro.openDocument({
          filePath: tempFilePath,
          fileType: "xlsx",
        });
        return;
      }

      throw new Error("未返回有效的文件标识");
    } catch (error) {
      console.error("生成Excel失败:", error);
      Taro.showToast({
        title: error.message || "操作失败",
        icon: "none",
        duration: 3000,
      });
    }
  };
  // 在组件内部定义一个函数
  const handleAddToReturnList = () => {
    if (selectedBookIndex === null) return;

    if (!goodCount && !badCount) {
      Taro.showToast({
        title: "请输入数量",
        icon: "error",
      });
      return;
    }

    const book = books[selectedBookIndex];
    const item = {
      isbn: book.ISBN,
      goodCount: goodCount,
      badCount: badCount,
    };

    setReturnList([...returnList, item]);
    setSelectedBookIndex(null);
    setGoodCount("");
    setBadCount("");

    Taro.showToast({
      title: "添加成功",
      icon: "success",
    });
  };

  const handleGenerateExcel = () => {
    if (returnList.length === 0) {
      Taro.showToast({
        title: "退货单为空，请先添加图书",
        icon: "error",
      });
      return;
    }
    // 调用生成函数
    generateExcel(returnList);

    // generateExcel([
    //   { isbn: "9787513295987", goodCount: 15, badCount: 1 },
    //   { isbn: "9787513291729", goodCount: 10, badCount: 0 },
    // ]);
  };

  return (
    <View className="container">
      <View className="title">📚 图书订单处理小工具</View>
      <Button
        type="primary"
        onClick={() => Taro.navigateTo({ url: "/pages/query/index" })}
      >
        去查询ISBN
      </Button>
      <View className="section">
        <Button type="primary" block onClick={handleOcrClick}>
          📷 拍照/选图识别 ISBN
        </Button>
        {text && <View className="recognized-isbn">✅ 已识别：{text}</View>}
      </View>

      <View className="manual-query-tip">
        🤔 如果识别失败，可在下方手动输入 ISBN 进行查询
      </View>

      <View className="isbn-input-group">
        <Input
          type="text"
          className="isbn-input"
          value={isbnInput}
          onChange={(val) => setIsbnInput(val)}
          placeholder="请输入或粘贴 ISBN 号"
        />
        <Button
          type="primary"
          block
          onClick={() => {
            searchByIsbn(isbnInput);
            setText(isbnInput);
          }}
        >
          🔍 查询
        </Button>
      </View>

      <View className="books-list">
        {books.map((book, index) => (
          <View
            key={index}
            className={`book-card ${
              selectedBookIndex === index ? "selected" : ""
            }`}
            onClick={() => setSelectedBookIndex(index)}
          >
            <View className="card-header">
              <Text className="card-title">{book.书名}</Text>
              <Text className="card-extra">{book.作者}</Text>
            </View>
            <View className="card-note">ISBN: {book.ISBN}</View>
            <View className="card-body">
              <Text>定价：{book.定价 || "暂无"}</Text>
            </View>
          </View>
        ))}
      </View>

      {selectedBookIndex !== null && (
        <View className="book-inputs">
          <NumberInput
            label="好书数量："
            placeholder="请输入好书数量"
            value={goodCount}
            onChange={setGoodCount}
          />
          <NumberInput
            label="残书数量："
            placeholder="请输入残书数量"
            value={badCount}
            onChange={setBadCount}
          />
          <Button type="primary" block onClick={handleAddToReturnList}>
            添加到退货单
          </Button>
        </View>
      )}

      <View className="section">
        <Button type="primary" block onClick={handleGenerateExcel}>
          生成文件并下载
        </Button>
      </View>
    </View>
  );
}

export default Index;
