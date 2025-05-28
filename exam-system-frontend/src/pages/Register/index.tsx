import { Button, Form, Input, Radio } from "antd";
import "./index.css";
import { useForm } from "antd/es/form/Form";
import { register, registerCaptcha } from "../../interfaces";
import { useNavigate } from "react-router";
import { getMessageApi } from "../../utils/messageInstance";

export interface RegisterUser {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  captcha: string;
  userType: string;
}

const layout1 = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const layout2 = {
  labelCol: { span: 0 },
  wrapperCol: { span: 24 },
};

export function Register() {
  const messageApi = getMessageApi();
  const navigate = useNavigate();
  const [form] = useForm();

  const onFinish = async (value: RegisterUser) => {
    if (value.password !== value.confirmPassword) {
      return messageApi?.open({ type: "error", content: "两次密码不一致" });
    }

    const res = await register(value);

    if (res.status === 201 || res.status === 200) {
      messageApi?.open({ type: "success", content: "注册成功" });
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
      const res = await registerCaptcha(address);

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
      <div className="register-container">
        <h1>登录系统</h1>
        <Form
          form={form}
          {...layout1}
          onFinish={onFinish}
          colon={false}
          autoComplete="off"
          initialValues={{ userType: "STUDENT" }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名!" }]}
          >
            <Input />
          </Form.Item>
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
          <Form.Item
            label="用户类型"
            name="userType"
            rules={[{ required: true, message: "请选择用户类型!" }]}
          >
            <Radio.Group>
              <Radio value="STUDENT">学生</Radio>
              <Radio value="TEACHER">教师</Radio>
            </Radio.Group>
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
          <Form.Item {...layout2}>
            <div className="links">
              已有账号？去<a href="/login">登录</a>
            </div>
          </Form.Item>
          <Form.Item {...layout1} label=" ">
            <Button className="btn" type="primary" htmlType="submit">
              注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
