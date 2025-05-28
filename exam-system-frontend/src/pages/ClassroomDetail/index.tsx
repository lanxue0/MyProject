import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Typography,
  Table,
  Space,
  Descriptions,
  Popconfirm,
  message,
  Spin,
  Tag,
  Tooltip,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  DeleteOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { Classroom, getClassroomDetail, removeStudent } from "../../interfaces";

const { Title } = Typography;
const { TabPane } = Tabs;

interface Student {
  id: number;
  username: string;
  email: string;
  joinTime: string;
}

export function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClassroomDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await getClassroomDetail(parseInt(id));
      if (res.status === 200) {
        setClassroom(res.data);
      }
    } catch {
      message.error("获取班级详情失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomDetail();
  }, [id]);

  // 移除学生
  const handleRemoveStudent = async (studentId: number) => {
    if (!id) return;

    try {
      const res = await removeStudent(parseInt(id), studentId);
      if (res.status === 200) {
        message.success("移除学生成功");
        fetchClassroomDetail();
      }
    } catch {
      message.error("移除学生失败");
    }
  };

  // 复制班级代码
  const copyClassCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => message.success("班级代码已复制到剪贴板"))
      .catch(() => message.error("复制失败，请手动复制"));
  };

  // 返回班级列表
  const goBack = () => {
    navigate("/classroom-manage");
  };

  const studentColumns = [
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
      title: "加入时间",
      dataIndex: "joinTime",
      key: "joinTime",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Student) => (
        <Popconfirm
          title="确定要移除该学生吗？"
          onConfirm={() => handleRemoveStudent(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />} size="small">
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 教师表字段配置
  const teacherColumns = [
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
      title: "加入时间",
      dataIndex: "joinTime",
      key: "joinTime",
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Title level={4}>未找到班级</Title>
        <Button type="primary" onClick={goBack}>
          返回班级列表
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
            style={{ marginBottom: 16 }}
          >
            返回班级列表
          </Button>

          <Row>
            <Col span={24}>
              <Title level={3}>{classroom.name}</Title>
            </Col>
          </Row>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="班级代码">
              <Space>
                <Tag color="blue">{classroom.code}</Tag>
                <Tooltip title="复制班级代码">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyClassCode(classroom.code)}
                    size="small"
                  />
                </Tooltip>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(classroom.createTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="学生数量">
              {classroom.students?.length || 0}
            </Descriptions.Item>
            <Descriptions.Item label="教师数量">
              {(classroom.teachers?.length || 0) + 1}{" "}
              {/* +1 为了包括创建者教师 */}
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              {classroom.creator?.username}
            </Descriptions.Item>
            <Descriptions.Item label="班级描述" span={2}>
              {classroom.description || "无描述"}
            </Descriptions.Item>
          </Descriptions>

          <Tabs defaultActiveKey="students" style={{ marginTop: 16 }}>
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  班级学生
                </span>
              }
              key="students"
            >
              <Table
                columns={studentColumns}
                dataSource={classroom.students || []}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  班级教师
                </span>
              }
              key="teachers"
            >
              <Table
                columns={teacherColumns}
                dataSource={[
                  // 创建者教师
                  {
                    id: classroom.creator?.id,
                    username: classroom.creator?.username,
                    email: classroom.creator?.email,
                    joinTime: classroom.createTime, // 创建者加入时间是创建时间
                    isCreator: true,
                  },
                  // 其他协作教师
                  ...(classroom.teachers || []),
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  );
}
