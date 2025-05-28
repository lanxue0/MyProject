import React, { useEffect, useState } from "react";
import { Select, Spin, Tag, message } from "antd";
import {
  Tag as TagInterface,
  assignTagToExam,
  getExamTags,
  getTags,
  removeTagFromExam,
} from "../../interfaces";

interface TagSelectorProps {
  examId: number;
  onTagsChange?: (tagIds: number[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  examId,
  onTagsChange,
}) => {
  const [tags, setTags] = useState<TagInterface[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchAllTags();
    fetchExamTags();
  }, [examId]);

  useEffect(() => {
    if (onTagsChange) {
      onTagsChange(selectedTags.map((tag) => tag.id));
    }
  }, [selectedTags, onTagsChange]);

  const fetchAllTags = async () => {
    setLoading(true);
    try {
      const res = await getTags();
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
      message.error("获取标签列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTags = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await getExamTags(examId);
      setSelectedTags(res.data);
    } catch (error) {
      console.error("Failed to fetch exam tags", error);
      message.error("获取试卷标签失败");
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = async (tagId: number) => {
    setUpdating(true);
    try {
      await assignTagToExam(examId, tagId);
      const newTag = tags.find((tag) => tag.id === tagId);
      if (newTag) {
        setSelectedTags([...selectedTags, newTag]);
      }
      message.success("标签添加成功");
    } catch (error) {
      console.error("Failed to assign tag to exam", error);
      message.error("添加标签失败");
    } finally {
      setUpdating(false);
    }
  };

  const handleTagRemove = async (tagId: number) => {
    setUpdating(true);
    try {
      await removeTagFromExam(examId, tagId);
      setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
      message.success("标签移除成功");
    } catch (error) {
      console.error("Failed to remove tag from exam", error);
      message.error("移除标签失败");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ marginRight: "8px" }}>试卷标签:</span>
        {loading ? (
          <Spin size="small" />
        ) : (
          <div>
            {selectedTags.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    closable
                    onClose={() => handleTagRemove(tag.id)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <span style={{ color: "#999" }}>暂无标签</span>
            )}
          </div>
        )}
      </div>
      <Select
        style={{ width: "100%" }}
        placeholder="添加标签"
        loading={loading || updating}
        disabled={loading || updating}
        onChange={handleTagSelect}
        options={tags
          .filter(
            (tag) =>
              !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
          )
          .map((tag) => ({
            label: tag.name,
            value: tag.id,
          }))}
      />
    </div>
  );
};
