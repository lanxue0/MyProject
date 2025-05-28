import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from "antd";
import {
  getAdminUsers,
  updateAdminUser,
  UpdateUserDto,
} from "../../../interfaces";

interface User {
  id: number;
  username: string;
  email: string;
  createTime: string;
  updateTime: string;
  profile: {
    id: number;
    gender: string;
    birthDate: string | null;
    userType: string;
    bio: string | null;
    region: string | null;
    userId: number;
  };
}

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, pageSize });
      setUsers(res.data.data);
      setPagination({
        ...pagination,
        current: res.data.pagination.current,
        total: res.data.pagination.total,
      });
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const showEditModal = (user: User) => {
    setCurrentUser(user);
    form.setFieldsValue({
      gender: user.profile.gender,
      userType: user.profile.userType,
      bio: user.profile.bio,
      region: user.profile.region,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (currentUser) {
        await updateAdminUser(currentUser.id, values as UpdateUserDto);
        message.success("更新用户信息成功");
        setIsModalOpen(false);
        form.resetFields();
        fetchUsers(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error("Failed to update user", error);
      message.error("更新用户信息失败");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "性别",
      dataIndex: ["profile", "gender"],
      key: "gender",
    },
    {
      title: "用户类型",
      dataIndex: ["profile", "userType"],
      key: "userType",
      render: (text: string) => (
        <span style={{ color: text === "ADMIN" ? "#1890ff" : "inherit" }}>
          {text === "STUDENT"
            ? "学生"
            : text === "TEACHER"
            ? "教师"
            : "普通用户"}
        </span>
      ),
    },
    {
      title: "注册时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="primary" onClick={() => showEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户管理</h2>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        title="编辑用户信息"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="男">男</Select.Option>
              <Select.Option value="女">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="userType"
            label="用户类型"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="NORMAL">普通用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="region" label="地区">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
