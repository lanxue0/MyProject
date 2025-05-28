import { Modal, Table, TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import { ranking } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";
interface RankingModalProps {
  isOpen: boolean;
  handleClose: () => void;
  examId?: number;
}

export function RankingModal(props: RankingModalProps) {
  const [list, setList] = useState([]);
  const messageApi = getMessageApi();

  useEffect(() => {
    query();
  }, [props.examId]);

  async function query() {
    if (!props.examId) {
      return;
    }
    try {
      console.log("start query");
      const res = await ranking(props.examId);
      console.log("query res", res);

      if (res.status === 201 || res.status === 200) {
        setList(res.data);
      }
    } catch (e: any) {
      messageApi?.error(e.response?.data?.message || "系统繁忙，请稍后再试");
    }
  }

  const columns: TableColumnsType = [
    {
      title: "名字",
      key: "name",
      render: (_, record) => <div>{record.answerer.username}</div>,
    },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
    },
  ];

  return (
    <Modal
      title="排行榜"
      open={props.isOpen}
      onOk={() => props.handleClose()}
      onCancel={() => props.handleClose()}
      okText={"确认"}
      cancelText={"取消"}
    >
      <Table dataSource={list} columns={columns} />;
    </Modal>
  );
}
