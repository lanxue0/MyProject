import { Button, Card, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMessageApi } from "../../utils/messageInstance";
import { answerFindByUserId } from "../../interfaces";

interface UserAnswer {
  id: number;
  name: string;
  createTime: string;
  score?: number;
  accuracy?: number;
  isGraded?: boolean;
  totalScore?: number;
}

export function MyExams() {
  const [exams, setExams] = useState<Array<UserAnswer>>([]);
  const messageApi = getMessageApi();

  async function query() {
    try {
      const res = await answerFindByUserId();
      console.log(res.data);
      if (res.status === 200 || res.status === 201) {
        console.log(res.data);
        setExams(res.data);
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  useEffect(() => {
    query();
  }, []);

  const columns = [
    {
      title: "试卷名称",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: "20%",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "得分",
      dataIndex: "score",
      key: "score",
      width: "15%",
      render: (_: any, record: UserAnswer) => (
        <span
          style={{
            color:
              record.score &&
              record.totalScore &&
              record.score >= record.totalScore * 0.6
                ? "#52c41a"
                : record.score &&
                  record.totalScore &&
                  record.score >= record.totalScore * 0.4
                ? "#faad14"
                : "#f5222d",
          }}
        >
          {!record.isGraded
            ? "未批改"
            : record.score
            ? `${record.score}/${record.totalScore || 100}`
            : "--"}
        </span>
      ),
    },
    {
      title: "正确率",
      dataIndex: "accuracy",
      key: "accuracy",
      width: "15%",
      render: (_: any, record: UserAnswer) => {
        // 使用totalScore计算正确率，如果没有则使用已有的accuracy
        const calculatedAccuracy =
          record.totalScore && record.score
            ? record.score / record.totalScore
            : record.accuracy;

        return (
          <span
            style={{
              color:
                calculatedAccuracy && calculatedAccuracy >= 0.6
                  ? "#52c41a"
                  : calculatedAccuracy && calculatedAccuracy >= 0.4
                  ? "#faad14"
                  : "#f5222d",
            }}
          >
            {!record.isGraded
              ? "未批改"
              : calculatedAccuracy
              ? `${(calculatedAccuracy * 100).toFixed(1)}%`
              : "--"}
          </span>
        );
      },
    },
    {
      title: "状态",
      key: "status",
      width: "10%",
      render: (_: any, record: UserAnswer) =>
        record.isGraded && (
          <Tag color={record.isGraded ? "green" : "orange"}>
            {record.isGraded ? "已批改" : "待批改"}
          </Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      width: "15%",
      render: (_: any, record: UserAnswer) => (
        <Space size="middle">
          <Link to={`/res/${record.id}`}>
            <Button type="link" size="small">
              查看详情
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="我的考试"
      bordered={false}
      headStyle={{ borderBottom: 0 }}
      bodyStyle={{ padding: "24px 0" }}
    >
      <Table
        columns={columns}
        dataSource={exams}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
        style={{ width: "100%" }}
      />
    </Card>
  );
}
