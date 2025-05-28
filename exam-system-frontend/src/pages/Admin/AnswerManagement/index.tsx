import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { deleteAdminAnswer, getAdminAnswers } from "../../../interfaces";
import { SearchOutlined } from "@ant-design/icons";

interface Answer {
  id: number;
  content: string;
  score: number;
  acuracy: number;
  isGraded: boolean;
  createTime: string;
  updateTime: string;
  answererId: number;
  examId: number;
  answerer: {
    id: number;
    username: string;
    email: string;
  };
  exam: {
    id: number;
    name: string;
    createUser: {
      id: number;
      username: string;
    };
  };
}

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
}

export const AnswerManagement: React.FC = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  const fetchAnswers = async (
    page = 1,
    pageSize = 10,
    filters: {
      creator?: string;
      examCreator?: string;
      sortByScore?: string;
      isGraded?: boolean;
    } = {}
  ) => {
    setLoading(true);
    try {
      const res = await getAdminAnswers({
        page,
        pageSize,
        ...filters,
      });
      console.log(res.data);
      setAnswers(res.data.data);
      setPagination({
        ...pagination,
        current: res.data.pagination.current,
        total: res.data.pagination.total,
      });
    } catch (error) {
      console.error("Failed to fetch answers", error);
      message.error("获取答卷列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load all answers without filters on initial load
    fetchAnswers(1, 10);
  }, []);

  const handleTableChange = (newPagination: any) => {
    const values = form.getFieldsValue();
    fetchAnswers(newPagination.current, newPagination.pageSize, {
      creator: values.creator,
      examCreator: values.examCreator,
      sortByScore: values.sortByScore,
      isGraded:
        values.isGraded === "true"
          ? true
          : values.isGraded === "false"
          ? false
          : undefined,
    });
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    fetchAnswers(1, pagination.pageSize, {
      creator: values.creator,
      examCreator: values.examCreator,
      sortByScore: values.sortByScore,
      isGraded:
        values.isGraded === "true"
          ? true
          : values.isGraded === "false"
          ? false
          : undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    fetchAnswers(1, pagination.pageSize);
  };

  const handleDelete = async (answerId: number) => {
    try {
      await deleteAdminAnswer(answerId);
      message.success("删除答卷成功");
      fetchAnswers(
        pagination.current,
        pagination.pageSize,
        form.getFieldsValue().creator ||
          form.getFieldsValue().examCreator ||
          form.getFieldsValue().sortByScore ||
          form.getFieldsValue().isGraded
          ? {
              creator: form.getFieldsValue().creator,
              examCreator: form.getFieldsValue().examCreator,
              sortByScore: form.getFieldsValue().sortByScore,
              isGraded:
                form.getFieldsValue().isGraded === "true"
                  ? true
                  : form.getFieldsValue().isGraded === "false"
                  ? false
                  : undefined,
            }
          : {}
      );
    } catch (error) {
      console.error("Failed to delete answer", error);
      message.error("删除答卷失败");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "试卷名称",
      dataIndex: ["exam", "name"],
      key: "examName",
    },
    {
      title: "试卷创建者",
      dataIndex: ["exam", "createUser", "username"],
      key: "examCreator",
    },
    {
      title: "答题人",
      dataIndex: ["answerer", "username"],
      key: "answerer",
    },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
      render: (text: number, record: Answer) => (
        <span
          style={{
            color:
              record.score >= 60
                ? "green"
                : record.score >= 40
                ? "orange"
                : "red",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: Answer) => (
        <Tag color={record.isGraded ? "green" : "orange"}>
          {record.isGraded ? "已批改" : "未批改"}
        </Tag>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Answer) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除这个答卷吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>答卷管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="creator" label="答题人">
                <Input placeholder="输入答题人用户名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="examCreator" label="试卷创建者">
                <Input placeholder="输入试卷创建者用户名" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="sortByScore" label="分数排序">
                <Select placeholder="选择排序方式">
                  <Select.Option value="asc">从低到高</Select.Option>
                  <Select.Option value="desc">从高到低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isGraded" label="批改状态">
                <Select placeholder="选择批改状态">
                  <Select.Option value="true">已批改</Select.Option>
                  <Select.Option value="false">未批改</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" " colon={false}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      <Table
        columns={columns}
        dataSource={answers}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};
