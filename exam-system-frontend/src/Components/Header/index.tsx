import { useEffect, useState } from "react";
import { Avatar, Dropdown, MenuProps } from "antd";
import { Link } from "react-router";
import "./index.scss";

export function Header() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    if (user) {
      setUserInfo(JSON.parse(user));
    }
  }, []);

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <Link to="/profile">个人信息</Link>,
    },
    {
      key: '2',
      label: <Link to="/update_password">修改密码</Link>,
    },
    {
      key: '3',
      label: <a onClick={() => {
        localStorage.clear();
        window.location.href = '/login';
      }}>退出登录</a>,
    },
  ];

  return (
    <div className="header-container">
      <div className="logo">考试系统</div>
      {userInfo && (
        <div className="user-info">
          <Dropdown menu={{ items }} placement="bottomRight">
            <div className="user-dropdown">
              <Avatar>{userInfo.username?.charAt(0)}</Avatar>
              <span className="username">{userInfo.username}</span>
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  );
}