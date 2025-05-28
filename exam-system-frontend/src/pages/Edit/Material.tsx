import { useDrag } from "react-dnd";
import {
  FileTextOutlined,
  CheckSquareOutlined,
  FormOutlined,
  HighlightOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";

export function MaterialItem(props: { name: string; type: string }) {
  const [, drag] = useDrag({
    type: props.type,
    item: {
      type: props.type,
    },
  });

  const getIcon = () => {
    switch (props.type) {
      case "单选题":
        return <CheckSquareOutlined />;
      case "多选题":
        return <CheckSquareOutlined />;
      case "填空题":
        return <HighlightOutlined />;
      case "判断题":
        return <FileTextOutlined />;
      case "主观题":
        return <EditOutlined />;
      default:
        return <FormOutlined />;
    }
  };

  return (
    <Tooltip title={`拖拽添加${props.name}`} placement="right">
      <div className="meterial-item" ref={drag as any}>
        {getIcon()} {props.name}
      </div>
    </Tooltip>
  );
}
