import { Button, Form, Input } from "antd";
import "./index.css";
import { login } from "../../interfaces";
import { useNavigate } from "react-router";
import { getMessageApi } from "../../utils/messageInstance";

interface LoginUser {
  username: string;
  password: string;
}

const layout1 = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const layout2 = {
  labelCol: { span: 0 },
  wrapperCol: { span: 24 },
};

export function Login() {
  const messageApi = getMessageApi();
  console.log("登录的", messageApi);
  const navigate = useNavigate();

  const onFinish = async (value: LoginUser) => {
    try {
      const res = await login(value.username, value.password);

      if (res.status === 201 || res.status === 200) {
        messageApi?.open({ type: "success", content: "登录成功" });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userInfo", JSON.stringify(res.data.user));

        setTimeout(() => {
          if (
            res.data.user.profile &&
            res.data.user.profile.userType === "ADMIN"
          ) {
            navigate("/admin/dashboard");
          } else if (
            res.data.user.profile &&
            res.data.user.profile.userType === "STUDENT"
          ) {
            navigate("/my-exams");
          } else {
            navigate("/");
          }
        }, 1000);
      }
    } catch (e: any) {
      console.log(e.response.data);
      messageApi?.open({
        type: "error",
        content: e.response?.data?.message || "系统繁忙，请稍后再试",
      });
    }
  };

  return (
    <>
      <div className="login-container">
        <h1>考试系统</h1>
        <Form {...layout1} onFinish={onFinish} colon={false} autoComplete="off">
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
          <Form.Item {...layout2}>
            <div className="links">
              <a href="/register">创建账号</a>
              <a href="/update_password">忘记密码</a>
            </div>
          </Form.Item>
          <Form.Item {...layout2}>
            <Button className="btn" type="primary" htmlType="submit">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
