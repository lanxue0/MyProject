import { Layout, Menu } from "antd";
import { Link, Outlet, useLocation } from "react-router";
import { Header } from "../Header";
import { useState, useEffect } from "react";
import {
  UploadOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
  CheckSquareOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  FileOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;

export function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("1");
  const [userType, setUserType] = useState<string>("");

  useEffect(() => {
    // 获取用户信息和类型
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUserType(parsedUser.profile?.userType || "");
    }

    // 根据当前路径设置选中的菜单项
    if (location.pathname === "/") {
      setSelectedKey("1");
    } else if (location.pathname === "/profile") {
      setSelectedKey("2");
    } else if (location.pathname === "/my-exams") {
      setSelectedKey("3");
    } else if (location.pathname === "/pending-list") {
      setSelectedKey("4");
    } else if (location.pathname === "/question-import") {
      setSelectedKey("5");
    } else if (location.pathname === "/classroom-manage") {
      setSelectedKey("6");
    } else if (location.pathname === "/student-classroom") {
      setSelectedKey("7");
    } else if (location.pathname === "/teacher-join-classroom") {
      setSelectedKey("8");
    } else if (location.pathname === "/published-exams") {
      setSelectedKey("9");
    } else if (location.pathname === "/student-published-exams") {
      setSelectedKey("10");
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={200}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: "100%", borderRight: 0 }}
          >
            {/* 试卷管理 - 仅教师可见 */}
            {userType === "TEACHER" && (
              <Menu.Item key="1" icon={<HomeOutlined />}>
                <Link to="/">试卷管理</Link>
              </Menu.Item>
            )}

            {/* 我的考试 - 仅学生可见 */}
            {userType === "STUDENT" && (
              <Menu.Item key="3" icon={<ReadOutlined />}>
                <Link to="/my-exams">我的考试</Link>
              </Menu.Item>
            )}

            {/* 班级考试 - 仅学生可见 */}
            {userType === "STUDENT" && (
              <Menu.Item key="10" icon={<BookOutlined />}>
                <Link to="/student-published-exams">班级考试</Link>
              </Menu.Item>
            )}

            {/* 待批改试卷 - 仅教师可见 */}
            {userType === "TEACHER" && (
              <Menu.Item key="4" icon={<CheckSquareOutlined />}>
                <Link to="/pending-list">待批改试卷</Link>
              </Menu.Item>
            )}

            {/* 题目导入 - 仅教师可见 */}
            {userType === "TEACHER" && (
              <Menu.Item key="5" icon={<UploadOutlined />}>
                <Link to="/question-import">题目导入</Link>
              </Menu.Item>
            )}

            {/* 试卷发布列表 - 仅教师可见 */}
            {userType === "TEACHER" && (
              <Menu.Item key="9" icon={<FileOutlined />}>
                <Link to="/published-exams">试卷发布列表</Link>
              </Menu.Item>
            )}

            {/* 教师班级管理菜单 - 仅教师可见 */}
            {userType === "TEACHER" && (
              <>
                <Menu.Item key="6" icon={<TeamOutlined />}>
                  <Link to="/classroom-manage">班级管理</Link>
                </Menu.Item>
                <Menu.Item key="8" icon={<UsergroupAddOutlined />}>
                  <Link to="/teacher-join-classroom">协作班级</Link>
                </Menu.Item>
              </>
            )}

            {/* 学生班级菜单 - 仅学生可见 */}
            {userType === "STUDENT" && (
              <Menu.Item key="7" icon={<TeamOutlined />}>
                <Link to="/student-classroom">我的班级</Link>
              </Menu.Item>
            )}

            {/* 个人信息 - 所有人可见 */}
            <Menu.Item key="2" icon={<UserOutlined />}>
              <Link to="/profile">个人信息</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Content style={{ padding: "24px" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
