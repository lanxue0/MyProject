import {
  Button,
  Card,
  Popconfirm,
  Popover,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import "./index.scss";
import { useEffect, useState } from "react";
import {
  examDelete,
  examList,
  examPublish,
  examUnpublish,
  examRestore,
  examPermanentDelete,
} from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";
import { ExamAddModal } from "./ExamAddModal";
import { Link } from "react-router";
import { RankingModal } from "./RankingModal";
import {
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  TrophyOutlined,
  EditOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

interface Exam {
  id: number;
  name: string;
  isPublish: boolean;
  isDelete: boolean;
  content: string;
}

export function ExamList() {
  const [isExamAddModalOpen, setIsExamAddModalOpen] = useState(false);
  const [list, setList] = useState<Array<Exam>>([]);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [curExamId, setCurExamId] = useState<number>();
  const [bin, setBin] = useState(false);
  const messageApi = getMessageApi();

  async function query() {
    try {
      const res = await examList(bin ? "true" : undefined);

      if (res.status === 200 || res.status === 201) {
        setList(res.data);
      }
    } catch (e: any) {
      messageApi?.open({
        type: "error",
        content: e.response.data.message || "系统繁忙，请稍后再试",
      });
    }
  }

  async function changePublishState(id: number, publish: boolean) {
    try {
      const res = publish ? await examUnpublish(id) : await examPublish(id);

      if (res.status === 200 || res.status === 201) {
        messageApi?.open({
          type: "success",
          content: publish ? "已取消发布" : "已发布",
        });
        query();
      }
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "系统繁忙，请稍后再试");
    }
  }

  async function deleteExam(id: number) {
    try {
      const res = await examDelete(id);

      if (res.status === 200 || res.status === 201) {
        messageApi?.open({ type: "success", content: "已删除" });
      }
      query();
    } catch (e: any) {
      messageApi?.error(e.response.data.message || "系统繁忙，请稍后再试");
    }
  }

  async function restoreExam(id: number) {
    try {
      const res = await examRestore(id);

      if (res.status === 200 || res.status === 201) {
        if (res.data.status === "notFound") {
          messageApi?.warning(res.data.message);
        } else {
          messageApi?.open({ type: "success", content: "已恢复" });
        }
        query();
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  async function permanentDeleteExam(id: number) {
    try {
      const res = await examPermanentDelete(id);

      if (res.status === 200 || res.status === 201) {
        if (res.data.status === "notFound") {
          messageApi?.warning(res.data.message);
        } else {
          messageApi?.open({ type: "success", content: "已永久删除" });
        }
        query();
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  useEffect(() => {
    query();
  }, []);

  // 监听bin状态变化，切换时重新获取数据
  useEffect(() => {
    query();
  }, [bin]);

  const columns = [
    {
      title: "试卷名称",
      dataIndex: "name",
      key: "name",
      width: "25%",
    },
    {
      title: "状态",
      key: "status",
      width: "15%",
      render: (_: any, record: Exam) => (
        <Tag color={record.isPublish ? "green" : "orange"}>
          {record.isPublish ? "已发布" : "未发布"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Exam) => (
        <Space size="small">
          {!bin ? (
            <>
              <Button
                type={record.isPublish ? "default" : "primary"}
                size="small"
                onClick={() => {
                  changePublishState(record.id, record.isPublish);
                }}
              >
                {record.isPublish ? "停止发布" : "发布"}
              </Button>
              <Button type="primary" size="small">
                <Link to={`/edit/${record.id}`}>
                  <EditOutlined /> 编辑
                </Link>
              </Button>
              {record.isPublish && (
                <Button type="primary" size="small">
                  <Link to={`/exam-publish/${record.id}`}>
                    <ShareAltOutlined /> 发布到班级
                  </Link>
                </Button>
              )}
              <Popover
                content={window.location.origin + "/exam/" + record.id}
                trigger={"click"}
              >
                <Button type="default" size="small" icon={<LinkOutlined />}>
                  考试链接
                </Button>
              </Popover>
              <Button
                type="default"
                size="small"
                icon={<TrophyOutlined />}
                onClick={() => {
                  setIsRankingModalOpen(true);
                  setCurExamId(record.id);
                }}
              >
                排行榜
              </Button>
              <a
                href={"http://localhost:3003/answer/export?examId=" + record.id}
                download
                style={{ marginLeft: "4px" }}
              >
                <Button size="small" type="default">
                  导出答卷
                </Button>
              </a>
              <Popconfirm
                title="试卷删除"
                description="确认放入回收站吗？"
                onConfirm={() => {
                  deleteExam(record.id);
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          ) : (
            <>
              <Popconfirm
                title="恢复试卷"
                description="确认恢复此试卷吗？"
                onConfirm={() => {
                  restoreExam(record.id);
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button type="primary" size="small">
                  恢复
                </Button>
              </Popconfirm>
              <Popconfirm
                title="永久删除"
                description="确认永久删除此试卷吗？此操作不可恢复！"
                onConfirm={() => {
                  permanentDeleteExam(record.id);
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button danger size="small">
                  永久删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={<Title level={4}>{bin ? "回收站" : "试卷管理"}</Title>}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsExamAddModalOpen(true);
              }}
            >
              新建试卷
            </Button>
            <Button
              onClick={() => {
                setBin((n) => {
                  return !n;
                });
              }}
            >
              {bin ? "退出回收站" : "打开回收站"}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Card>
      <ExamAddModal
        isOpen={isExamAddModalOpen}
        handleClose={() => {
          setIsExamAddModalOpen(false);
          query();
        }}
      />
      <RankingModal
        isOpen={isRankingModalOpen}
        handleClose={() => {
          setIsRankingModalOpen(false);
        }}
        examId={curExamId}
      />
    </>
  );
}
