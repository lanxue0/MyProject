import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Button,
  Card,
  Input,
  InputNumber,
  Table,
  Typography,
  Space,
  Divider,
} from "antd";
import { Question } from "../Edit";
import { answerFind, examFind, gradeAnswer } from "../../interfaces";
import "./index.scss";
import { getMessageApi } from "../../utils/messageInstance";

interface Answer {
  id: number;
  answer: string;
  score?: number;
  comment?: string;
}

const { Title, Text } = Typography;

export function Grade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answerData, setAnswerData] = useState<any>(null);
  const [examData, setExamData] = useState<any>(null);
  const messageApi = getMessageApi();

  async function query() {
    if (!id) return;

    setLoading(true);
    try {
      // 获取答卷信息
      const res = await answerFind(+id);
      if (res.status === 200 || res.status === 201) {
        setAnswerData(res.data);

        // 获取试卷信息
        const examRes = await examFind(res.data.examId);
        if (examRes.status === 200 || examRes.status === 201) {
          setExamData(examRes.data);

          const questions = JSON.parse(examRes.data.content);
          setExam(questions);

          // 解析答卷内容
          const answerContent = JSON.parse(res.data.content);

          // 初始化主观题分数为0
          const updatedAnswers = answerContent.map((a: any) => {
            const question = questions.find((q: Question) => q.id === a.id);
            if (
              question &&
              question.type === "essay" &&
              question.isSubjective
            ) {
              return { ...a, score: 0 };
            }
            return a;
          });

          setAnswers(updatedAnswers);
        }
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    query();
  }, [id]);

  const handleScoreChange = (questionId: number, score: number) => {
    setAnswers((prev) =>
      prev.map((item) => (item.id === questionId ? { ...item, score } : item))
    );
  };

  const handleCommentChange = (questionId: number, comment: string) => {
    setAnswers((prev) =>
      prev.map((item) => (item.id === questionId ? { ...item, comment } : item))
    );
  };

  const handleSubmit = async () => {
    if (!id || !answerData || !examData) return;

    try {
      setSubmitting(true);

      // 计算客观题总分
      const objectiveScore = answers
        .filter((a) => {
          const question = exam.find((q) => q.id === a.id);
          return question && question.type !== "essay";
        })
        .reduce((sum, a) => sum + (a.score || 0), 0);

      // 更新答案内容，包含主观题分数和评语
      const updatedContent = answers.map((a) => {
        const question = exam.find((q) => q.id === a.id);
        if (question && question.type === "essay") {
          return {
            ...a,
            score: a.score || 0,
            comment: a.comment || "",
          };
        }
        return a;
      });

      // 构建请求数据
      const requestData = {
        id: +id,
        content: JSON.stringify(updatedContent),
        objectiveScore,
      };

      // 发送请求更新答卷状态
      const response = await gradeAnswer(requestData);

      if (response.status === 200 || response.status === 201) {
        messageApi?.success("批改成功");
        navigate("/pending-list"); // 导航到未批改列表
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  // 过滤出需要批改的主观题
  const subjectiveQuestions = exam.filter((q) => q.type === "essay");
  const subjectiveAnswers = answers.filter((a) =>
    subjectiveQuestions.some((q) => q.id === a.id)
  );

  const columns = [
    {
      title: "题目",
      dataIndex: "id",
      key: "question",
      width: "30%",
      render: (id: number) => {
        const question = exam.find((q) => q.id === id);
        return (
          <div>
            <Text strong>{question?.question}</Text>
            <div>
              <Text type="secondary">满分: {question?.score} 分</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "学生答案",
      dataIndex: "answer",
      key: "answer",
      width: "30%",
      render: (text: string) => (
        <div style={{ maxHeight: "200px", overflow: "auto" }}>{text}</div>
      ),
    },
    {
      title: "评分",
      key: "score",
      width: "15%",
      render: (_, record: Answer) => {
        const question = exam.find((q) => q.id === record.id);
        return (
          <InputNumber
            min={0}
            max={question?.score || 0}
            value={record.score}
            onChange={(value) => handleScoreChange(record.id, value || 0)}
            style={{ width: "100%" }}
          />
        );
      },
    },
    {
      title: "评语",
      key: "comment",
      width: "25%",
      render: (_, record: Answer) => (
        <Input.TextArea
          value={record.comment}
          onChange={(e) => handleCommentChange(record.id, e.target.value)}
          placeholder="请输入评语"
          rows={2}
        />
      ),
    },
  ];

  if (subjectiveAnswers.length === 0 && !loading) {
    return (
      <div className="grade-container">
        <Card title="批改试卷">
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Title level={4}>该试卷没有需要批改的主观题</Title>
            <Button type="primary" onClick={() => navigate("/pending-list")}>
              返回列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grade-container">
      {answerData && examData && (
        <Card
          title={
            <div>
              <Space direction="vertical" size={0}>
                <Title level={4}>批改试卷: {examData.name}</Title>
                <Text type="secondary">
                  答题人: {answerData.answerer?.username || "未知用户"}
                </Text>
              </Space>
            </div>
          }
          extra={
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={subjectiveAnswers.length === 0}
            >
              提交批改
            </Button>
          }
          loading={loading}
        >
          {subjectiveAnswers.length > 0 ? (
            <>
              <div className="grading-summary" style={{ marginBottom: "20px" }}>
                <Text>
                  主观题数量: <Text strong>{subjectiveAnswers.length}</Text> 个
                </Text>
                <Divider type="vertical" />
              </div>
              <Table
                columns={columns}
                dataSource={subjectiveAnswers}
                rowKey="id"
                pagination={false}
              />
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Title level={4}>该试卷没有需要批改的主观题</Title>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
