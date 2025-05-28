import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Typography,
  Row,
  Col,
  Tooltip,
  Pagination,
  Upload,
  Result,
  InputNumber,
} from "antd";
import {
  Question,
  UpdateQuestionDto,
  getAdminQuestions,
  updateAdminQuestion,
  deleteAdminQuestion,
  getTags,
  Tag as TagInterface,
  uploadQuestions,
  getQuestionTemplate,
  createAdminQuestion,
  batchDeleteAdminQuestions,
} from "../../interfaces";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { getMessageApi } from "../../utils/messageInstance";
import "./styles.scss";

const { Title, Paragraph } = Typography;

const difficultyOptions = [
  { label: "非常简单", value: 0 },
  { label: "简单", value: 1 },
  { label: "中等", value: 2 },
  { label: "较难", value: 3 },
  { label: "困难", value: 4 },
  { label: "非常困难", value: 5 },
];

const typeOptions = [
  { label: "单选题", value: "radio" },
  { label: "多选题", value: "checkbox" },
  { label: "填空题", value: "input" },
  { label: "判断题", value: "judge" },
  { label: "主观题", value: "essay" },
];

const difficultyColors = {
  0: "green",
  1: "success",
  2: "warning",
  3: "orange",
  4: "error",
  5: "volcano",
};

const typeLabels = {
  radio: "单选题",
  checkbox: "多选题",
  input: "填空题",
  judge: "判断题",
  essay: "主观题",
};

export default function QuestionBank() {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tags, setTags] = useState<TagInterface[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [addQuestionModalVisible, setAddQuestionModalVisible] = useState(false);
  const [importUploadLoading, setImportUploadLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);
  const messageApi = getMessageApi();

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, [page, pageSize]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getAdminQuestions({
        page,
        pageSize,
      });
      setQuestions(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch questions", error);
      messageApi?.error("获取题目失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await getTags();
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      if (currentQuestion) {
        await updateAdminQuestion(
          currentQuestion.id,
          values as UpdateQuestionDto
        );
        messageApi?.success("更新题目成功");
        setModalVisible(false);
        form.resetFields();
        fetchQuestions();
      }
    } catch (error) {
      console.error("Failed to update question", error);
      messageApi?.error("更新题目失败");
    }
  };

  const showDeleteConfirm = (id: number) => {
    setDeleteQuestionId(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteQuestionId) return;

    try {
      const response = await deleteAdminQuestion(deleteQuestionId);
      if (response.status === 200 || response.status === 201) {
        messageApi?.success("删除题目成功");
        fetchQuestions();
      }
    } catch (error) {
      console.error("Failed to delete question", error);
      messageApi?.error("删除题目失败");
    } finally {
      setDeleteModalVisible(false);
      setDeleteQuestionId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeleteQuestionId(null);
  };

  const handleEdit = (question: Question) => {
    setCurrentQuestion(question);

    // Format the data for the form
    const formValues = {
      ...question,
      tagIds: question.tags?.map((tag) => tag.id),
    };

    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) =>
        typeLabels[type as keyof typeof typeLabels] || type,
    },
    {
      title: "题目",
      dataIndex: "question",
      key: "question",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "创建者",
      dataIndex: "creator",
      key: "creator",
      render: (creator: any) => creator?.username || "-",
    },
    {
      title: "分值",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      render: (difficulty: number) => (
        <Tag
          color={difficultyColors[difficulty as keyof typeof difficultyColors]}
        >
          {difficultyOptions.find((option) => option.value === difficulty)
            ?.label || difficulty}
        </Tag>
      ),
    },
    {
      title: "标签",
      key: "tags",
      dataIndex: "tags",
      render: (tags: TagInterface[]) => (
        <span>
          {tags &&
            tags.map((tag) => (
              <Tag key={tag.id} color="blue">
                {tag.name}
              </Tag>
            ))}
        </span>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Question) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 下载题目导入模板
  const downloadTemplate = async () => {
    try {
      const response = await getQuestionTemplate();
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "题目导入模板.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template", error);
      messageApi?.error("下载模板失败");
    }
  };

  // 处理题目导入
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setImportUploadLoading(true);
    try {
      const response = await uploadQuestions(file);
      setImportSuccess(true);
      setImportedCount(response.data.imported || 0);
      onSuccess();
      messageApi?.success(`成功导入 ${response.data.imported} 道题目`);
      fetchQuestions();
    } catch (error) {
      console.error("Failed to upload questions", error);
      onError(error);
      messageApi?.error("导入题目失败");
    } finally {
      setImportUploadLoading(false);
    }
  };

  // 重置导入状态
  const resetImportStatus = () => {
    setImportSuccess(false);
    setImportedCount(0);
  };

  // 打开导入模态框
  const showImportModal = () => {
    setImportModalVisible(true);
    setImportSuccess(false);
    setImportedCount(0);
  };

  // 关闭导入模态框
  const closeImportModal = () => {
    setImportModalVisible(false);
    fetchQuestions();
  };

  // 显示新增题目模态框
  const showAddQuestionModal = () => {
    setCurrentQuestion(null);
    form.resetFields();
    setAddQuestionModalVisible(true);
  };

  // 关闭新增题目模态框
  const closeAddQuestionModal = () => {
    setAddQuestionModalVisible(false);
    form.resetFields();
  };

  // 处理新增题目
  const handleAddQuestion = async (values: any) => {
    try {
      // 格式化数据
      const formattedValues = {
        ...values,
        options: values.options?.trim() || null,
        score: Number(values.score),
      };

      // 使用更新接口来新增题目
      await createAdminQuestion(formattedValues as UpdateQuestionDto);
      messageApi?.success("新增题目成功");
      setAddQuestionModalVisible(false);
      form.resetFields();
      fetchQuestions();
    } catch (error) {
      console.error("Failed to add question", error);
      messageApi?.error("新增题目失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi?.warning("请先选择要删除的题目");
      return;
    }

    setBatchDeleteModalVisible(true);
  };

  const handleBatchDeleteConfirm = async () => {
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
        fetchQuestions();
      } else {
        messageApi?.error(msg);
      }

      // 如果有部分成功部分失败，显示详细信息
      if (details?.failed?.length > 0) {
        Modal.info({
          title: "部分题目删除失败",
          content: (
            <div>
              {details.failed.map((item: { id: number; reason: string }) => (
                <p key={item.id}>
                  题目ID {item.id}: {item.reason}
                </p>
              ))}
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to batch delete questions", error);
      messageApi?.error("批量删除题目失败");
    } finally {
      setBatchDeleteLoading(false);
      setBatchDeleteModalVisible(false);
    }
  };

  const handleBatchDeleteCancel = () => {
    setBatchDeleteModalVisible(false);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <div className="question-bank-container">
      <Card>
        <Title level={4}>题库管理</Title>

        <Row gutter={[16, 16]} className="filter-row">
          <Col flex="auto"></Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddQuestionModal}
              >
                新增题目
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                disabled={selectedRowKeys.length === 0}
                loading={batchDeleteLoading}
              >
                批量删除
              </Button>
              <Button icon={<UploadOutlined />} onClick={showImportModal}>
                批量导入
              </Button>
              <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                下载模板
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <div className="pagination-container">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            }}
            showSizeChanger
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      </Card>

      <Modal
        title="编辑题目"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true, message: "请选择题目类型" }]}
          >
            <Select options={typeOptions} />
          </Form.Item>

          <Form.Item
            name="question"
            label="题目内容"
            rules={[{ required: true, message: "请输入题目内容" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("type");
              if (["radio", "checkbox", "judge"].includes(type)) {
                return (
                  <Form.Item
                    name="options"
                    label="选项"
                    rules={[{ required: true, message: "请输入选项" }]}
                    extra={
                      type === "judge"
                        ? "判断题选项固定为：正确,错误"
                        : "多个选项请用逗号分隔，例如：选项1,选项2,选项3"
                    }
                  >
                    <Input
                      defaultValue={type === "judge" ? "正确,错误" : ""}
                      disabled={type === "judge"}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="score"
            label="分值"
            rules={[{ required: true, message: "请输入分值" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="answer"
            label="答案"
            rules={[{ required: true, message: "请输入答案" }]}
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="answerAnalyse"
            label="答案解析"
            rules={[{ required: true, message: "请输入答案解析" }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度"
            rules={[{ required: true, message: "请选择难度" }]}
          >
            <Select options={difficultyOptions} />
          </Form.Item>

          <Form.Item name="tagIds" label="标签">
            <Select
              mode="multiple"
              placeholder="选择标签"
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      >
        <p>确定要删除这个题目吗？此操作不可恢复。</p>
      </Modal>

      <Modal
        title="批量删除题目"
        open={batchDeleteModalVisible}
        onOk={handleBatchDeleteConfirm}
        onCancel={handleBatchDeleteCancel}
        okText="确定"
        cancelText="取消"
        okButtonProps={{
          danger: true,
          loading: batchDeleteLoading,
        }}
      >
        <p>
          确定要删除选中的 {selectedRowKeys.length} 个题目吗？此操作不可恢复！
        </p>
      </Modal>

      <Modal
        title="批量导入题目"
        open={importModalVisible}
        onCancel={closeImportModal}
        footer={null}
        width={600}
      >
        {importSuccess ? (
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="题目导入成功"
            subTitle={`已成功导入 ${importedCount} 道题目到题库`}
            extra={[
              <Button key="back" onClick={resetImportStatus}>
                继续导入
              </Button>,
              <Button key="close" type="primary" onClick={closeImportModal}>
                关闭
              </Button>,
            ]}
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>
              通过Excel表格批量导入题目到题库。请先下载模板，按照格式填写后上传。
            </Paragraph>

            <div className="upload-actions">
              <Space>
                <Upload customRequest={handleUpload} showUploadList={false}>
                  <Button
                    icon={<UploadOutlined />}
                    loading={importUploadLoading}
                    type="primary"
                  >
                    上传题目
                  </Button>
                </Upload>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                  下载模板
                </Button>
              </Space>
            </div>

            <div className="upload-tips">
              <Paragraph>
                <strong>说明：</strong>
              </Paragraph>
              <ul>
                <li>
                  支持的题型：单选题(radio)、多选题(checkbox)、填空题(input)、判断题(judge)、主观题(essay)
                </li>
                <li>
                  难度支持：非常简单(0)、简单(1)、中等(2)、较难(3)、困难(4)、非常困难(5)
                </li>
                <li>选项使用英文逗号分隔，如：选项1,选项2,选项3</li>
                <li>标签使用英文逗号分隔，如：标签1,标签2</li>
              </ul>
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title="新增题目"
        open={addQuestionModalVisible}
        onOk={() => form.submit()}
        onCancel={closeAddQuestionModal}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddQuestion}
          initialValues={{ score: 5, difficulty: 2 }}
        >
          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true, message: "请选择题目类型" }]}
          >
            <Select options={typeOptions} />
          </Form.Item>

          <Form.Item
            name="question"
            label="题目内容"
            rules={[{ required: true, message: "请输入题目内容" }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="options"
            label="选项"
            extra="选项之间使用英文逗号分隔，如：选项1,选项2,选项3"
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="score"
            label="分值"
            rules={[{ required: true, message: "请输入分值" }]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>

          <Form.Item name="answer" label="答案">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item name="answerAnalyse" label="答案解析">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度"
            rules={[{ required: true, message: "请选择难度" }]}
          >
            <Select options={difficultyOptions} />
          </Form.Item>

          <Form.Item name="tagIds" label="标签">
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="请选择标签"
              options={tags.map((tag) => ({
                label: tag.name,
                value: tag.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
