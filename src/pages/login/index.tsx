import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { Input, Button } from "@nutui/nutui-react-taro";
import logoImg from "../../assets/logo.png";
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

      // 必须绑定微信账号
      if (result.needBindOpenid) {
        Taro.showModal({
          title: "绑定微信账号",
          content: "需要授权绑定微信账号才能使用系统，是否继续？",
          confirmText: "立即绑定",
          cancelText: "取消",
          showCancel: true,
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 用户选择绑定
              bindOpenid(result.user);
            } else {
              // 用户选择取消
              Taro.showToast({
                title: "必须绑定微信账号才能使用系统",
                icon: "none",
                duration: 3000,
              });
              // 可选：保持在登录页，或者清空本地信息
              Taro.removeStorageSync("userInfo");
            }
          },
        });
      } else {
        // 已绑定直接登录
        Taro.setStorageSync("userInfo", result.user);
        Taro.showToast({ title: "登录成功", icon: "success" });
        setTimeout(() => {
          Taro.switchTab({ url: "/pages/query/index" });
        }, 1500);
      }
    } catch (err) {
      console.error("登录失败", err);
      Taro.hideLoading();
      Taro.showToast({ title: "登录失败", icon: "none" });
    }
  };

  const bindOpenid = (user: any) => {
    Taro.showLoading({ title: "绑定中..." });
    Taro.getUserProfile({
      desc: "绑定微信账号",
      success: async (res) => {
        const userInfo = res.userInfo;
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
              Taro.switchTab({ url: "/pages/query/index" });
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
      <View className="login-card">
        <View className="logo-wrapper">
          <Image src={logoImg} className="logo" />
        </View>
        <Text className="login-title">用户登录</Text>

        {/* 手机号 */}
        <View className="input-group">
          <Text className="input-label">手机号</Text>
          <Input
            className="input-field"
            type="number"
            placeholder="请输入手机号"
            value={phone}
            maxLength={11}
            onChange={(val) => setPhone(val)}
          />
        </View>

        {/* 密码 */}
        <View className="input-group">
          <Text className="input-label">密码</Text>
          <Input
            className="input-field"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(val) => setPassword(val)}
          />
        </View>

        {/* 登录按钮 */}
        <Button className="login-btn" type="primary" block onClick={login}>
          登录
        </Button>
      </View>
    </View>
  );
}
