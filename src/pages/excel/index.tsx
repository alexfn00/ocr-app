import { useState, useEffect } from "react";
import Taro, { useReachBottom } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { Button } from "@nutui/nutui-react-taro";

import "./index.scss";

interface ExcelFile {
  _id: string;
  fileName: string;
  fileID: string;
  downloadUrl: string;
  createdAt: number;
}

interface GetExcelListResult {
  success: boolean;
  data?: ExcelFile[];
  message?: string;
}

export default function MyExcelListPage() {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExcelList(1, true);
  }, []);

  // 监听页面触底事件
  useReachBottom(() => {
    if (!loading && hasMore) {
      fetchExcelList(pageNum + 1);
    }
  });

  const fetchExcelList = async (page: number, reset = false) => {
    try {
      setLoading(true);
      if (page === 1) {
        Taro.showLoading({ title: "加载中..." });
      }

      const userInfo = Taro.getStorageSync("userInfo");
      const res = await Taro.cloud.callFunction({
        name: "getExcelList",
        data: {
          page,
          pageSize,
          userId: userInfo?._id || "",
        },
      });
      const result = res.result as GetExcelListResult;

      if (result.success && result.data) {
        const newFiles = result.data;
        if (reset) {
          setFiles(newFiles);
        } else {
          setFiles((prev) => [...prev, ...newFiles]);
        }

        // 判断是否还有更多数据
        if (newFiles.length < pageSize) {
          setHasMore(false);
        } else {
          setPageNum(page);
          setHasMore(true);
        }
      } else {
        Taro.showToast({ title: result.message || "加载失败", icon: "none" });
      }
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: "云函数调用失败", icon: "none" });
    } finally {
      setLoading(false);
      Taro.hideLoading();
    }
  };

  const copyDownloadUrl = (url: string) => {
    Taro.setClipboardData({ data: url });
  };

  const getFileNameFromUrl = (fileUrl: string): string => {
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      const parts = pathname.split("/");
      return parts[parts.length - 1];
    } catch {
      const match = fileUrl.match(/\/([^\/?#]+)(?:[?#]|$)/);
      return match ? match[1] : fileUrl;
    }
  };

  const deleteFileRecord = async (recordId: string, fileID: string) => {
    try {
      const res = await Taro.cloud.callFunction({
        name: "deleteExcelRecord",
        data: { recordId, fileID },
      });
      const result = res.result as { success: boolean; message?: string };
      if (result.success) {
        setFiles((prev) => prev.filter((f) => f._id !== recordId));
        Taro.showToast({ title: "删除成功", icon: "success" });
      } else {
        Taro.showToast({ title: result.message || "删除失败", icon: "none" });
      }
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: "云函数调用失败", icon: "none" });
    }
  };

  return (
    <View className="excel-list-container">
      <View className="excel-list-title">📄 历史生成文件</View>

      {files.length > 0 &&
        files.map((file, index) => (
          <View key={index} className="excel-list-item">
            <Text className="file-name">
              {getFileNameFromUrl(file.downloadUrl)}
            </Text>
            <Text className="file-date">
              {new Date(file.createdAt).toLocaleString()}
            </Text>
            <View className="item-actions">
              <Button
                type="default"
                size="small"
                onClick={() => copyDownloadUrl(file.downloadUrl)}
              >
                复制链接
              </Button>
              <Button
                type="warning"
                size="small"
                onClick={() => deleteFileRecord(file._id, file.fileID)}
                style={{ marginLeft: "8px" }}
              >
                删除
              </Button>
            </View>
          </View>
        ))}

      {/* 底部加载状态 */}
      <View className="load-more">
        {loading ? (
          <Text>加载中...</Text>
        ) : !hasMore ? (
          <Text>没有更多数据了</Text>
        ) : null}
      </View>
    </View>
  );
}
