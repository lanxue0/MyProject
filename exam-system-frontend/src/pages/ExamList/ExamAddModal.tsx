import { Form, Input, Modal } from "antd";
import { useForm } from "antd/es/form/Form";
import { examAdd } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

interface ExamAddModalProps {
  isOpen: boolean;
  handleClose: () => void;
}

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export interface ExamAdd {
  name: string;
}

export function ExamAddModal(props: ExamAddModalProps) {
  const [form] = useForm();
  const messageApi = getMessageApi();

  const handleOk = async function () {
    await form.validateFields();

    const value = form.getFieldsValue();

    try {
      const res = await examAdd(value);

      if (res.status === 200 || res.status === 201) {
        messageApi?.open({ type: "success", content: "创建成功" });
        form.resetFields();
        props.handleClose();
      }
    } catch (e: any) {
      messageApi?.open({
        type: "error",
        content: e.response.data.message || "系统繁忙，请稍后再试",
      });
    }
  };

  return (
    <Modal
      title="新增试卷"
      open={props.isOpen}
      onOk={handleOk}
      onCancel={props.handleClose}
      okText={"创建"}
      cancelText={"取消"}
    >
      <Form form={form} colon={false} {...layout}>
        <Form.Item
          label="试卷名"
          name="name"
          rules={[{ required: true, message: "请输入试卷名!" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
