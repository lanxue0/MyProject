import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { RegisterUser } from "../pages/Register";
import { UpdatePassword } from "../pages/UpdatePassword";
import { getMessageApi } from "../utils/messageInstance";
import { ExamAdd } from "../pages/ExamList/ExamAddModal";

const userServiceInstance = axios.create({
  baseURL: "http://localhost:3001/",
  timeout: 3000,
});

const userProfileServiceInstance = axios.create({
  baseURL: "http://localhost:3001/",
  timeout: 3000,
});

const examServiceInstance = axios.create({
  baseURL: "http://localhost:3002/",
  timeout: 3000,
});

const answerServiceInstance = axios.create({
  baseURL: "http://localhost:3003/",
  timeout: 3000,
});

const analyseServiceInstance = axios.create({
  baseURL: "http://localhost:3004/",
  timeout: 3000,
});

const adminServiceInstance = axios.create({
  baseURL: "http://localhost:3007/",
  timeout: 3000,
});

const tagServiceInstance = axios.create({
  baseURL: "http://localhost:3008/",
  timeout: 3000,
});

const questionServiceInstance = axios.create({
  baseURL: "http://localhost:3006/",
  timeout: 3000,
});

const classroomServiceInstance = axios.create({
  baseURL: "http://localhost:3009/",
  timeout: 3000,
});

const requestInterceptor = function (config: InternalAxiosRequestConfig) {
  const accessToken = localStorage.getItem("token");

  if (accessToken) {
    config.headers.Authorization = "Bearer " + accessToken;
  }
  return config;
};

const responseInterceptor = function (response: AxiosResponse) {
  const newToken = response.headers["token"];

  if (newToken) {
    localStorage.setItem("token", newToken);
  }
  return response;
};

const responseErrorIntercepor = async (error: any) => {
  if (!error.response) {
    return Promise.reject(error);
  }
  const { data } = error.response;
  if (data.statusCode === 401) {
    const messageApi = getMessageApi();
    messageApi?.open({ type: "error", content: data.message });

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  } else {
    return Promise.reject(error);
  }
};

examServiceInstance.interceptors.request.use(requestInterceptor);
examServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

answerServiceInstance.interceptors.request.use(requestInterceptor);
answerServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

analyseServiceInstance.interceptors.request.use(requestInterceptor);
analyseServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

userProfileServiceInstance.interceptors.request.use(requestInterceptor);
userProfileServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

adminServiceInstance.interceptors.request.use(requestInterceptor);
adminServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

tagServiceInstance.interceptors.request.use(requestInterceptor);
tagServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

questionServiceInstance.interceptors.request.use(requestInterceptor);
questionServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

classroomServiceInstance.interceptors.request.use(requestInterceptor);
classroomServiceInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorIntercepor
);

// user

export async function login(username: string, password: string) {
  return await userServiceInstance.post("user/login", {
    username,
    password,
  });
}

export async function registerCaptcha(email: string) {
  return await userServiceInstance.get("user/register-captcha", {
    params: {
      address: email,
    },
  });
}

export async function register(registerUser: RegisterUser) {
  return await userServiceInstance.post("user/register", registerUser);
}

export async function updatePasswordCaptcha(email: string) {
  return await userServiceInstance.get("user/update_password/captcha", {
    params: {
      address: email,
    },
  });
}

export async function updatePassword(updatePassword: UpdatePassword) {
  return await userServiceInstance.post("user/update_password", updatePassword);
}

// userProfile
export async function getUserProfile() {
  return await userProfileServiceInstance.get("user/profile");
}

export async function updateUserProfile(data: {
  gender: string;
  bio?: string;
  region?: string;
  birthDate?: string;
}) {
  return await userProfileServiceInstance.post("user/update_profile", data);
}

//exam

export async function examList(bin?: string) {
  return await examServiceInstance.get("exam/list", {
    params: bin ? { bin } : undefined,
  });
}

export async function examAdd(values: ExamAdd) {
  return await examServiceInstance.post("exam/add", values);
}

export async function examPublish(id: number) {
  return await examServiceInstance.get("exam/publish/" + id);
}

export async function examUnpublish(id: number) {
  return await examServiceInstance.get("exam/unpublish/" + id);
}

export async function examDelete(id: number) {
  return await examServiceInstance.delete("exam/delete/" + id);
}

export async function examRestore(id: number) {
  return await examServiceInstance.post("exam/restore/" + id);
}

export async function examPermanentDelete(id: number) {
  return await examServiceInstance.delete("exam/permanent/" + id);
}

export async function examFind(id: number) {
  return await examServiceInstance.get("exam/find/" + id);
}

export async function examSave(data: {
  id: number;
  content: string;
  hasSubjective: boolean;
  totalScore: number;
  tagIds?: number[];
}) {
  return await examServiceInstance.post("exam/save", data);
}

// 提交考试答案

// answer

export async function answerAdd(data: { examId: number; content: string }) {
  return await answerServiceInstance.post("answer/add", data);
}

export async function answerFind(id: number) {
  return await answerServiceInstance.get("answer/find/" + id);
}

export async function answerFindByUserId() {
  return await answerServiceInstance.get("answer/listByUserId");
}

export async function pendingAnswerList() {
  return await answerServiceInstance.get("answer/pending-answer-list");
}

export async function gradeAnswer(data: {
  id: number;
  content: string;
  objectiveScore: number;
}) {
  return await answerServiceInstance.post(`answer/${data.id}/grade`, data);
}

// analyse

export async function ranking(examId: number) {
  return await analyseServiceInstance.get("analyse/ranking", {
    params: {
      examId,
    },
  });
}

// Admin APIs
export interface UpdateUserDto {
  gender?: string;
  userType?: string;
  bio?: string;
  region?: string;
  birthDate?: string;
}

export async function checkIsAdmin() {
  return await adminServiceInstance.get("admin/check");
}

// Admin - User Management
export async function getAdminUsers(params?: {
  page?: number;
  pageSize?: number;
}) {
  return await adminServiceInstance.get("admin/users", {
    params,
  });
}

export async function updateAdminUser(userId: number, data: UpdateUserDto) {
  return await adminServiceInstance.post(`admin/users/${userId}`, data);
}

// Admin - Exam Management
export async function getAdminExams(params?: {
  page?: number;
  pageSize?: number;
  creator?: string;
  sortBy?: string; // createTime | updateTime
  hasSubjective?: boolean;
}) {
  return await adminServiceInstance.get("admin/exams", {
    params,
  });
}

export async function deleteAdminExam(examId: number) {
  return await adminServiceInstance.delete(`admin/exams/${examId}`);
}

// Admin - Answer Management
export async function getAdminAnswers(params?: {
  page?: number;
  pageSize?: number;
  creator?: string;
  examCreator?: string;
  sortByScore?: string; // asc | desc
  isGraded?: boolean;
}) {
  // Only include parameters that are actually defined
  const cleanParams: Record<string, any> = {};

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanParams[key] = value;
      }
    });
  }

  return await adminServiceInstance.get("admin/answers", {
    params:
      Object.keys(cleanParams).length > 0
        ? cleanParams
        : { page: params?.page || 1, pageSize: params?.pageSize || 10 },
  });
}

export async function deleteAdminAnswer(answerId: number) {
  return await adminServiceInstance.delete(`admin/answers/${answerId}`);
}

// Tag Interfaces
export interface Tag {
  id: number;
  name: string;
  description?: string;
  parentId: number | null;
  createTime: string;
  updateTime: string;
  parent?: Tag;
  children?: Tag[];
  exams?: ExamTag[];
}

export interface ExamTag {
  examId: number;
  tagId: number;
  assignedAt: string;
  exam?: {
    id: number;
    name: string;
  };
  tag?: Tag;
}

export interface CreateTagDto {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateTagDto {
  name?: string;
  description?: string;
  parentId?: number | null;
}

// Tag APIs
export async function getTags(parentId?: number) {
  return await tagServiceInstance.get("tag", {
    params: parentId !== undefined ? { parentId } : undefined,
  });
}

export async function getTagsHierarchical() {
  return await tagServiceInstance.get("tag/hierarchical");
}

export async function getTag(id: number) {
  return await tagServiceInstance.get(`tag/${id}`);
}

export async function createTag(data: CreateTagDto) {
  return await tagServiceInstance.post("tag", data);
}

export async function updateTag(id: number, data: UpdateTagDto) {
  return await tagServiceInstance.put(`tag/${id}`, data);
}

export async function deleteTag(id: number) {
  return await tagServiceInstance.delete(`tag/${id}`);
}

export async function assignTagToExam(examId: number, tagId: number) {
  return await tagServiceInstance.post(`tag/exam/${examId}/tag/${tagId}`);
}

export async function removeTagFromExam(examId: number, tagId: number) {
  return await tagServiceInstance.delete(`tag/exam/${examId}/tag/${tagId}`);
}

export async function getExamTags(examId: number) {
  return await tagServiceInstance.get(`tag/exam/${examId}/tags`);
}

// Admin Tag Management
export async function getAdminTags(parentId?: number) {
  return await adminServiceInstance.get("admin/tags", {
    params: parentId !== undefined ? { parentId } : undefined,
  });
}

export async function getAdminTagsHierarchical() {
  return await adminServiceInstance.get("admin/tags/hierarchical");
}

export async function getAdminTag(id: number) {
  return await adminServiceInstance.get(`admin/tags/${id}`);
}

export async function createAdminTag(data: CreateTagDto) {
  return await adminServiceInstance.post("admin/tags", data);
}

export async function updateAdminTag(id: number, data: UpdateTagDto) {
  return await adminServiceInstance.put(`admin/tags/${id}`, data);
}

export async function deleteAdminTag(id: number) {
  return await adminServiceInstance.delete(`admin/tags/${id}`);
}

export async function batchDeleteAdminTags(ids: number[]) {
  return await adminServiceInstance.post(`admin/tags/batch-delete`, ids);
}

export async function getTagTemplate() {
  return await tagServiceInstance.get("tag/export/template", {
    responseType: "blob",
  });
}

export async function uploadTags(file: File) {
  console.log("导入", file);
  const formData = new FormData();
  formData.append("file", file);
  return await tagServiceInstance.post("tag/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// Question APIs
export interface Question {
  id: number;
  type: "radio" | "checkbox" | "input" | "judge" | "essay";
  question: string;
  options: string | null;
  score: number;
  answer: string;
  answerAnalyse: string;
  difficulty: number; // 0-5数值
  createTime: string;
  updateTime: string;
  creatorId: number;
  tags?: Tag[];
}

export interface CreateQuestionDto {
  type: "radio" | "checkbox" | "input" | "judge" | "essay";
  question: string;
  options?: string;
  score: number;
  answer: string;
  answerAnalyse: string;
  difficulty: number; // 0-5数值
  tagIds?: number[];
}

export interface UpdateQuestionDto {
  type?: "radio" | "checkbox" | "input" | "judge" | "essay";
  question?: string;
  options?: string;
  score?: number;
  answer?: string;
  answerAnalyse?: string;
  difficulty?: number; // 0-5数值
  tagIds?: number[];
}

export interface QuestionListResult {
  items: Question[];
  total: number;
}

export async function createQuestion(data: CreateQuestionDto) {
  return await questionServiceInstance.post("question/create", data);
}

export async function getQuestions(params?: {
  page?: number;
  pageSize?: number;
  difficulty?: string;
  type?: string;
  tagId?: number;
}) {
  return await questionServiceInstance.get<QuestionListResult>(
    "question/list",
    {
      params,
    }
  );
}

export async function getQuestion(id: number) {
  return await questionServiceInstance.get<Question>(`question/find/${id}`);
}

export async function updateQuestion(id: number, data: UpdateQuestionDto) {
  return await questionServiceInstance.put(`question/update/${id}`, data);
}

export async function deleteQuestion(id: number) {
  return await questionServiceInstance.delete(`question/delete/${id}`);
}

export async function uploadQuestions(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return await questionServiceInstance.post("question/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function getQuestionTemplate() {
  return await questionServiceInstance.get("question/template", {
    responseType: "blob",
  });
}

export async function autoGenerateExam(params: {
  difficulty?: number;
  totalCount: number;
  radioCount: number;
  checkboxCount: number;
  inputCount: number;
  judgeCount: number;
  essayCount: number;
  tagIds?: number[];
}) {
  return await questionServiceInstance.get("question/auto-generate", {
    params: {
      ...params,
      tagIds: params.tagIds ? params.tagIds.join(",") : undefined,
    },
  });
}

// 管理后台的题库管理API
export async function getAdminQuestions(params?: {
  page?: number;
  pageSize?: number;
}) {
  return await adminServiceInstance.get("admin/questions", {
    params,
  });
}

export async function createAdminQuestion(data: UpdateQuestionDto) {
  return await adminServiceInstance.post(`admin/questions`, data);
}

export async function updateAdminQuestion(
  questionId: number,
  data: UpdateQuestionDto
) {
  return await adminServiceInstance.put(`admin/questions/${questionId}`, data);
}

export async function deleteAdminQuestion(questionId: number) {
  return await adminServiceInstance.delete(`admin/questions/${questionId}`);
}

export async function batchDeleteAdminQuestions(ids: number[]) {
  return await adminServiceInstance.post(`admin/questions/batch-delete`, ids);
}

// 班级管理相关接口
export interface Classroom {
  id: number;
  name: string;
  code: string;
  description?: string;
  creatorId: number;
  creator?: {
    id: number;
    username: string;
    email?: string;
  };
  studentCount?: number;
  createTime: string;
  updateTime: string;
  joinTime?: string; // 仅在学生或教师加入查看时存在
  students?: Array<{
    id: number;
    username: string;
    email: string;
    joinTime: string;
  }>;
  teachers?: Array<{
    id: number;
    username: string;
    email: string;
    joinTime: string;
  }>;
}

export interface CreateClassroomDto {
  name: string;
  description?: string;
}

export interface UpdateClassroomDto {
  name?: string;
  description?: string;
}

export interface JoinClassroomDto {
  code: string;
}

// 教师创建班级
export async function createClassroom(data: CreateClassroomDto) {
  return await classroomServiceInstance.post("classroom/create", data);
}

// 教师更新班级
export async function updateClassroom(id: number, data: UpdateClassroomDto) {
  return await classroomServiceInstance.put(`classroom/${id}`, data);
}

// 教师删除班级
export async function deleteClassroom(id: number) {
  return await classroomServiceInstance.delete(`classroom/${id}`);
}

// 获取教师创建的班级
export async function getTeacherClassrooms() {
  return await classroomServiceInstance.get<Classroom[]>("classroom/teacher");
}

// 获取班级详情
export async function getClassroomDetail(id: number) {
  return await classroomServiceInstance.get<Classroom>(`classroom/${id}`);
}

// 移除学生
export async function removeStudent(classroomId: number, studentId: number) {
  return await classroomServiceInstance.delete(
    `classroom/${classroomId}/student/${studentId}`
  );
}

// 学生加入班级
export async function joinClassroom(data: JoinClassroomDto) {
  return await classroomServiceInstance.post("classroom/join", data);
}

// 学生退出班级
export async function leaveClassroom(id: number) {
  return await classroomServiceInstance.delete(`classroom/leave/${id}`);
}

// 获取学生加入的班级
export async function getStudentClassrooms() {
  return await classroomServiceInstance.get<Classroom[]>("classroom/student");
}

// 获取教师加入的班级（非创建者）
export async function getTeachingClassrooms() {
  return await classroomServiceInstance.get<Classroom[]>("classroom/teaching");
}

// 教师退出班级（非创建者）
export async function leaveTeacherClassroom(classroomId: number) {
  return await classroomServiceInstance.delete(
    `classroom/leave-teacher/${classroomId}`
  );
}

// 通过班级代码查找班级
export async function findClassroomByCode(code: string) {
  return await classroomServiceInstance.get<Classroom>(
    `classroom/code/${code}`
  );
}

// 试卷发布相关接口
export interface ExamPublishRecord {
  id: number;
  examId: number;
  classroomId: number;
  publishTime: string;
  exam?: {
    id: number;
    name: string;
    createUser?: {
      id: number;
      username: string;
    };
  };
  classroom?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface PublishExamDto {
  examId: number;
  classroomIds: number[];
}

// 发布试卷到班级
export async function publishExamToClassrooms(data: PublishExamDto) {
  return await examServiceInstance.post("exam/publish-to-classrooms", data);
}

// 获取教师发布的试卷列表
export async function getTeacherPublishedExams() {
  return await examServiceInstance.get<ExamPublishRecord[]>(
    "exam/published-exams"
  );
}

// 根据试卷ID获取发布记录
export async function getExamPublishRecords(examId: number) {
  return await examServiceInstance.get<ExamPublishRecord[]>(
    `exam/publish-records/${examId}`
  );
}

// 获取学生的已发布试卷列表
export async function getStudentPublishedExams() {
  return await examServiceInstance.get<ExamPublishRecord[]>(
    "exam/student-published-exams"
  );
}

// 试卷相关接口
export interface Exam {
  id: number;
  name: string;
  isPublish: boolean;
  isDelete: boolean;
  hasSubjective: boolean;
  content: string;
  totalScore: number;
  createTime: string;
  updateTime: string;
  createUserId: number;
}
