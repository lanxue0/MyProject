import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  Typography,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Tabs,
  Empty,
  Popconfirm,
  Row,
  Col,
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  EyeOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  Classroom,
  getStudentClassrooms,
  findClassroomByCode,
  joinClassroom,
  leaveClassroom,
} from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export function StudentClassroom() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundClassroom, setFoundClassroom] = useState<Classroom | null>(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [form] = Form.useForm();
  const messageApi = getMessageApi();

  // 获取已加入的班级列表
  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await getStudentClassrooms();
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

  // 搜索班级
  const handleSearch = async () => {
    if (!searchCode || searchCode.length !== 6) {
      messageApi?.error("请输入6位班级代码");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await findClassroomByCode(searchCode);
      if (res.status === 200) {
        setFoundClassroom(res.data);
        setIsSearchModalVisible(true);
      }
    } catch (e: any) {
      messageApi?.error(
        e.response.data.message || "未找到班级，请检查班级代码"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // 加入班级
  const handleJoin = async () => {
    if (!foundClassroom) return;

    try {
      const res = await joinClassroom({ code: foundClassroom.code });
      if (res.status === 200 || res.status === 201) {
        messageApi?.success("成功加入班级");
        setIsSearchModalVisible(false);
        fetchClassrooms();
      }
    } catch (e: any) {
      if (e.response?.status === 400) {
        messageApi?.warning("您已加入该班级");
      } else {
        messageApi?.error("加入班级失败");
      }
    }
  };

  // 退出班级
  const handleLeave = async (classroomId: number) => {
    try {
      const res = await leaveClassroom(classroomId);
      if (res.status === 200) {
        messageApi?.success("已退出班级");
        fetchClassrooms();
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "退出班级失败");
    }
  };

  // 查看班级详情
  const showClassroomDetail = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setDetailModalVisible(true);
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
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "教师",
      dataIndex: "creator",
      key: "creator",
      render: (creator: any) => creator?.username || "未知",
    },
    {
      title: "学生数量",
      dataIndex: "studentCount",
      key: "studentCount",
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
      render: (_: any, record: Classroom) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showClassroomDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要退出该班级吗？"
            onConfirm={() => handleLeave(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<LogoutOutlined />} size="small">
              退出
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4}>我的班级</Title>}
        extra={
          <Space>
            <Input
              placeholder="输入6位班级代码"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              maxLength={6}
              style={{ width: 150 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={searchLoading}
              onClick={handleSearch}
            >
              搜索班级
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="joinedClassrooms">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                已加入的班级
              </span>
            }
            key="joinedClassrooms"
          >
            {classrooms.length > 0 ? (
              <Table
                columns={columns}
                dataSource={classrooms}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty
                description="您还没有加入任何班级"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Paragraph>
                  可以通过右上角搜索框输入6位班级代码来搜索并加入班级
                </Paragraph>
              </Empty>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 搜索结果模态框 */}
      <Modal
        title="加入班级"
        open={isSearchModalVisible}
        onOk={handleJoin}
        onCancel={() => setIsSearchModalVisible(false)}
        okText="加入班级"
        cancelText="取消"
      >
        {foundClassroom && (
          <div>
            <p>
              <strong>班级名称:</strong> {foundClassroom.name}
            </p>
            <p>
              <strong>班级代码:</strong>{" "}
              <Tag color="blue">{foundClassroom.code}</Tag>
            </p>
            <p>
              <strong>教师:</strong> {foundClassroom.creator?.username}
            </p>
            <p>
              <strong>学生数量:</strong> {foundClassroom.studentCount}
            </p>
            {foundClassroom.description && (
              <p>
                <strong>班级描述:</strong> {foundClassroom.description}
              </p>
            )}
            <p>是否加入该班级？</p>
          </div>
        )}
      </Modal>

      {/* 班级详情模态框 */}
      <Modal
        title="班级详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedClassroom && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4}>{selectedClassroom.name}</Title>
            </Col>
            <Col span={24}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="班级代码">
                  <Tag color="blue">{selectedClassroom.code}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="教师">
                  {selectedClassroom.creator?.username}
                </Descriptions.Item>
                <Descriptions.Item label="学生数量">
                  {selectedClassroom.studentCount}
                </Descriptions.Item>
                <Descriptions.Item label="加入时间">
                  {selectedClassroom.joinTime &&
                    new Date(selectedClassroom.joinTime).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="班级描述" span={2}>
                  {selectedClassroom.description || "无描述"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={24} style={{ textAlign: "right" }}>
              <Popconfirm
                title="确定要退出该班级吗？"
                onConfirm={() => {
                  handleLeave(selectedClassroom.id);
                  setDetailModalVisible(false);
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<LogoutOutlined />}>
                  退出班级
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
