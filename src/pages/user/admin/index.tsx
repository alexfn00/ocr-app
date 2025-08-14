import { useEffect, useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, ScrollView, Text } from "@tarojs/components";
import {
  Cell,
  CellGroup,
  Button,
  PickerOption,
  Swipe,
} from "@nutui/nutui-react-taro";
import "./index.scss";

interface User {
  _id: string;
  phone: string;
  company: string;
  role: string;
  password?: string;
  openid?: string | null;
}

interface CloudFunctionResult {
  success: boolean;
  message?: string;
  data?: any;
  total?: number;
}

const roleOptions: PickerOption[] = [
  { text: "普通用户", value: "user" },
  { text: "管理员", value: "admin" },
];

export default function UserAdminPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const userInfo = Taro.getStorageSync("userInfo");
    if (userInfo && userInfo._id) {
      setCurrentUserId(userInfo._id);
    }
  }, []);

  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: "getUsers",
        data: { page: pageNum, pageSize },
      });
      const result = res.result as CloudFunctionResult;
      if (result.success) {
        if (pageNum === 1) {
          setUsers(result.data || []);
        } else {
          setUsers((prev) => [...prev, ...(result.data || [])]);
        }
        setTotal(result.total || 0);
        setPage(pageNum);
      } else {
        Taro.showToast({
          title: result.message || "获取用户列表失败",
          icon: "none",
        });
      }
    } catch (err) {
      Taro.showToast({
        title: "请求异常",
        icon: "none",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const onScrollToLower = () => {
    if (users.length < total && !loading) {
      fetchUsers(page + 1);
    }
  };

  const handleAddUser = () => {
    Taro.navigateTo({
      url: `/pages/user-edit/index`,
    });
  };

  const handleEditUser = (user: User) => {
    Taro.navigateTo({
      url: `/pages/user-edit/index?id=${user._id}`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除该用户吗？",
      success: async (res) => {
        if (res.confirm) {
          try {
            const cloudRes = await Taro.cloud.callFunction({
              name: "deleteUser",
              data: { id: userId },
            });

            const result = cloudRes.result as CloudFunctionResult;
            if (result.success) {
              Taro.showToast({
                title: "删除成功",
                icon: "success",
              });
              fetchUsers(1);
            } else {
              Taro.showToast({
                title: result.message || "删除失败",
                icon: "none",
              });
            }
          } catch (err) {
            Taro.showToast({
              title: "请求异常",
              icon: "none",
            });
            console.error(err);
          }
        }
      },
    });
  };

  useDidShow(() => {
    fetchUsers(1);
  });

  return (
    <View className="user-admin-page">
      <View className="header">
        <Text className="title">用户管理</Text>
        <View className="actions">
          <Button type="primary" size="small" onClick={() => fetchUsers(1)}>
            刷新
          </Button>
          <Button type="primary" size="small" onClick={handleAddUser}>
            添加用户
          </Button>
        </View>
      </View>

      <ScrollView
        style={{ height: "calc(100vh - 100px)" }}
        scrollY
        onScrollToLower={onScrollToLower}
        lowerThreshold={50}
      >
        <CellGroup>
          {users.length === 0 && !loading && <Text>暂无用户</Text>}

          {users.map((user) => (
            <Swipe
              key={user._id}
              rightAction={
                user._id !== currentUserId ? (
                  <Button
                    type="danger"
                    size="small"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    删除
                  </Button>
                ) : null
              }
            >
              <Cell
                title={user.phone}
                description={
                  <View style={{ whiteSpace: "nowrap" }}>
                    公司：{user.company}　角色：
                    {roleOptions.find((r) => r.value === user.role)?.text}　
                    {user.openid ? "已绑定微信" : "未绑定微信"}
                  </View>
                }
                onClick={() => handleEditUser(user)}
              />
            </Swipe>
          ))}
        </CellGroup>

        {loading && <Text className="loading-text">加载中...</Text>}
      </ScrollView>
    </View>
  );
}