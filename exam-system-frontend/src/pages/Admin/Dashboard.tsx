import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  FileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getAdminUsers,
  getAdminExams,
  getAdminAnswers,
} from "../../interfaces";

export const Dashboard: React.FC = () => {
  const [userCount, setUserCount] = useState<number>(0);
  const [examCount, setExamCount] = useState<number>(0);
  const [answerCount, setAnswerCount] = useState<number>(0);
  const [pendingAnswerCount, setPendingAnswerCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch user count
        const usersResponse = await getAdminUsers({ pageSize: 1 });
        setUserCount(usersResponse.data.pagination.total);

        // Fetch exam count
        const examsResponse = await getAdminExams({ pageSize: 1 });
        setExamCount(examsResponse.data.pagination.total);

        // Fetch all answers count
        const answersResponse = await getAdminAnswers({ pageSize: 1 });
        setAnswerCount(answersResponse.data.pagination.total);

        // Fetch pending answers (not graded)
        const pendingAnswersResponse = await getAdminAnswers({
          pageSize: 1,
          isGraded: false,
        });
        setPendingAnswerCount(pendingAnswersResponse.data.pagination.total);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: 24 }}>管理后台概览</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={userCount}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="试卷总数"
              value={examCount}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="答卷总数"
              value={answerCount}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待批改答卷"
              value={pendingAnswerCount}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: pendingAnswerCount > 0 ? "#cf1322" : "" }}
            />
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="系统信息">
            <p>系统版本: 1.0.0</p>
            <p>最近更新: {new Date().toLocaleDateString()}</p>
            <p>
              功能：用户管理、试卷管理、答卷管理，可以对用户信息、试卷和答卷进行筛选、排序和管理
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
