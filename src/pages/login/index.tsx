import { useState } from "react";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Input, Button, CellGroup, Cell } from "@nutui/nutui-react-taro";
import "./index.scss";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: "请输入手机号和密码", icon: "none" });
      return;
    }

    Taro.showLoading({ title: "登录中..." });

    try {
      const res = await Taro.cloud.callFunction({
        name: "loginWithPhone",
        data: { phone, password },
      });

      const result = res.result as {
        success: boolean;
        message: string;
        user?: any;
        needBindOpenid?: boolean;
      };

      Taro.hideLoading();

      if (!result.success) {
        Taro.showToast({ title: result.message, icon: "none", duration: 3000 });
        return;
      }

      if (result.needBindOpenid) {
        Taro.showModal({
          title: "绑定微信账号",
          content: "需要授权绑定微信账号以确保账号唯一性，是否继续？",
          confirmText: "授权绑定",
          cancelText: "暂不绑定",
          success: (modalRes) => {
            if (modalRes.confirm) {
              bindOpenid(result.user);
            } else {
              Taro.setStorageSync("userInfo", result.user);
              Taro.showToast({ title: "未绑定微信，已登录", icon: "none" });
              Taro.switchTab({ url: "/pages/index/index" });
            }
          },
        });
      } else {
        Taro.setStorageSync("userInfo", result.user);
        Taro.showToast({ title: "登录成功", icon: "success" });
        setTimeout(() => {
          Taro.switchTab({ url: "/pages/index/index" });
        }, 1500);
      }
    } catch (err) {
      console.error("登录失败", err);
      Taro.hideLoading();
      Taro.showToast({ title: "登录失败", icon: "none" });
    }
  };

  const bindOpenid = (user: any) => {
    Taro.getUserProfile({
      desc: "绑定微信账号",
      success: async (res) => {
        const userInfo = res.userInfo;

        Taro.showLoading({ title: "绑定中..." });

        try {
          const bindRes = await Taro.cloud.callFunction({
            name: "bindOpenid",
            data: {
              userId: user._id,
              avatarUrl: userInfo.avatarUrl,
              nickname: userInfo.nickName,
            },
          });

          Taro.hideLoading();

          const bindResult = bindRes.result as {
            success: boolean;
            user?: any;
            message?: string;
          };

          if (bindResult.success) {
            Taro.setStorageSync("userInfo", bindResult.user);
            Taro.showToast({ title: "绑定成功，登录完成", icon: "success" });
            setTimeout(() => {
              Taro.switchTab({ url: "/pages/index/index" });
            }, 1500);
          } else {
            Taro.showToast({
              title: bindResult.message || "绑定失败",
              icon: "none",
            });
          }
        } catch (error) {
          console.error("绑定异常", error);
          Taro.hideLoading();
          Taro.showToast({ title: "绑定失败", icon: "none" });
        }
      },
      fail: () => {
        Taro.showToast({ title: "用户未授权", icon: "none" });
      },
    });
  };

  return (
    <View className="login-page">
      <CellGroup>
        <Cell title="手机号" />
        <Input
          type="number"
          placeholder="请输入手机号"
          value={phone}
          onChange={(val) => setPhone(val)}
        />
        <Cell title="密码" />
        <Input
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(val) => setPassword(val)}
        />
      </CellGroup>

      <View style={{ padding: "16px" }}>
        <Button type="primary" block onClick={login}>
          登录
        </Button>
      </View>
    </View>
  );
}
