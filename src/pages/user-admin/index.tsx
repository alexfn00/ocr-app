import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, ScrollView, Text } from "@tarojs/components";
import { Cell, CellGroup, Button, Toast } from "@nutui/nutui-react-taro";
import "./index.scss";

interface User {
  _id: string;
  phone: string;
  nickname: string;
  role: string;
  openid?: string | null;
}

export default function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: "getUsers",
        data: { page: pageNum, pageSize },
      });

      if (res.result.success) {
        if (pageNum === 1) {
          setUsers(res.result.data);
        } else {
          setUsers((prev) => [...prev, ...res.result.data]);
        }
        setTotal(res.result.total);
        setPage(pageNum);
      } else {
        Toast.fail(res.result.message || "获取用户列表失败");
      }
    } catch (err) {
      Toast.fail("请求异常");
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

  return (
    <View className="user-admin-page">
      <View className="header">
        <Text className="title">用户管理</Text>
        <Button type="primary" size="small" onClick={() => fetchUsers(1)}>
          刷新
        </Button>
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
            <Cell
              key={user._id}
              title={user.nickname || "无昵称"}
              description={`手机号：${user.phone} 角色：${user.role} ${
                user.openid ? "已绑定微信" : "未绑定微信"
              }`}
            />
          ))}
        </CellGroup>

        {loading && <Text className="loading-text">加载中...</Text>}
      </ScrollView>
    </View>
  );
}
