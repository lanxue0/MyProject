import React, { useEffect, useState } from "react";
import { Modal, Form, Select, InputNumber, Button, Space } from "antd";
import { autoGenerateExam, getTags, Tag } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (questions: any[]) => void;
}

const difficultyOptions = [
  { label: "非常简单", value: 0 },
  { label: "简单", value: 1 },
  { label: "中等", value: 2 },
  { label: "较难", value: 3 },
  { label: "困难", value: 4 },
  { label: "非常困难", value: 5 },
];

export function AutoGenerateModal({
  isOpen,
  onClose,
  onGenerate,
}: AutoGenerateModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const messageApi = getMessageApi();

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const res = await getTags();
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 确保所有题型数量之和等于总数
      const {
        totalCount,
        radioCount,
        checkboxCount,
        inputCount,
        judgeCount,
        essayCount,
      } = values;

      // 确保转换为数字类型进行比较
      const sum =
        Number(radioCount || 0) +
        Number(checkboxCount || 0) +
        Number(inputCount || 0) +
        Number(judgeCount || 0) +
        Number(essayCount || 0);

      const totalCountNum = Number(totalCount || 0);

      if (sum !== totalCountNum) {
        messageApi?.error(
          `所有题型数量之和(${sum})必须等于总题目数量(${totalCountNum})`
        );
        setLoading(false);
        return;
      }

      // 调用自动组卷接口
      const res = await autoGenerateExam(values);
      messageApi?.success("自动组卷成功");
      onGenerate(res.data);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.message) {
        messageApi?.error(error.response.data.message);
      } else {
        messageApi?.error("自动组卷失败");
      }
      console.error("Failed to auto generate exam", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="自动组卷"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          difficulty: 2,
          totalCount: 10,
          radioCount: 3,
          checkboxCount: 2,
          inputCount: 2,
          judgeCount: 2,
          essayCount: 1,
        }}
      >
        <Form.Item
          name="difficulty"
          label="试卷难度"
          rules={[{ required: true, message: "请选择试卷难度" }]}
        >
          <Select options={difficultyOptions} />
        </Form.Item>

        <Form.Item
          name="tagIds"
          label="题目标签"
          extra="选择标签可以筛选特定知识点的题目"
        >
          <Select
            mode="multiple"
            placeholder="选择标签"
            options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
          />
        </Form.Item>

        <Form.Item
          name="totalCount"
          label="题目总数"
          rules={[{ required: true, message: "请输入题目总数" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="各题型数量">
          <Space style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item
              name="radioCount"
              label="单选题"
              rules={[{ required: true }]}
              style={{ marginBottom: 0, marginRight: 8 }}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item
              name="checkboxCount"
              label="多选题"
              rules={[{ required: true }]}
              style={{ marginBottom: 0, marginRight: 8 }}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item
              name="inputCount"
              label="填空题"
              rules={[{ required: true }]}
              style={{ marginBottom: 0, marginRight: 8 }}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item
              name="judgeCount"
              label="判断题"
              rules={[{ required: true }]}
              style={{ marginBottom: 0, marginRight: 8 }}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item
              name="essayCount"
              label="主观题"
              rules={[{ required: true }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={0} />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleOk} loading={loading}>
              生成试卷
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
