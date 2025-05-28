import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  message,
  Spin,
  Tag,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { ExamPublishRecord, getTeacherPublishedExams } from "../../interfaces";

const { Title } = Typography;

export function PublishedExams() {
  const [loading, setLoading] = useState(true);
  const [publishRecords, setPublishRecords] = useState<ExamPublishRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTeacherPublishedExams();
      if (res.status === 200) {
        setPublishRecords(res.data);
      }
    } catch {
      message.error("获取发布记录失败");
    } finally {
      setLoading(false);
    }
  };

  // 通过examId整理数据，将相同examId的记录归为一组
  const groupPublishRecords = () => {
    const groupedMap = new Map<
      number,
      {
        examId: number;
        examName: string;
        publishTime: string;
        classrooms: { id: number; name: string; code: string }[];
      }
    >();

    publishRecords.forEach((record) => {
      if (!record.exam) return;

      if (groupedMap.has(record.examId)) {
        const group = groupedMap.get(record.examId)!;
        if (record.classroom) {
          group.classrooms.push({
            id: record.classroom.id,
            name: record.classroom.name,
            code: record.classroom.code,
          });
        }
        // 更新最新的发布时间
        if (new Date(record.publishTime) > new Date(group.publishTime)) {
          group.publishTime = record.publishTime;
        }
      } else {
        groupedMap.set(record.examId, {
          examId: record.examId,
          examName: record.exam.name,
          publishTime: record.publishTime,
          classrooms: record.classroom
            ? [
                {
                  id: record.classroom.id,
                  name: record.classroom.name,
                  code: record.classroom.code,
                },
              ]
            : [],
        });
      }
    });

    return Array.from(groupedMap.values());
  };

  const handleViewDetails = (examId: number) => {
    navigate(`/exam-publish/${examId}`);
  };

  const columns = [
    {
      title: "试卷名称",
      dataIndex: "examName",
      key: "examName",
    },
    {
      title: "最近发布时间",
      dataIndex: "publishTime",
      key: "publishTime",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "已发布班级数",
      dataIndex: "classrooms",
      key: "classroomCount",
      render: (classrooms: any[]) => classrooms.length,
    },
    {
      title: "班级列表",
      dataIndex: "classrooms",
      key: "classrooms",
      render: (classrooms: any[]) => (
        <Space size={[0, 4]} wrap>
          {classrooms.map((classroom) => (
            <Tag key={classroom.id} color="blue">
              {classroom.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record.examId)}
        >
          查看详情
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
    <Card title={<Title level={4}>已发布试卷列表</Title>}>
      <Table
        columns={columns}
        dataSource={groupPublishRecords()}
        rowKey="examId"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
