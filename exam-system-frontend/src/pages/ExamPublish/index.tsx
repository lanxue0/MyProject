import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Spin,
  Button,
  Table,
  Checkbox,
  Space,
  Alert,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import {
  Classroom,
  Exam,
  PublishExamDto,
  examFind,
  getExamPublishRecords,
  getTeacherClassrooms,
  getTeachingClassrooms,
  publishExamToClassrooms,
} from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

const { Title, Text } = Typography;

export function ExamPublish() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<Exam | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<number[]>(
    []
  );
  const [publishedClassroomIds, setPublishedClassroomIds] = useState<number[]>(
    []
  );
  const [publishLoading, setPublishLoading] = useState(false);
  const messageApi = getMessageApi();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // 加载试卷数据
      const examRes = await examFind(parseInt(id));
      if (examRes.status === 200) {
        setExamData(examRes.data);
      }

      // 加载教师创建的班级
      const teacherClassroomsRes = await getTeacherClassrooms();
      // 加载教师加入的班级
      const teachingClassroomsRes = await getTeachingClassrooms();

      if (
        teacherClassroomsRes.status === 200 &&
        teachingClassroomsRes.status === 200
      ) {
        const allClassrooms = [
          ...teacherClassroomsRes.data,
          ...teachingClassroomsRes.data,
        ];
        setClassrooms(allClassrooms);
      }

      // 加载已发布记录
      const publishRecordsRes = await getExamPublishRecords(parseInt(id));
      if (publishRecordsRes.status === 200) {
        const publishedIds = publishRecordsRes.data.map(
          (record) => record.classroomId
        );
        setPublishedClassroomIds(publishedIds);
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleSelectChange = (classroomId: number) => {
    setSelectedClassroomIds((prev) => {
      if (prev.includes(classroomId)) {
        return prev.filter((id) => id !== classroomId);
      } else {
        return [...prev, classroomId];
      }
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const availableClassroomIds = classrooms
        .filter((classroom) => !publishedClassroomIds.includes(classroom.id))
        .map((classroom) => classroom.id);
      setSelectedClassroomIds(availableClassroomIds);
    } else {
      setSelectedClassroomIds([]);
    }
  };

  const handlePublish = async () => {
    if (!id || selectedClassroomIds.length === 0) {
      messageApi?.warning("请选择至少一个班级");
      return;
    }

    setPublishLoading(true);
    try {
      const publishData: PublishExamDto = {
        examId: parseInt(id),
        classroomIds: selectedClassroomIds,
      };

      const res = await publishExamToClassrooms(publishData);
      if (res.status === 200 || res.status === 201) {
        messageApi?.success("试卷发布成功");
        // 刷新数据
        await fetchData();
        // 清空选择
        setSelectedClassroomIds([]);
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "发布试卷失败");
    } finally {
      setPublishLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={classrooms.every((c) =>
            publishedClassroomIds.includes(c.id)
          )}
        >
          全选
        </Checkbox>
      ),
      dataIndex: "select",
      key: "select",
      render: (_: any, record: Classroom) => {
        const isPublished = publishedClassroomIds.includes(record.id);
        return (
          <Checkbox
            checked={selectedClassroomIds.includes(record.id)}
            onChange={() => handleSelectChange(record.id)}
            disabled={isPublished}
          />
        );
      },
    },
    {
      title: "班级名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "班级代码",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "创建者",
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
      title: "状态",
      key: "status",
      render: (_: any, record: Classroom) =>
        publishedClassroomIds.includes(record.id) ? (
          <Text type="success">已发布</Text>
        ) : (
          <Text type="warning">未发布</Text>
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
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          style={{ marginBottom: 16 }}
        >
          返回试卷列表
        </Button>

        <Title level={3}>发布试卷: {examData?.name}</Title>

        {!examData?.isPublish && (
          <Alert
            message="警告"
            description="该试卷尚未发布，请先在试卷管理页面发布该试卷，再将其分配给班级。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={handlePublish}
            disabled={selectedClassroomIds.length === 0 || !examData?.isPublish}
            loading={publishLoading}
          >
            发布到所选班级
          </Button>
          <Text type="secondary">
            已选择 {selectedClassroomIds.length} 个班级，已发布到{" "}
            {publishedClassroomIds.length} 个班级
          </Text>
        </Space>

        <Table
          columns={columns}
          dataSource={classrooms}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </Card>
  );
}
