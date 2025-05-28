import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import {
  batchDeleteAdminQuestions,
  examPermanentDelete,
  getAdminExams,
} from "../../../interfaces";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { getMessageApi } from "../../../utils/messageInstance";

interface Exam {
  id: number;
  name: string;
  isPublish: boolean;
  isDelete: boolean;
  hasSubjective: boolean;
  content: string;
  createTime: string;
  updateTime: string;
  createUserId: number;
  createUser: {
    id: number;
    username: string;
    email: string;
  };
}

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
}

interface BatchDeleteErrorItem {
  id: number;
  reason: string;
}

export const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const messageApi = getMessageApi();

  const fetchExams = async (
    page = 1,
    pageSize = 10,
    creator?: string,
    sortBy?: string,
    hasSubjective?: boolean
  ) => {
    setLoading(true);
    try {
      const res = await getAdminExams({
        page,
        pageSize,
        creator,
        sortBy,
        hasSubjective,
      });
      setExams(res.data.data);
      setPagination({
        ...pagination,
        current: res.data.pagination.current,
        total: res.data.pagination.total,
      });
    } catch (e: any) {
      console.error("Failed to fetch exams", e);
      messageApi?.error(e.response.data.message || "获取试卷列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTableChange = (newPagination: any) => {
    const values = form.getFieldsValue();
    fetchExams(
      newPagination.current,
      newPagination.pageSize,
      values.creator,
      values.sortBy,
      values.hasSubjective
    );
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    fetchExams(
      1,
      pagination.pageSize,
      values.creator,
      values.sortBy,
      values.hasSubjective === "true"
        ? true
        : values.hasSubjective === "false"
        ? false
        : undefined
    );
  };

  const handleReset = () => {
    form.resetFields();
    fetchExams(1, pagination.pageSize);
  };

  const handleDelete = async (examId: number) => {
    try {
      await examPermanentDelete(examId);
      messageApi?.success("试卷已永久删除");
      fetchExams(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Failed to delete exam", error);
      messageApi?.error("删除试卷失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi?.warning("请先选择要删除的试卷");
      return;
    }

    setBatchDeleteLoading(true);
    try {
      const response = await batchDeleteAdminQuestions(
        selectedRowKeys.map((key) => Number(key))
      );
      const { success, message: msg, details } = response.data;

      if (success) {
        messageApi?.success(msg);
        // 清空选择
        setSelectedRowKeys([]);
        // 刷新数据
        fetchExams(pagination.current, pagination.pageSize);
      } else {
        messageApi?.error(msg);
      }

      // 如果有部分成功部分失败，显示详细信息
      if (details?.failed?.length > 0) {
        Modal.info({
          title: "部分试卷删除失败",
          content: (
            <div>
              {details.failed.map((item: BatchDeleteErrorItem) => (
                <p key={item.id}>
                  试卷ID {item.id}: {item.reason}
                </p>
              ))}
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to batch delete exams", error);
      messageApi?.error("批量删除试卷失败");
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "试卷名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "创建者",
      dataIndex: ["createUser", "username"],
      key: "creator",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: Exam) => (
        <Space>
          {record.isPublish ? (
            <Tag color="green">已发布</Tag>
          ) : (
            <Tag color="orange">未发布</Tag>
          )}
          {record.hasSubjective && <Tag color="blue">含主观题</Tag>}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Exam) => (
        <Space size="middle">
          <Popconfirm
            title="确定要永久删除这个试卷吗？此操作不可恢复！"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>永久删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>试卷管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="creator" label="创建者">
                <Input placeholder="输入创建者用户名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sortBy" label="排序方式">
                <Select placeholder="选择排序方式">
                  <Select.Option value="createTime">创建时间</Select.Option>
                  <Select.Option value="updateTime">更新时间</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="hasSubjective" label="是否含主观题">
                <Select placeholder="选择试卷类型">
                  <Select.Option value="true">含主观题</Select.Option>
                  <Select.Option value="false">仅客观题</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
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

      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={handleBatchDelete}
          disabled={selectedRowKeys.length === 0}
          loading={batchDeleteLoading}
        >
          批量删除
        </Button>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={exams}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};
