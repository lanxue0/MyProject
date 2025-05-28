import { useEffect, useState } from "react";
import { Avatar, Card, Descriptions, Button } from "antd";
import "./index.scss";
import { getUserProfile, updateUserProfile } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";

export interface UserProfile {
  username: string;
  gender: string;
  userType: string;
  bio?: string;
  region?: string;
  birthDate?: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const messageApi = getMessageApi();
  const [profile, setProfile] = useState<UserProfile>(() => {
    const user = localStorage.getItem("userInfo");
    return user ? JSON.parse(user) : {};
  });

  async function query() {
    try {
      const res = await getUserProfile();
      if (res.status === 200 || res.status === 201) {
        setProfile({
          ...profile,
          gender: res.data.gender,
          userType: res.data.userType,
          bio: res.data.bio,
          region: res.data.region,
          birthDate: res.data.birthDate,
        });
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "系统繁忙，请稍后再试");
    }
  }

  useEffect(() => {
    query();
  }, []);

  const handleSave = async () => {
    try {
      const { userType, username, ...profileData } = profile;
      const res = await updateUserProfile(profileData);
      if (res.status === 200 || res.status === 201) {
        messageApi?.success("保存成功");
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "系统繁忙，请稍后再试");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <Card title="个人信息">
        <div className="avatar-section">
          <Avatar size={64}>{profile.username?.charAt(0)}</Avatar>
        </div>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户名">
            {profile.username}
          </Descriptions.Item>
          <Descriptions.Item label="性别">
            {isEditing ? (
              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            ) : (
              profile.gender
            )}
          </Descriptions.Item>
          <Descriptions.Item label="用户类别">
            {profile.userType === "STUDENT"
              ? "学生"
              : profile.userType === "TEACHER"
              ? "老师"
              : "管理员"}
          </Descriptions.Item>
          <Descriptions.Item label="个人简介">
            {isEditing ? (
              <textarea
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
            ) : (
              profile.bio || "暂无"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="所在地区">
            {isEditing ? (
              <input
                type="text"
                value={profile.region || ""}
                onChange={(e) =>
                  setProfile({ ...profile, region: e.target.value })
                }
              />
            ) : (
              profile.region || "暂无"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="出生日期">
            {isEditing ? (
              <input
                type="date"
                value={profile.birthDate || ""}
                onChange={(e) =>
                  setProfile({ ...profile, birthDate: e.target.value })
                }
              />
            ) : (
              profile.birthDate || "暂无"
            )}
          </Descriptions.Item>
        </Descriptions>

        <div className="actions">
          {!isEditing ? (
            <Button type="primary" onClick={() => setIsEditing(true)}>
              编辑
            </Button>
          ) : (
            <>
              <Button type="primary" onClick={handleSave}>
                保存
              </Button>
              <Button onClick={handleCancel}>取消</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
