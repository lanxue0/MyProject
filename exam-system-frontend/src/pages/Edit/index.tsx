import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Tabs,
  Typography,
} from "antd";
import { Link, useParams } from "react-router";
import "./index.scss";
import { MaterialItem } from "./Material";
import { useDrop } from "react-dnd";
import { getMessageApi } from "../../utils/messageInstance";
import { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { useForm } from "antd/es/form/Form";
import { examFind, examSave } from "../../interfaces";
import { PreviewModal } from "./PreviewModal";
import { TagSelector } from "./TagSelector";
import { AutoGenerateModal } from "./AutoGenerateModal";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  RobotOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export type Question = {
  id: number;
  question: string;
  type: "radio" | "checkbox" | "input" | "judge" | "essay";
  options?: string[];
  score: number;
  answer: string;
  answerAnalyse: string;
  isSubjective?: boolean;
};

export function Edit() {
  const { id } = useParams();
  const [curQuestionId, setCurQuestionId] = useState<number>();
  const [json, setJson] = useState<Array<Question>>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [form] = useForm();
  const [key, setKey] = useState<string>("json");
  const messageApi = getMessageApi();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  async function query() {
    if (!id) {
      return;
    }
    try {
      const res = await examFind(+id);

      if (res.status === 200 || res.status === 201) {
        try {
          setJson(JSON.parse(res.data.content));
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "系统繁忙，请稍后再试");
    }
  }

  useEffect(() => {
    query();
  }, []);

  useEffect(() => {
    form.setFieldsValue(json.filter((item) => item.id === curQuestionId)[0]);
  }, [curQuestionId]);

  const [{ isOver }, drop] = useDrop({
    accept: ["单选题", "多选题", "填空题", "判断题", "主观题"],
    drop: (item: { type: string }) => {
      const type = {
        单选题: "radio",
        多选题: "checkbox",
        填空题: "input",
        判断题: "judge",
        主观题: "essay",
      }[item.type] as Question["type"];

      setJson((json) => [
        ...json,
        {
          id: new Date().getTime(),
          type,
          question:
            type === "judge"
              ? "这个说法是否正确？"
              : type === "essay"
              ? "请详细回答以下问题："
              : "最高的山？",
          options:
            type === "judge"
              ? ["正确", "错误"]
              : type === "essay"
              ? undefined
              : ["选项1", "选项2"],
          score: 5,
          answer: type === "judge" ? "正确" : type === "essay" ? "" : "选项1",
          answerAnalyse: "答案解析",
        },
      ]);

      messageApi?.success(item.type);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  function renderComponents(arr: Array<Question>) {
    return arr.map((item) => {
      let formComponent;
      if (item.type === "radio") {
        formComponent =
          item.options!.length > 0 ? (
            <Radio.Group>
              {item.options?.map((option) => (
                <Radio value={option}>{option}</Radio>
              ))}
            </Radio.Group>
          ) : (
            "请设置选项"
          );
      } else if (item.type === "checkbox") {
        formComponent = <Checkbox.Group options={item.options} />;
      } else if (item.type === "input") {
        formComponent = <Input />;
      } else if (item.type === "judge") {
        formComponent = (
          <Radio.Group>
            <Radio value="正确">正确</Radio>
            <Radio value="错误">错误</Radio>
          </Radio.Group>
        );
      } else if (item.type === "essay") {
        formComponent = (
          <div>
            <TextArea rows={4} placeholder="请输入答案" />
            {item.isSubjective && (
              <div style={{ marginTop: "8px", color: "#666" }}>
                <span>此题需要人工批改</span>
              </div>
            )}
          </div>
        );
      }

      return (
        <Card
          className="component-item"
          key={item.id}
          onClick={() => {
            setCurQuestionId(item.id);
          }}
          style={
            item.id === curQuestionId ? { border: "2px solid #1890ff" } : {}
          }
          size="small"
          title={
            <Text strong>
              {getQuestionTypeText(item.type)} - {item.score}分
            </Text>
          }
        >
          <div className="question">{item.question}</div>
          <Divider style={{ margin: "8px 0" }} />
          <div className="options">{formComponent}</div>
          <Divider style={{ margin: "8px 0" }} />
          <div className="answer">
            <Text type="secondary">答案：</Text>
            {item.answer}
          </div>
          <div className="answerAnalyse">
            <Text type="secondary">解析：</Text>
            {item.answerAnalyse}
          </div>
        </Card>
      );
    });
  }

  function getQuestionTypeText(type: string) {
    const typeMap = {
      radio: "单选题",
      checkbox: "多选题",
      input: "填空题",
      judge: "判断题",
      essay: "主观题",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  }

  async function saveExam() {
    if (!id) {
      return;
    }
    try {
      // 计算试卷总分
      const totalScore = json.reduce(
        (sum, question) => sum + question.score,
        0
      );

      const res = await examSave({
        id: +id,
        content: JSON.stringify(json),
        hasSubjective: json.some((q) => q.type === "essay"),
        totalScore,
        tagIds: selectedTagIds,
      });

      if (res.status === 200 || res.status === 201) {
        messageApi?.success("保存成功");
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  const handleAutoGenerate = (questions: Question[]) => {
    // 处理每个题目的options，确保是字符串数组格式
    const processedQuestions = questions.map((question) => {
      // 如果options是字符串，尝试解析它；如果是数组则保持不变
      let processedOptions = question.options;

      if (question.options && typeof question.options === "string") {
        try {
          // 尝试解析JSON字符串
          processedOptions = JSON.parse(question.options as unknown as string);
        } catch {
          // 如果不是JSON，可能是逗号分隔的字符串
          processedOptions = (question.options as unknown as string).split(",");
        }
      }

      return {
        ...question,
        options: processedOptions,
      };
    });

    setJson(processedQuestions);
    messageApi?.success("已自动生成试卷，您可以继续编辑");
  };

  return (
    <>
      <PreviewModal
        isOpen={isPreviewModalOpen}
        json={json}
        handleClose={() => {
          setIsPreviewModalOpen(false);
        }}
      />
      <AutoGenerateModal
        isOpen={isAutoGenerateModalOpen}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        onGenerate={handleAutoGenerate}
      />

      <Card
        title={
          <Title level={4} style={{ fontSize: "18px", margin: 0 }}>
            试卷编辑器
          </Title>
        }
        extra={
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setIsPreviewModalOpen(true);
              }}
              size="small"
            >
              预览
            </Button>
            <Button
              icon={<RobotOutlined />}
              onClick={() => {
                setIsAutoGenerateModalOpen(true);
              }}
              size="small"
            >
              自动组卷
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={saveExam}
              size="small"
            >
              保存
            </Button>
            <Button icon={<ArrowLeftOutlined />} size="small">
              <Link to="/">返回</Link>
            </Button>
          </Space>
        }
        style={{ marginBottom: "16px" }}
        size="small"
      >
        {id && (
          <TagSelector
            examId={parseInt(id, 10)}
            onTagsChange={setSelectedTagIds}
          />
        )}
      </Card>

      <Row gutter={16} className="edit-content">
        <Col xs={24} sm={8} md={6} lg={5} xl={4}>
          <Card
            title={<div style={{ fontSize: "14px" }}>题目类型</div>}
            className="material-card"
            size="small"
          >
            <div className="material-list">
              <MaterialItem name="单选题" type="单选题" />
              <MaterialItem name="多选题" type="多选题" />
              <MaterialItem name="填空题" type="填空题" />
              <MaterialItem name="判断题" type="判断题" />
              <MaterialItem name="主观题" type="主观题" />
            </div>
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                拖拽题型到右侧区域添加题目
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={16} md={12} lg={13} xl={14}>
          <Card
            title={<div style={{ fontSize: "14px" }}>试卷内容</div>}
            className="content-card"
            ref={drop as any}
            style={{
              borderColor: isOver ? "#1890ff" : undefined,
            }}
            size="small"
          >
            {json.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Text type="secondary">将左侧题型拖到此处添加题目</Text>
              </div>
            ) : (
              <div className="components">{renderComponents(json)}</div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <Card
            title={<div style={{ fontSize: "14px" }}>题目属性</div>}
            className="property-card"
            size="small"
          >
            <Tabs
              activeKey={key}
              onChange={(value) => setKey(value)}
              size="small"
              items={[
                {
                  key: "json",
                  label: "属性编辑",
                  children: (
                    <div className="property-content">
                      {curQuestionId ? (
                        <Form
                          form={form}
                          layout="vertical"
                          size="small"
                          onValuesChange={(changedValues) => {
                            if (changedValues.options) {
                              changedValues.options =
                                changedValues.options.split(",");
                            } else {
                              changedValues.options = [];
                            }

                            setJson((json) => {
                              return json.map((item) => {
                                if (item.id === curQuestionId) {
                                  return {
                                    ...item,
                                    ...changedValues,
                                  };
                                }
                                return item;
                              });
                            });
                          }}
                        >
                          <Form.Item label="题目" name="question">
                            <TextArea rows={3} />
                          </Form.Item>

                          <Form.Item label="分值" name="score">
                            <InputNumber />
                          </Form.Item>

                          <Form.Item
                            label="选项"
                            name="options"
                            hidden={
                              json.filter(
                                (item) => item.id === curQuestionId
                              )[0]?.type === "input" ||
                              json.filter(
                                (item) => item.id === curQuestionId
                              )[0]?.type === "essay"
                            }
                          >
                            <TextArea
                              rows={3}
                              value={
                                json
                                  .filter(
                                    (item) => item.id === curQuestionId
                                  )[0]
                                  ?.options?.join("\n") || ""
                              }
                              placeholder="每行一个选项"
                            />
                          </Form.Item>

                          <Form.Item
                            label="答案"
                            name="answer"
                            hidden={
                              json.filter(
                                (item) => item.id === curQuestionId
                              )[0]?.type === "essay"
                            }
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item label="答案解析" name="answerAnalyse">
                            <TextArea rows={3} />
                          </Form.Item>

                          <Form.Item>
                            <Button
                              block
                              danger
                              size="small"
                              onClick={() => {
                                setJson((json) => {
                                  return json.filter(
                                    (item) => item.id !== curQuestionId
                                  );
                                });
                                setCurQuestionId(undefined);
                              }}
                            >
                              删除此题
                            </Button>
                          </Form.Item>
                        </Form>
                      ) : (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                          <Text type="secondary">请先选择一个题目</Text>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "source",
                  label: "源码",
                  children: (
                    <div className="source-code">
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          fontSize: "12px",
                        }}
                      >
                        {JSON.stringify(json, null, 2)}
                      </pre>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
