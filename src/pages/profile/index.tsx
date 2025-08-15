import { useEffect, useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { ArrowRight } from "@nutui/icons-react-taro";
import { Cell, CellGroup, Button } from "@nutui/nutui-react-taro";
import "./index.scss";

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useDidShow(() => {
    const user = Taro.getStorageSync("userInfo");
    if (!user) {
      console.log("用户信息未找到，跳转到登录页面");
      Taro.redirectTo({ url: "/pages/login/index" });
      // Taro.showToast({ title: "请先登录", icon: "none" });
    } else {
      console.log("用户信息加载成功", user);
      Taro.setNavigationBarTitle({ title: "个人中心" });
      setUserInfo(user);
    }
  });

  const handleLogout = () => {
    Taro.showModal({
      title: "确认退出",
      content: "您确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync("userInfo");
          Taro.showToast({ title: "已退出登录", icon: "none" });
          Taro.redirectTo({ url: "/pages/login/index" });
        }
      },
    });
  };

  const handleUnbind = () => {
    Taro.showModal({
      title: "解绑微信账号",
      content: "解绑后需要重新绑定才能使用系统，确定解绑吗？",
      confirmText: "确认解绑",
      showCancel: true,
      success: async (res) => {
        if (res.confirm) {
          try {
            Taro.showLoading({ title: "解绑中..." });

            // 定义云函数返回类型
            interface UnbindResult {
              success: boolean;
              message: string;
            }

            const unbindRes = await Taro.cloud.callFunction({
              name: "unbindOpenid",
              data: {},
            });

            const result = unbindRes.result as UnbindResult;

            Taro.hideLoading();

            if (result.success) {
              Taro.removeStorageSync("userInfo");
              Taro.showToast({ title: "解绑成功，请重新登录", icon: "none" });
              Taro.redirectTo({ url: "/pages/login/index" });
            } else {
              Taro.showToast({
                title: result.message || "解绑失败",
                icon: "none",
              });
            }
          } catch (err) {
            console.error("解绑失败", err);
            Taro.hideLoading();
            Taro.showToast({ title: "解绑失败", icon: "none" });
          }
        }
      },
    });
  };

  if (!userInfo) {
    console.log("用户信息未加载");
    return null;
  }

  return (
    <View className="profile-page">
      <View className="profile-header">
        <Image
          className="avatar"
          src={userInfo.avatarUrl || "/assets/default-avatar.png"}
        />
        <Text className="nickname">{userInfo.nickname || "微信用户"}</Text>
      </View>

      <CellGroup>
        <Cell title="手机号" extra={userInfo.phone || "未绑定"} />
        {userInfo.role === "admin" && (
          <Cell
            title="用户管理"
            extra={<ArrowRight />}
            onClick={() => Taro.navigateTo({ url: "/pages/user/admin/index" })}
          />
        )}
        <Cell
          title="Excel文件管理"
          extra={<ArrowRight />}
          onClick={() => Taro.navigateTo({ url: "/pages/excel/index" })}
        />
      </CellGroup>

      <View style={{ padding: "16px" }}>
        <Button type="warning" block onClick={handleUnbind}>
          解绑微信账号
        </Button>
        <Button
          type="danger"
          block
          onClick={handleLogout}
          style={{ marginTop: "10px" }}
        >
          退出登录
        </Button>
      </View>
    </View>
  );
}
