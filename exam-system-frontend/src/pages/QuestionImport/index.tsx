import { useState } from "react";
import { Button, Card, Typography, Space, Upload, Result } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { uploadQuestions, getQuestionTemplate } from "../../interfaces";
import { getMessageApi } from "../../utils/messageInstance";
import "./styles.scss";

const { Title, Paragraph } = Typography;

export default function QuestionImport() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const messageApi = getMessageApi();

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    try {
      const response = await uploadQuestions(file);
      setSuccess(true);
      setImportedCount(response.data.imported || 0);
      onSuccess();
      messageApi?.success(`成功导入 ${response.data.imported} 道题目`);
    } catch (error) {
      console.error("Failed to upload questions", error);
      onError(error);
      messageApi?.error("导入题目失败");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await getQuestionTemplate();
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "题目导入模板.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template", error);
      messageApi?.error("下载模板失败");
    }
  };

  const resetStatus = () => {
    setSuccess(false);
    setImportedCount(0);
  };

  return (
    <div className="question-import-container">
      <Card>
        <Title level={4}>题目导入</Title>
        <Paragraph>
          通过Excel表格批量导入题目到题库。请先下载模板，按照格式填写后上传。
        </Paragraph>

        {success ? (
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="题目导入成功"
            subTitle={`已成功导入 ${importedCount} 道题目到题库`}
            extra={[
              <Button key="back" onClick={resetStatus}>
                继续导入
              </Button>,
            ]}
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="upload-actions">
              <Space>
                <Upload customRequest={handleUpload} showUploadList={false}>
                  <Button
                    icon={<UploadOutlined />}
                    loading={loading}
                    type="primary"
                  >
                    上传题目
                  </Button>
                </Upload>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                  下载模板
                </Button>
              </Space>
            </div>

            <div className="upload-tips">
              <Paragraph>
                <strong>说明：</strong>
              </Paragraph>
              <ul>
                <li>
                  支持的题型：单选题(radio)、多选题(checkbox)、填空题(input)、判断题(judge)、主观题(essay)
                </li>
                <li>
                  难度支持：非常简单(0)、简单(1)、中等(2)、较难(3)、困难(4)、非常困难(5)
                </li>
                <li>选项使用英文逗号分隔，如：选项1,选项2,选项3</li>
                <li>标签使用英文逗号分隔，如：标签1,标签2</li>
              </ul>
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
}
