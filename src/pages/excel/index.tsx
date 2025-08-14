import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
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

  useEffect(() => {
    fetchExcelList();
  }, []);

  const fetchExcelList = async () => {
    try {
      const res = await Taro.cloud.callFunction({
        name: "getExcelList",
      });
      const result = res.result as GetExcelListResult;
      console.log("获取Excel文件列表", result);
      if (result.success && result.data) {
        setFiles(result.data);
      } else {
        Taro.showToast({ title: result.message || "加载失败", icon: "none" });
      }
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: "云函数调用失败", icon: "none" });
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
        setFiles(files.filter((f) => f._id !== recordId));
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
      {files.length === 0 ? (
        <View className="excel-list-empty">暂无历史文件，先去生成吧！</View>
      ) : (
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
        ))
      )}
    </View>
  );
}
