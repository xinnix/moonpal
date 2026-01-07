"use client";

import { useState, useEffect } from "react";
import { ContentTemplate } from "@/types/admin";
import {
  get_content_templates,
  create_content_template,
  update_content_template,
  delete_content_template,
} from "@/app/actions/admin";
import { ContentTemplateForm } from "./components/ContentTemplateForm";

export default function ContentManagement() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] =
    useState<ContentTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await get_content_templates();
    setTemplates(data);
    setLoading(false);
  };

  const handleCreate = async (data: Partial<ContentTemplate>) => {
    const result = await create_content_template(data as any);
    if (result.success) {
      setShowForm(false);
      loadTemplates();
    } else {
      alert("创建失败：" + result.error);
    }
  };

  const handleUpdate = async (data: Partial<ContentTemplate>) => {
    if (!editingTemplate) return;
    const result = await update_content_template(editingTemplate.id, data);
    if (result.success) {
      setEditingTemplate(null);
      setShowForm(false);
      loadTemplates();
    } else {
      alert("更新失败：" + result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此模板吗？")) return;
    const result = await delete_content_template(id);
    if (result.success) {
      loadTemplates();
    } else {
      alert("删除失败：" + result.error);
    }
  };

  if (showForm || editingTemplate) {
    return (
      <div>
        <h2 style={{ marginBottom: "20px", fontWeight: "300" }}>
          {editingTemplate ? "编辑模板" : "新建模板"}
        </h2>
        <ContentTemplateForm
          template={editingTemplate || undefined}
          onSubmit={editingTemplate ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, fontWeight: "300" }}>内容模板管理</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px",
            background: "#ffc864",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          新建模板
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>加载中...</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: "16px",
                background: "#1a1a24",
                borderRadius: "8px",
                border: "1px solid #2a2a3a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: "400",
                    }}
                  >
                    {template.title}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 8px",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    {template.content}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    <span>类型: {template.type}</span>
                    <span>
                      能量: {template.energy_min} - {template.energy_max}
                    </span>
                    {template.tags.length > 0 && (
                      <span>标签: {template.tags.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid #666",
                      borderRadius: "4px",
                      color: "#999",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid #ff6666",
                      borderRadius: "4px",
                      color: "#ff6666",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              暂无内容模板，点击新建创建一个
            </p>
          )}
        </div>
      )}
    </div>
  );
}
