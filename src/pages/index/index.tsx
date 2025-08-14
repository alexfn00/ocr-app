import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { Button } from "@nutui/nutui-react-taro";

import "./index.scss";
import { RETURN_LIST } from "src/constants/storageKeys";
import { updateReturnListBadge } from "src/utils/tabbar";
import BookReturnList from "src/components/BookReturnList";

// 新类型
interface ReturnItem {
  isbn: string;
  title?: string;
  author?: string;
  price?: number;
  goodCount: number;
  badCount: number;
}

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

function isHttpUrlResponse(
  res: CloudFunctionResponse
): res is CloudFunctionResponse & { downloadUrl: string } {
  return (
    typeof res.downloadUrl === "string" && /^https?:\/\//.test(res.downloadUrl)
  );
}

export default function ReturnListPage() {
  const [copied, setCopied] = useState(false);
  const [returnList, setReturnList] = useState<ReturnItem[]>([]);
  const [generatedFileID, setGeneratedFileID] = useState<string | null>(null);

  useDidShow(() => {
    const list = Taro.getStorageSync(RETURN_LIST);
    if (Array.isArray(list)) {
      setReturnList(list);
    }
  });

  const saveReturnList = (list: ReturnItem[]) => {
    setReturnList(list);
    Taro.setStorageSync(RETURN_LIST, list);
  };

  const handleClearAll = () => {
    Taro.showModal({
      title: "确认清空退货单？",
      content: "此操作不可撤销",
      success: (res) => {
        if (res.confirm) {
          saveReturnList([]);
          updateReturnListBadge(0);
          Taro.showToast({ title: "已清空", icon: "success" });
        }
      },
    });
  };

  const generateExcel = async (
    items: { isbn: string; goodCount: number; badCount: number }[]
  ) => {
    try {
      Taro.showLoading({ title: "生成中..." });
      const res = await Taro.cloud.callFunction({
        name: "generateReturnExcel",
        data: { items },
      });

      const result = res.result as CloudFunctionResponse;
      if (!result?.success) {
        throw new Error(result?.message || "生成失败");
      }

      if (isHttpUrlResponse(result)) {
        Taro.showToast({ title: "生成成功", icon: "success" });
        return result.downloadUrl;
      }

      throw new Error("未返回有效的文件标识");
    } catch (error) {
      console.error("生成Excel失败:", error);
      Taro.showToast({
        title: error.message || "操作失败",
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
        Taro.showToast({
          title: "下载链接已复制",
          icon: "success",
          duration: 2000,
        });
      },
      fail: () => {
        setCopied(false);
        Taro.showToast({
          title: "复制失败，请重试",
          icon: "none",
        });
      },
    });
  };

  return (
    <View className="return-list-container">
      <View className="return-list-title">🧾 退货单</View>

      {returnList.length === 0 && (
        <View className="return-list-empty">
          退货单暂无数据，去查询添加吧！
        </View>
      )}
      <BookReturnList
        items={returnList}
        updateCount={(index, field, val) => {
          const newList = [...returnList];
          newList[index] = { ...newList[index], [field]: Number(val) || 0 };
          setReturnList(newList);
          Taro.setStorageSync(RETURN_LIST, newList);
        }}
        handleDelete={(index) => {
          const newList = [...returnList];
          newList.splice(index, 1);
          setReturnList(newList);
          Taro.setStorageSync(RETURN_LIST, newList);
        }}
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
          disabled={returnList.length === 0}
          onClick={async () => {
            const fileID = await generateExcel(returnList); // 返回 fileID
            if (fileID) {
              setGeneratedFileID(fileID); // 保存到 state，启用分享按钮
              Taro.showToast({ title: "生成成功", icon: "success" });
            }
          }}
        >
          生成退货单
        </Button>
        <Button
          type="success"
          style={{ flex: 1 }}
          disabled={!generatedFileID}
          onClick={() => {
            if (!generatedFileID) return;
            copyDownloadUrl(generatedFileID);
          }}
        >
          复制下载链接
        </Button>
      </View>

      <View className="return-list-actions">
        {copied && (
          <Text className="message">链接已复制，请打开浏览器粘贴访问下载</Text>
        )}
        <Button
          type="default"
          block
          disabled={returnList.length === 0}
          onClick={handleClearAll}
          className="clear-btn"
        >
          清空退货单
        </Button>
      </View>
    </View>
  );
}
