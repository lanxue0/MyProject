import { Button, Form, Input } from "antd";
import "./index.css";
import { useNavigate } from "react-router";
import { useForm } from "antd/es/form/Form";
import { updatePassword, updatePasswordCaptcha } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

export interface UpdatePassword {
  username: string;
  email: string;
  captcha: string;
  password: string;
  confirmPassword: string;
}

const layout1 = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export function UpdatePassword() {
  const navigate = useNavigate();
  const messageApi = getMessageApi();
  const [form] = useForm();

  const onFinish = async (value: UpdatePassword) => {
    if (value.password !== value.confirmPassword) {
      return messageApi?.open({ type: "error", content: "两次密码不一致" });
    }

    const res = await updatePassword(value);

    if (res.status === 201 || res.status === 200) {
      messageApi?.open({ type: "success", content: "修改密码成功" });
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } else {
      messageApi?.open({
        type: "error",
        content: res.data.data || "系统繁忙，请稍后再试",
      });
    }
  };

  async function sendCaptcha() {
    const address = form.getFieldValue("email");
    if (!address) {
      return messageApi?.open({ type: "error", content: "请输入邮箱地址！" });
    }

    try {
      const res = await updatePasswordCaptcha(address);

      if (res.status === 201 || res.status === 200) {
        messageApi?.open({ type: "success", content: res.data });
      }
    } catch (e: any) {
      messageApi?.open({
        type: "error",
        content: e.response.data.message || "系统繁忙，请稍后再试",
      });
    }
  }

  return (
    <>
      <div className="update-password-container">
        <h1>考试系统</h1>
        <Form
          {...layout1}
          onFinish={onFinish}
          form={form}
          colon={false}
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱!" },
              { type: "email", message: "请输入合法邮箱地址!" },
            ]}
          >
            <Input />
          </Form.Item>
          <div className="captcha-wrapper">
            <Form.Item
              label="验证码"
              name="captcha"
              rules={[{ required: true, message: "请输入验证码!" }]}
            >
              <Input />
            </Form.Item>
            <Button type="primary" onClick={sendCaptcha}>
              发送验证码
            </Button>
          </div>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            rules={[{ required: true, message: "请输入确认密码!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" htmlType="submit" className="btn">
              修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
