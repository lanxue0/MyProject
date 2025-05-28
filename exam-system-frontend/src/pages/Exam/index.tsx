import { useNavigate, useParams } from "react-router";
import { getMessageApi } from "../../utils/messageInstance";
import { answerAdd, examFind } from "../../interfaces";
import { useCallback, useEffect, useState } from "react";
import { Question } from "../Edit";
import {
  Button,
  Checkbox,
  Input,
  Radio,
  Card,
  Typography,
  Spin,
  Progress,
  Space,
  Tag,
  Divider,
} from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import "./index.scss";

const { Title, Paragraph } = Typography;

export function Exam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messageApi = getMessageApi();
  const [json, setJson] = useState<Array<Question>>([]);
  const [answers, setAnswers] = useState<Array<{ id: number; answer: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function query() {
    if (!id) {
      return;
    }
    setLoading(true);
    try {
      const res = await examFind(+id);

      if (res.status === 200 || res.status === 201) {
        setTitle(res.data.name || "在线考试");
        const content = JSON.parse(res.data.content);
        setJson(content);
        setAnswers(
          content.map((item: { id: number }) => {
            return {
              id: item.id,
            };
          })
        );
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    query();
  }, []);

  function setAnswer(id: number, content: string) {
    setAnswers(
      answers.map((item) => {
        return item.id === id
          ? {
              id,
              answer: content,
            }
          : item;
      })
    );
  }

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!answers.length) return 0;
    const completed = answers.filter((a) => a.answer).length;
    return Math.floor((completed / answers.length) * 100);
  };

  // Check if question is answered
  const isQuestionAnswered = (id: number) => {
    const answer = answers.find((a) => a.id === id);
    return answer && answer.answer;
  };

  function renderComponents(arr: Array<Question>) {
    return arr.map((item, index) => {
      let formComponent;
      if (item.type === "radio") {
        formComponent = (
          <Radio.Group
            onChange={(e) => {
              setAnswer(item.id, e.target.value);
            }}
            value={answers.find((a) => a.id === item.id)?.answer}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {item.options?.map((option, idx) => (
                <Radio key={idx} value={option}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      } else if (item.type === "judge") {
        formComponent = (
          <Radio.Group
            onChange={(e) => {
              setAnswer(item.id, e.target.value);
            }}
            value={answers.find((a) => a.id === item.id)?.answer}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Radio value="正确">正确</Radio>
              <Radio value="错误">错误</Radio>
            </Space>
          </Radio.Group>
        );
      } else if (item.type === "checkbox") {
        formComponent = (
          <Checkbox.Group
            options={item.options}
            onChange={(values) => {
              setAnswer(item.id, values.join(","));
            }}
            value={answers
              .find((a) => a.id === item.id)
              ?.answer?.split(",")
              .filter(Boolean)}
          />
        );
      } else if (item.type === "input") {
        formComponent = (
          <Input
            placeholder="请输入您的答案"
            onChange={(e) => {
              setAnswer(item.id, e.target.value);
            }}
            value={answers.find((a) => a.id === item.id)?.answer}
          />
        );
      } else if (item.type === "essay") {
        formComponent = (
          <>
            <TextArea
              rows={4}
              placeholder="请输入您的答案"
              onChange={(e) => {
                setAnswer(item.id, e.target.value);
              }}
              value={answers.find((a) => a.id === item.id)?.answer}
            />
            <Paragraph
              className="hint"
              type="secondary"
              style={{ marginTop: 8 }}
            >
              此题为主观题，需要人工批改
            </Paragraph>
          </>
        );
      }

      const getTypeTag = (type: string) => {
        switch (type) {
          case "radio":
            return <Tag color="blue">单选题</Tag>;
          case "judge":
            return <Tag color="cyan">判断题</Tag>;
          case "checkbox":
            return <Tag color="purple">多选题</Tag>;
          case "input":
            return <Tag color="orange">填空题</Tag>;
          case "essay":
            return <Tag color="green">主观题</Tag>;
          default:
            return <Tag color="default">未知类型</Tag>;
        }
      };

      return (
        <Card
          key={item.id}
          className="question-card"
          title={
            <Space>
              <span>第 {index + 1} 题</span>
              {getTypeTag(item.type)}
              {item.score && <span>({item.score}分)</span>}
            </Space>
          }
          extra={
            isQuestionAnswered(item.id) ? (
              <CheckOutlined style={{ color: "#52c41a" }} />
            ) : (
              <QuestionCircleOutlined style={{ color: "#faad14" }} />
            )
          }
        >
          <div className="question-content">
            <Paragraph className="question" strong>
              {item.question}
            </Paragraph>
            <div className="options">{formComponent}</div>
          </div>
        </Card>
      );
    });
  }

  const addAnswer = useCallback(
    async function () {
      if (!id) {
        return;
      }
      setSubmitting(true);
      try {
        const res = await answerAdd({
          examId: +id,
          content: JSON.stringify(answers),
        });

        if (res.status === 201 || res.status === 200) {
          messageApi?.success("试卷提交成功！");
          navigate("/my-exams");
        }
      } catch (e: any) {
        messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, id, messageApi, navigate]
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" tip="加载考试中..." />
      </div>
    );
  }

  return (
    <div className="exam-container">
      <div className="exam-header">
        <Title level={2}>{title}</Title>
        <div className="timer-section">
          <Space>
            <ClockCircleOutlined />
            <span>考试进行中</span>
          </Space>
        </div>
        <Divider style={{ margin: "16px 0" }} />
        <div className="progress-section">
          <Paragraph>完成进度:</Paragraph>
          <Progress
            percent={getCompletionPercentage()}
            status="active"
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
        </div>
      </div>

      <div className="question-list">{renderComponents(json)}</div>

      <div className="exam-footer">
        <Button
          type="primary"
          size="large"
          className="submit-btn"
          onClick={addAnswer}
          loading={submitting}
          disabled={submitting}
        >
          提交答案
        </Button>
      </div>
    </div>
  );
}
