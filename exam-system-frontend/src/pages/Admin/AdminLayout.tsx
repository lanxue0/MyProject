import React, { useEffect, useState } from "react";
import { Breadcrumb, Layout, Menu, MenuProps, Result, Spin } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  DashboardOutlined,
  FileOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { checkIsAdmin } from "../../interfaces";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("仪表盘", "dashboard", <DashboardOutlined />),
  getItem("用户管理", "user-management", <UserOutlined />),
  getItem("试卷管理", "exam-management", <FileOutlined />),
  getItem("答卷管理", "answer-management", <TeamOutlined />),
  getItem("标签管理", "tag-management", <TagsOutlined />),
  getItem("题库管理", "question-bank", <BookOutlined />),
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>();
  const [currentBreadcrumb, setCurrentBreadcrumb] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkIsAdmin()
      .then((res) => {
        setIsAdmin(res.data.isAdmin);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    if (pathSegments[1] === "admin" && pathSegments[2]) {
      setCurrentPath(pathSegments[2]);

      // Set breadcrumb text
      switch (pathSegments[2]) {
        case "dashboard":
          setCurrentBreadcrumb("仪表盘");
          break;
        case "user-management":
          setCurrentBreadcrumb("用户管理");
          break;
        case "exam-management":
          setCurrentBreadcrumb("试卷管理");
          break;
        case "answer-management":
          setCurrentBreadcrumb("答卷管理");
          break;
        case "tag-management":
          setCurrentBreadcrumb("标签管理");
          break;
        case "question-bank":
          setCurrentBreadcrumb("题库管理");
          break;
        default:
          setCurrentBreadcrumb("");
      }
    }
  }, [location]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(`/admin/${e.key}`);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="对不起，您没有访问此页面的权限"
        extra={
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            返回首页
          </button>
        }
      />
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            color: "white",
            fontSize: 18,
            textAlign: "center",
          }}
        >
          管理后台
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          selectedKeys={currentPath ? [currentPath] : []}
          mode="inline"
          items={items}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: "#fff" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: "100%",
              paddingRight: "24px",
            }}
          >
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              style={{
                padding: "6px 15px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              退出后台
            </button>
          </div>
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>管理后台</Breadcrumb.Item>
            <Breadcrumb.Item>{currentBreadcrumb}</Breadcrumb.Item>
          </Breadcrumb>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: "#fff",
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          考试系统 ©{new Date().getFullYear()} 管理后台
        </Footer>
      </Layout>
    </Layout>
  );
};
