import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { ArrowRight } from "@nutui/icons-react-taro";
import { Cell, CellGroup, Button } from "@nutui/nutui-react-taro";
import "./index.scss";

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const user = Taro.getStorageSync("userInfo");
    if (!user) {
      Taro.switchTab({ url: "/pages/index/index" });
      Taro.showToast({ title: "请先登录", icon: "none" });
    } else {
      setUserInfo(user);
    }
  }, []);

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

  if (!userInfo) return null;

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
            onClick={() => Taro.navigateTo({ url: "/pages/user-admin/index" })}
          />
        )}
      </CellGroup>

      <View style={{ padding: "16px" }}>
        <Button type="danger" block onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  );
}
