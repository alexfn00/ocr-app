// src/pages/user-edit/index.tsx
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { Button, Input, Picker, Cell } from "@nutui/nutui-react-taro";
import type { PickerOption } from "@nutui/nutui-react-taro";
import "./index.scss";

interface User {
  _id?: string;
  phone: string;
  company: string;
  role: string;
  password?: string;
}

interface CloudFunctionResult {
  success: boolean;
  message?: string;
  data?: User | User[];
}

interface RoleOption extends PickerOption {
  value: string;
  text: string;
}

const roleOptions: RoleOption[] = [
  { text: "普通用户", value: "user" },
  { text: "管理员", value: "admin" },
];

export default function UserEdit() {
  const [user, setUser] = useState<User>({
    phone: "",
    company: "",
    role: "user", // 默认角色设为user
    password: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params as { id?: string };
    if (params?.id) {
      setIsEditMode(true);
      fetchUser(params.id);
    }
  }, []);

  const fetchUser = async (id: string) => {
    setLoading(true);
    Taro.showLoading({ title: "加载中...", mask: true }); // 显示全屏 loading
    try {
      const res = await Taro.cloud.callFunction({
        name: "getUserById",
        data: { id },
      });

      const result = res.result as CloudFunctionResult;
      if (result.success && result.data) {
        const userData = Array.isArray(result.data)
          ? result.data[0]
          : result.data;
        setUser(userData);
      }
    } catch (err) {
      Taro.showToast({ title: "获取用户失败", icon: "none" });
    } finally {
      setLoading(false);
      Taro.hideLoading(); // 隐藏全屏 loading
    }
  };

  const handleRoleSelect = () => {
    setPickerVisible(true);
  };

  const handleRoleChange = (options: PickerOption[]) => {
    const selected = options[0] as RoleOption;
    setUser((prev) => ({
      ...prev,
      role: selected.value,
    }));
    setPickerVisible(false);
  };

  const validateForm = () => {
    if (!/^1[3-9]\d{9}$/.test(user.phone)) {
      Taro.showToast({ title: "请输入正确的手机号", icon: "none" });
      return false;
    }
    if (!user.company.trim()) {
      Taro.showToast({ title: "请输入公司名称", icon: "none" });
      return false;
    }
    if ((!isEditMode || showPassword) && !user.password) {
      Taro.showToast({ title: "请输入密码", icon: "none" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const api = isEditMode ? "updateUser" : "addUser";
      const res = await Taro.cloud.callFunction({
        name: api,
        data: isEditMode
          ? {
              _id: user._id,
              company: user.company,
              role: user.role,
              ...(showPassword ? { password: user.password } : {}),
            }
          : user,
      });

      console.log("res", res);
      const result = res.result as CloudFunctionResult;
      if (result.success) {
        Taro.showToast({
          title: isEditMode ? "更新成功" : "添加成功",
          icon: "success",
        });
        setTimeout(() => Taro.navigateBack(), 1500);
      } else {
        Taro.showModal({
          title: "提示",
          content: result.message || "操作失败",
          showCancel: false,
        });
      }
    } catch (err) {
      Taro.showToast({ title: "操作失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const currentRoleText =
    roleOptions.find((r) => r.value === user.role)?.text || "请选择角色";

  return (
    <View className="user-edit-page">
      <View className="input-group">
        <Text className="input-label">手机号</Text>
        <Input
          placeholder="请输入手机号"
          value={user.phone}
          onChange={(val) => setUser({ ...user, phone: val })}
          disabled={isEditMode}
          type="number"
          maxLength={11}
        />
      </View>

      <View className="input-group">
        <Text className="input-label">公司</Text>
        <Input
          placeholder="请输入公司名称"
          value={user.company}
          onChange={(val) => setUser({ ...user, company: val })}
        />
      </View>

      {(!isEditMode || showPassword) && (
        <View className="input-group">
          <Text className="input-label">密码</Text>
          <Input
            type="password"
            placeholder="请输入密码"
            value={user.password || ""}
            onChange={(val) => setUser({ ...user, password: val })}
          />
        </View>
      )}

      <View className="input-group">
        <Text className="input-label">角色</Text>
        <Cell
          title={currentRoleText}
          onClick={handleRoleSelect}
          className="picker-trigger"
        />
        <Picker
          visible={pickerVisible}
          title="选择角色"
          options={roleOptions}
          defaultValue={[user.role]}
          onConfirm={handleRoleChange}
          onClose={() => setPickerVisible(false)}
        />
      </View>

      {isEditMode && (
        <Button
          type="default"
          onClick={() => setShowPassword(!showPassword)}
          style={{ marginBottom: "20px" }}
          block
        >
          {showPassword ? "隐藏密码字段" : "修改密码"}
        </Button>
      )}

      <Button type="primary" onClick={handleSubmit} loading={loading} block>
        {isEditMode ? "保存修改" : "创建用户"}
      </Button>
    </View>
  );
}
