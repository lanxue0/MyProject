import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { answerFind, examFind } from "../../interfaces";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Input,
  Radio,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { Question as BaseQuestion } from "../Edit";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "./index.scss";
import { getMessageApi } from "../../utils/messageInstance";

const { Title, Text } = Typography;

// Extend the Question type to include user answer
interface Question extends BaseQuestion {
  userAnswer?: string;
  isCorrect?: boolean;
}

// 定义结果数据接口
interface ExamResult {
  score?: number;
  totalScore: number;
  examName: string;
  gradingStatus: "PENDING" | "GRADED";
  hasSubjective: boolean;
  questions: Question[];
}

export function Res() {
  const { id } = useParams();
  const messageApi = getMessageApi();

  // 使用单一状态管理所有数据
  const [examResult, setExamResult] = useState<ExamResult>({
    totalScore: 0,
    examName: "考试结果",
    gradingStatus: "GRADED",
    hasSubjective: false,
    questions: [],
  });

  async function loadExamResult() {
    if (!id) return;

    try {
      // 获取答题记录
      const answerRes = await answerFind(+id);

      if (answerRes.status !== 200 && answerRes.status !== 201) return;

      // 解析答案内容
      let userAnswers: any[] = [];
      try {
        userAnswers = JSON.parse(answerRes.data.content);
      } catch (e) {
        console.log("解析答案内容失败", e);
      }

      // 获取考试内容
      const examRes = await examFind(answerRes.data.examId);

      if (examRes.status !== 200 && examRes.status !== 201) return;

      // 解析题目内容
      let questions: Question[] = [];
      try {
        const baseQuestions = JSON.parse(examRes.data.content);

        // 合并题目和答案
        questions = baseQuestions.map((q: BaseQuestion) => {
          const answer = userAnswers.find((a) => String(a.id) === String(q.id));
          const userAnswer = answer?.answer || "";

          // 判断答案是否正确
          let isCorrect = false;
          if (q.type === "input") {
            isCorrect = userAnswer.includes(q.answer);
          } else if (q.type !== "essay") {
            isCorrect = userAnswer === q.answer;
          }

          return {
            ...q,
            userAnswer,
            isCorrect,
          };
        });
      } catch (e) {
        console.log("解析题目内容失败", e);
      }

      // 更新状态
      setExamResult({
        score: answerRes.data.score,
        totalScore: answerRes.data.exam?.totalScore || 100,
        examName: answerRes.data.exam?.name || "考试结果",
        gradingStatus: answerRes.data.isGraded ? "GRADED" : "PENDING",
        hasSubjective: answerRes.data.exam?.hasSubjective || false,
        questions,
      });
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  useEffect(() => {
    loadExamResult();
  }, [id]);

  function renderComponents(questions: Question[]) {
    return questions.map((item) => {
      let formComponent;
      if (item.type === "radio") {
        formComponent = (
          <Radio.Group value={item.userAnswer || item.answer}>
            {item.options?.map((option) => (
              <Radio value={option}>{option}</Radio>
            ))}
          </Radio.Group>
        );
      } else if (item.type === "checkbox") {
        formComponent = (
          <Checkbox.Group
            options={item.options}
            value={(item.userAnswer || item.answer).split(",")}
          />
        );
      } else if (item.type === "input") {
        formComponent = <Input value={item.userAnswer || item.answer} />;
      } else if (item.type === "essay") {
        formComponent = (
          <div>
            <TextArea
              value={item.userAnswer || item.answer}
              rows={4}
              readOnly
            />
            {item.isSubjective && (
              <div className="grading-status mt-2">
                <Space>
                  <Text type="secondary">批改状态：</Text>
                  <Tag
                    color={
                      examResult.gradingStatus === "PENDING"
                        ? "orange"
                        : "green"
                    }
                  >
                    {examResult.gradingStatus === "PENDING"
                      ? "待批改"
                      : "已批改"}
                  </Tag>
                </Space>
              </div>
            )}
          </div>
        );
      } else if (item.type === "judge") {
        formComponent = (
          <Radio.Group value={item.userAnswer || item.answer}>
            <Space direction="vertical">
              <Radio value="正确">正确</Radio>
              <Radio value="错误">错误</Radio>
            </Space>
          </Radio.Group>
        );
      }

      const questionTypeMap = {
        radio: "单选题",
        checkbox: "多选题",
        input: "填空题",
        judge: "判断题",
        essay: "主观题",
      };

      return (
        <Card
          key={item.id}
          className="question-card"
          size="small"
          style={{ marginBottom: 16 }}
          bordered={true}
          title={
            <Space>
              <Text strong>
                {questionTypeMap[item.type as keyof typeof questionTypeMap]}
              </Text>
              <Text type="secondary">({item.score}分)</Text>
              {item.type !== "essay" &&
                examResult.gradingStatus === "GRADED" && (
                  <Tag color={item.isCorrect ? "success" : "error"}>
                    {item.isCorrect ? "正确" : "错误"}
                  </Tag>
                )}
            </Space>
          }
        >
          <div className="question-content">
            <Text strong>{item.question}</Text>
          </div>
          <Divider style={{ margin: "12px 0" }} />
          <div className="options-container">{formComponent}</div>

          {(examResult.gradingStatus !== "PENDING" ||
            item.type !== "essay" ||
            !item.isSubjective) && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <div className="answer-container">
                <Text type="secondary" strong>
                  正确答案：
                </Text>
                <Text>{item.answer}</Text>
              </div>
              <div className="analysis-container">
                <Text type="secondary" strong>
                  答案解析：
                </Text>
                <Text>{item.answerAnalyse}</Text>
              </div>
            </>
          )}
        </Card>
      );
    });
  }

  // Calculate accuracy percentage
  const accuracy =
    examResult.totalScore > 0 && examResult.score !== undefined
      ? Math.round((examResult.score / examResult.totalScore) * 100)
      : 0;

  // Determine status color based on score
  const getScoreColor = () => {
    if (examResult.score === undefined || examResult.totalScore === 0)
      return "";
    const percentage = (examResult.score / examResult.totalScore) * 100;
    if (percentage >= 80) return "#52c41a"; // Green for excellent
    if (percentage >= 60) return "#1890ff"; // Blue for good
    if (percentage >= 40) return "#faad14"; // Orange for average
    return "#f5222d"; // Red for poor
  };

  return (
    <div id="res-container">
      <Card
        title={<Title level={4}>{examResult.examName}</Title>}
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            <Link to="/my-exams">返回我的考试</Link>
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16} align="middle" justify="center">
          <Col xs={24} sm={12} md={8} lg={6}>
            {examResult.hasSubjective &&
            examResult.gradingStatus === "PENDING" ? (
              <Card bordered={false} className="status-card">
                <Statistic
                  title="试卷状态"
                  value="待批改"
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14" }}
                />
                <Text type="secondary">此试卷包含主观题，正在等待批改</Text>
              </Card>
            ) : (
              <Card bordered={false} className="score-card">
                <Statistic
                  title="得分"
                  value={examResult.score}
                  suffix={`/ ${examResult.totalScore}`}
                  precision={0}
                  valueStyle={{ color: getScoreColor() }}
                  prefix={<CheckCircleOutlined />}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color={getScoreColor()}>正确率 {accuracy}%</Tag>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <div className="questions-container">
        {renderComponents(examResult.questions)}
      </div>
    </div>
  );
}
