import React, { useEffect, useState } from "react";
import { Table, Tag, Button } from "antd";
import { useNavigate } from "react-router";
import type { ColumnsType } from "antd/es/table";
import { getMessageApi } from "../../utils/messageInstance";
import { pendingAnswerList } from "../../interfaces";

interface Answer {
  id: number;
  exam: {
    name: string;
  };
  answerer: {
    username: string;
  };
  createTime: string;
  isGraded: boolean;
}

const AnswerList: React.FC = () => {
  const messageApi = getMessageApi();
  const [answers, setAnswers] = useState<Array<Answer>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const query = async () => {
    try {
      setLoading(true);
      const res = await pendingAnswerList();

      if (res.status === 200 || res.status === 201) {
        messageApi?.success("获取答卷成功");
        setAnswers(res.data);
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "获取答卷失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    query();
  }, []);

  const columns: ColumnsType<Answer> = [
    {
      title: "试卷",
      dataIndex: "exam",
      key: "examName",
      render: (exam: { name: string }) => exam.name,
    },
    {
      title: "答题人",
      dataIndex: "answerer",
      key: "student",
      render: (answerer: { username: string }) => answerer.username,
    },
    {
      title: "提交时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "状态",
      dataIndex: "isGraded",
      key: "status",
      render: (isGraded: boolean) => (
        <Tag color={isGraded ? "green" : "orange"}>
          {isGraded ? "已批改" : "未批改"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => navigate(`/grade/${record.id}`)}>
          批改
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Table
        columns={columns}
        dataSource={answers}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default AnswerList;
