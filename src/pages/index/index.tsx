import React, { useState } from "react";
import Taro from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import {
  Button,
  ConfigProvider,
  TextArea,
  Dialog,
  Input,
  Card,
  InputNumber,
} from "@nutui/nutui-react-taro";

import "./index.scss";
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

  return (
    <View className="container">
      <View className="title">📚 图书订单处理小工具</View>

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
          <View className="input-group">
            <Text>好书数量：</Text>
            <Input
              type="number"
              placeholder="请输入好书数量"
              value={String(goodCount)}
              onChange={(val) => {
                if (/^\d*$/.test(val)) {
                  setGoodCount(val);
                }
              }}
            />
          </View>
          <View className="input-group">
            <Text>残书数量：</Text>
            <Input
              type="number"
              placeholder="请输入残书数量"
              value={String(badCount)}
              onChange={(val) => {
                if (/^\d*$/.test(val)) {
                  setBadCount(val);
                }
              }}
            />
          </View>
          <Button
            type="primary"
            block
            onClick={() => {
              if (!goodCount && !badCount) {
                Taro.showToast({
                  title: "请输入数量",
                  icon: "error",
                });
                return;
              }
              const book = books[selectedBookIndex];
              const item = {
                title: book.书名,
                author: book.作者,
                isbn: book.ISBN,
                normalCount: goodCount,
                damagedCount: badCount,
              };
              setReturnList([...returnList, item]);
              setSelectedBookIndex(null);
              setGoodCount("");
              setBadCount("");
              Taro.showToast({
                title: "添加成功",
                icon: "success",
              });
            }}
          >
            添加到退货单
          </Button>
        </View>
      )}
    </View>
  );
}

export default Index;
