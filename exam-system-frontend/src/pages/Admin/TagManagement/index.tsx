import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tree,
  TreeSelect,
  Upload,
  Typography,
  Result,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  CreateTagDto,
  Tag,
  UpdateTagDto,
  batchDeleteAdminTags,
  createAdminTag,
  deleteAdminTag,
  getAdminTag,
  getAdminTags,
  getAdminTagsHierarchical,
  updateAdminTag,
  getTagTemplate,
  uploadTags,
} from "../../../interfaces";
import { DataNode } from "antd/es/tree";
import { getMessageApi } from "../../../utils/messageInstance";

const { Paragraph } = Typography;

interface BatchDeleteErrorItem {
  id: number;
  reason: string;
}

export const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [tagDetailLoading, setTagDetailLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [importUploadLoading, setImportUploadLoading] =
    useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const messageApi = getMessageApi();

  useEffect(() => {
    fetchTags();
    fetchHierarchicalTags();
  }, []);

  const fetchTags = async (parentId?: number) => {
    setLoading(true);
    try {
      const res = await getAdminTags(parentId);
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
      messageApi?.error("获取标签列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchicalTags = async () => {
    try {
      const res = await getAdminTagsHierarchical();
      setTreeData(convertTagsToTreeData(res.data));
    } catch (error) {
      console.error("Failed to fetch hierarchical tags", error);
      messageApi?.error("获取层级标签失败");
    }
  };

  // Convert tags to tree data format for the Tree component
  const convertTagsToTreeData = (tags: Tag[]): DataNode[] => {
    return tags.map((tag) => ({
      title: tag.name,
      key: tag.id.toString(),
      value: tag.id,
      children: tag.children ? convertTagsToTreeData(tag.children) : undefined,
    }));
  };

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const parentId = parseInt(selectedKeys[0].toString(), 10);
      setSelectedParentId(parentId);
      fetchTags(parentId);
    } else {
      setSelectedParentId(null);
      fetchTags();
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const showEditModal = (tag: Tag) => {
    form.setFieldsValue({
      name: tag.name,
      description: tag.description,
      parentId: tag.parentId,
    });
    setSelectedTag(tag);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isEditMode && selectedTag) {
        await updateAdminTag(selectedTag.id, values as UpdateTagDto);
        messageApi?.success("标签更新成功");
      } else {
        await createAdminTag(values as CreateTagDto);
        messageApi?.success("标签创建成功");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchTags(selectedParentId !== null ? selectedParentId : undefined);
      fetchHierarchicalTags();
    } catch (error) {
      console.error("Failed to save tag", error);
      messageApi?.error("保存标签失败");
    }
  };

  const handleDelete = async (tagId: number) => {
    try {
      await deleteAdminTag(tagId);
      messageApi?.success("标签删除成功");
      fetchTags(selectedParentId !== null ? selectedParentId : undefined);
      fetchHierarchicalTags();
    } catch (error) {
      console.error("Failed to delete tag", error);
      messageApi?.error("删除标签失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi?.warning("请先选择要删除的标签");
      return;
    }

    setBatchDeleteLoading(true);
    try {
      const response = await batchDeleteAdminTags(
        selectedRowKeys.map((key) => Number(key))
      );
      const { success, message: msg, details } = response.data;

      if (success) {
        messageApi?.success(msg);
        // 清空选择
        setSelectedRowKeys([]);
        // 刷新数据
        fetchTags(selectedParentId !== null ? selectedParentId : undefined);
        fetchHierarchicalTags();
      } else {
        messageApi?.error(msg);
      }

      // 如果有部分成功部分失败，显示详细信息
      if (details?.failed?.length > 0) {
        Modal.info({
          title: "部分标签删除失败",
          content: (
            <div>
              {details.failed.map((item: BatchDeleteErrorItem) => (
                <p key={item.id}>
                  标签ID {item.id}: {item.reason}
                </p>
              ))}
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to batch delete tags", error);
      messageApi?.error("批量删除标签失败");
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const showTagDetail = async (tagId: number) => {
    setDrawerVisible(true);
    setTagDetailLoading(true);
    try {
      const res = await getAdminTag(tagId);
      setSelectedTag(res.data);
    } catch (error) {
      console.error("Failed to fetch tag details", error);
      messageApi?.error("获取标签详情失败");
    } finally {
      setTagDetailLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
    getCheckboxProps: (record: Tag) => ({
      disabled: record.children && record.children.length > 0,
      name: record.name,
    }),
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "标签名称",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Tag) => (
        <Button type="link" onClick={() => showTagDetail(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "父标签",
      key: "parent",
      render: (_: any, record: Tag) =>
        record.parent ? record.parent.name : "-",
    },
    {
      title: "子标签数",
      key: "childCount",
      render: (_: any, record: Tag) =>
        record.children ? record.children.length : 0,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: any, record: Tag) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="确定要删除这个标签吗？"
            description={
              record.children && record.children.length > 0
                ? "无法删除有子标签的标签，请先删除或移动其子标签。"
                : "删除后不可恢复。"
            }
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.children && record.children.length > 0}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.children && record.children.length > 0}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 下载标签导入模板
  const downloadTemplate = async () => {
    try {
      const response = await getTagTemplate();
      console.log(response.data);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "标签导入模板.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template", error);
      messageApi?.error("下载模板失败");
    }
  };

  // 处理标签导入
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setImportUploadLoading(true);
    setImportErrors([]);
    try {
      const response = await uploadTags(file);
      setImportSuccess(true);
      setImportedCount(response.data.imported || 0);

      // 处理后端返回的错误信息
      if (response.data.errors && response.data.errors.length > 0) {
        setImportErrors(response.data.errors);
        messageApi?.warning(`导入过程中有${response.data.errors.length}个错误`);
      } else {
        messageApi?.success(`成功导入 ${response.data.imported} 个标签`);
      }

      onSuccess();
      fetchTags(selectedParentId !== null ? selectedParentId : undefined);
      fetchHierarchicalTags();
    } catch (error) {
      console.error("Failed to upload tags", error);
      onError(error);
      messageApi?.error("导入标签失败");
    } finally {
      setImportUploadLoading(false);
    }
  };

  // 重置导入状态
  const resetImportStatus = () => {
    setImportSuccess(false);
    setImportedCount(0);
    setImportErrors([]);
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
    fetchTags(selectedParentId !== null ? selectedParentId : undefined);
    fetchHierarchicalTags();
  };

  return (
    <div className="tag-management">
      <h2 style={{ marginBottom: 16 }}>标签管理</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="标签分类" style={{ marginBottom: 16 }}>
            {treeData.length > 0 ? (
              <Tree
                treeData={treeData}
                defaultExpandAll
                onSelect={handleTreeSelect}
              />
            ) : (
              <Empty description="没有标签" />
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ marginTop: 16 }}
            >
              新建标签
            </Button>
          </Card>
        </Col>
        <Col span={18}>
          <Card
            title="标签列表"
            extra={
              <Space>
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
                <Button icon={<UploadOutlined />} onClick={showImportModal}>
                  批量导入
                </Button>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                  下载模板
                </Button>
              </Space>
            }
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={tags}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={isEditMode ? "编辑标签" : "创建标签"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: "请输入标签名称" }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入标签描述" />
          </Form.Item>
          <Form.Item name="parentId" label="父标签">
            <TreeSelect
              treeData={treeData}
              placeholder="选择父标签"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="标签详情"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {tagDetailLoading ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            加载中...
          </div>
        ) : selectedTag ? (
          <div>
            <p>
              <strong>ID:</strong> {selectedTag.id}
            </p>
            <p>
              <strong>名称:</strong> {selectedTag.name}
            </p>
            <p>
              <strong>描述:</strong> {selectedTag.description || "-"}
            </p>
            <p>
              <strong>父标签:</strong>{" "}
              {selectedTag.parent ? selectedTag.parent.name : "-"}
            </p>
            <p>
              <strong>创建时间:</strong>{" "}
              {new Date(selectedTag.createTime).toLocaleString()}
            </p>
            <p>
              <strong>更新时间:</strong>{" "}
              {new Date(selectedTag.updateTime).toLocaleString()}
            </p>

            <div style={{ marginTop: 20 }}>
              <h3>子标签</h3>
              {selectedTag.children && selectedTag.children.length > 0 ? (
                <ul>
                  {selectedTag.children.map((child) => (
                    <li key={child.id}>{child.name}</li>
                  ))}
                </ul>
              ) : (
                <p>没有子标签</p>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <h3>关联试卷</h3>
              {selectedTag.exams && selectedTag.exams.length > 0 ? (
                <ul>
                  {selectedTag.exams.map((examTag) => (
                    <li key={examTag.examId}>
                      {examTag.exam
                        ? examTag.exam.name
                        : `试卷 #${examTag.examId}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>没有关联试卷</p>
              )}
            </div>
          </div>
        ) : (
          <Empty description="没有选中的标签" />
        )}
      </Drawer>

      {/* 批量导入标签模态框 */}
      <Modal
        title="批量导入标签"
        open={importModalVisible}
        onCancel={closeImportModal}
        footer={null}
        width={600}
      >
        {importSuccess ? (
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="标签导入成功"
            subTitle={`已成功导入 ${importedCount} 个标签`}
            extra={[
              <Button key="back" onClick={resetImportStatus}>
                继续导入
              </Button>,
              <Button key="close" type="primary" onClick={closeImportModal}>
                关闭
              </Button>,
            ]}
          >
            {importErrors.length > 0 && (
              <div style={{ marginTop: 16, textAlign: "left" }}>
                <Typography.Title level={5} style={{ color: "#faad14" }}>
                  导入过程中存在以下问题:
                </Typography.Title>
                <ul style={{ maxHeight: "200px", overflow: "auto" }}>
                  {importErrors.map((error, index) => (
                    <li key={index} style={{ color: "#faad14" }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Result>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>
              通过Excel表格批量导入标签。请先下载模板，按照格式填写后上传。
            </Paragraph>

            <div className="upload-actions">
              <Space>
                <Upload customRequest={handleUpload} showUploadList={false}>
                  <Button
                    icon={<UploadOutlined />}
                    loading={importUploadLoading}
                    type="primary"
                  >
                    上传标签
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
                <li>标签名称为必填项</li>
                <li>父标签名称可以为空，表示顶级标签</li>
                <li>描述字段为可选项</li>
                <li>导入的标签若与现有标签重名，系统会自动进行更新</li>
              </ul>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
