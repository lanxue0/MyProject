import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Modal,
  Table,
  Typography,
  Form,
  Input,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Classroom,
  createClassroom,
  deleteClassroom,
  getTeacherClassrooms,
  updateClassroom,
} from "../../interfaces";
import { useNavigate } from "react-router";
import { getMessageApi } from "../../utils/messageInstance";

const { Title, Text } = Typography;
const { TextArea } = Input;

export function ClassroomManage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const messageApi = getMessageApi();

  // 获取班级列表
  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await getTeacherClassrooms();
      if (res.status === 200) {
        setClassrooms(res.data);
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "获取班级列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // 打开创建班级模态框
  const showCreateModal = () => {
    setIsCreateMode(true);
    setSelectedClassroom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑班级模态框
  const showEditModal = (classroom: Classroom) => {
    setIsCreateMode(false);
    setSelectedClassroom(classroom);
    form.setFieldsValue({
      name: classroom.name,
      description: classroom.description,
    });
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isCreateMode) {
        // 创建班级
        const res = await createClassroom(values);
        if (res.status === 201 || res.status === 200) {
          messageApi?.success("创建班级成功");
          fetchClassrooms();
          setIsModalVisible(false);
        }
      } else if (selectedClassroom) {
        // 更新班级
        const res = await updateClassroom(selectedClassroom.id, values);
        if (res.status === 200) {
          messageApi?.success("更新班级成功");
          fetchClassrooms();
          setIsModalVisible(false);
        }
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "操作失败，请稍后再试");
    }
  };

  // 删除班级
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteClassroom(id);
      if (res.status === 200) {
        messageApi?.success("删除班级成功");
        fetchClassrooms();
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "删除班级失败");
    }
  };

  // 复制班级代码
  const copyClassCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => messageApi?.success("班级代码已复制到剪贴板"))
      .catch(() => messageApi?.error("复制失败，请手动复制"));
  };

  // 查看班级详情
  const viewClassroomDetail = (id: number) => {
    navigate(`/classroom-detail/${id}`);
  };

  const columns = [
    {
      title: "班级名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "班级代码",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Space>
          <Text>{code}</Text>
          <Tooltip title="复制班级代码">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyClassCode(code)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "学生数量",
      dataIndex: "studentCount",
      key: "studentCount",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Classroom) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<TeamOutlined />}
            onClick={() => viewClassroomDetail(record.id)}
          >
            查看详情
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个班级吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4}>班级管理</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            创建班级
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={classrooms}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isCreateMode ? "创建班级" : "编辑班级"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="班级名称"
            rules={[
              { required: true, message: "请输入班级名称" },
              { min: 2, max: 100, message: "班级名称长度需在2-100个字符之间" },
            ]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item name="description" label="班级描述">
            <TextArea rows={4} placeholder="请输入班级描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
