import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { Button } from "@nutui/nutui-react-taro";
import { Textarea } from "@tarojs/components";

export default function UploadPage() {
  const [result, setResult] = useState("");

  // 替换showToast函数，调用Taro原生Toast
  const showToast = (msg: string, type: "success" | "fail" = "success") => {
    Taro.showToast({
      title: msg,
      icon: type === "success" ? "success" : "none",
      duration: 2000,
    });
  };

  const handleUpload = async () => {
    let loadingShown = false;

    try {
      const chooseRes = await Taro.chooseMessageFile({
        count: 1,
        type: "file",
        extension: [".xls", ".xlsx"],
      });

      const file = chooseRes.tempFiles[0];

      Taro.showLoading({ title: "上传中..." });
      loadingShown = true;

      const uploadRes = await Taro.cloud.uploadFile({
        cloudPath: `excel/${Date.now()}-${file.name}`,
        filePath: file.path,
      });

      const { fileID } = uploadRes;

      const cloudRes = await Taro.cloud.callFunction({
        name: "parseExcel",
        data: { fileID },
      });

      const resultData = cloudRes.result;

      if (
        typeof resultData === "object" &&
        resultData !== null &&
        "code" in resultData &&
        (resultData as any).code === 0
      ) {
        setResult(JSON.stringify((resultData as any).data, null, 2));
        showToast("导入成功", "success");
      } else {
        showToast((resultData as any)?.message || "导入失败", "fail");
      }
    } catch (error) {
      console.error("导入失败:", error);
      showToast("导入失败", "fail");
    } finally {
      if (loadingShown) {
        Taro.hideLoading();
      }
    }
  };

  return (
    <View className="upload-page" style={{ padding: "24px" }}>
      <View
        style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
      >
        📘 Excel 图书数据导入
      </View>

      <Button type="primary" size="large" block onClick={handleUpload}>
        上传 Excel 并解析
      </Button>

      {result && (
        <View style={{ marginTop: "24px" }}>
          <Text
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "12px",
            }}
          >
            📄 解析结果：
          </Text>
          <Textarea
            disabled
            value={result}
            style={{
              minHeight: 100,
              width: "100%",
              border: "1px solid #ccc",
              padding: "8px",
            }}
          />
        </View>
      )}
    </View>
  );
}
