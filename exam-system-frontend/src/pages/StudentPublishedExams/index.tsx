import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Spin,
  Tag,
  Select,
  Input,
} from "antd";
import { SearchOutlined, ReadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { ExamPublishRecord, getStudentPublishedExams } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

const { Title } = Typography;
const { Option } = Select;

interface EnhancedExamPublishRecord extends ExamPublishRecord {
  teacherName?: string;
}

export function StudentPublishedExams() {
  const [loading, setLoading] = useState(true);
  const [publishRecords, setPublishRecords] = useState<
    EnhancedExamPublishRecord[]
  >([]);
  const [filteredRecords, setFilteredRecords] = useState<
    EnhancedExamPublishRecord[]
  >([]);
  const [classrooms, setClassrooms] = useState<{ id: number; name: string }[]>(
    []
  );
  const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(
    null
  );
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const messageApi = getMessageApi();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [publishRecords, selectedClassroom, selectedTeacher, searchText]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getStudentPublishedExams();
      if (res.status === 200) {
        const records = res.data;
        setPublishRecords(records);

        // Extract unique classrooms and teachers
        const uniqueClassrooms = new Map();
        const uniqueTeachers = new Map();

        records.forEach((record) => {
          if (record.classroom) {
            uniqueClassrooms.set(record.classroom.id, {
              id: record.classroom.id,
              name: record.classroom.name,
            });
          }

          if (record.exam?.createUser) {
            uniqueTeachers.set(record.exam.createUser.id, {
              id: record.exam.createUser.id,
              name: record.exam.createUser.username,
            });
          }
        });

        setClassrooms(Array.from(uniqueClassrooms.values()));
        setTeachers(Array.from(uniqueTeachers.values()));
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "获取发布试卷失败");
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...publishRecords];

    // Filter by classroom
    if (selectedClassroom !== null) {
      filtered = filtered.filter(
        (record) =>
          record.classroom && record.classroom.id === selectedClassroom
      );
    }

    // Filter by teacher
    if (selectedTeacher !== null) {
      filtered = filtered.filter(
        (record) =>
          record.exam?.createUser &&
          record.exam.createUser.id === selectedTeacher
      );
    }

    // Filter by search text
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          (record.exam?.name &&
            record.exam.name.toLowerCase().includes(lowerCaseSearch)) ||
          (record.classroom?.name &&
            record.classroom.name.toLowerCase().includes(lowerCaseSearch))
      );
    }

    setFilteredRecords(filtered);
  };

  const handleResetFilters = () => {
    setSelectedClassroom(null);
    setSelectedTeacher(null);
    setSearchText("");
  };

  const handleExamClick = (examId: number) => {
    navigate(`/exam/${examId}`);
  };

  const columns = [
    {
      title: "试卷名称",
      dataIndex: ["exam", "name"],
      key: "examName",
      render: (text: string, record: EnhancedExamPublishRecord) => (
        <Button type="link" onClick={() => handleExamClick(record.examId)}>
          {text}
        </Button>
      ),
    },
    {
      title: "发布班级",
      dataIndex: ["classroom", "name"],
      key: "classroomName",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "发布老师",
      dataIndex: ["exam", "createUser", "username"],
      key: "teacherName",
      render: (text: string) => <span>{text || "未知"}</span>,
    },
    {
      title: "发布时间",
      dataIndex: "publishTime",
      key: "publishTime",
      render: (time: string) => new Date(time).toLocaleString(),
      sorter: (a: EnhancedExamPublishRecord, b: EnhancedExamPublishRecord) =>
        new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: EnhancedExamPublishRecord) => (
        <Button
          type="primary"
          icon={<ReadOutlined />}
          onClick={() => handleExamClick(record.examId)}
        >
          开始考试
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card title={<Title level={4}>我的考试列表</Title>}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space wrap>
          <Input
            placeholder="搜索试卷名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />

          <Select
            placeholder="选择班级"
            style={{ width: 200 }}
            value={selectedClassroom}
            onChange={(value) => setSelectedClassroom(value)}
            allowClear
          >
            {classrooms.map((classroom) => (
              <Option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="选择教师"
            style={{ width: 200 }}
            value={selectedTeacher}
            onChange={(value) => setSelectedTeacher(value)}
            allowClear
          >
            {teachers.map((teacher) => (
              <Option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </Option>
            ))}
          </Select>

          <Button onClick={handleResetFilters}>重置筛选</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </Card>
  );
}
