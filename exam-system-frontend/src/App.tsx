import { createBrowserRouter, RouterProvider } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UpdatePassword } from "./pages/UpdatePassword";
import { ExamList } from "./pages/ExamList";
import { message } from "antd";
import { useEffect, useState } from "react";
import { setMessageApi } from "./utils/messageInstance";
import { Edit } from "./pages/Edit";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Exam } from "./pages/Exam";
import { Res } from "./pages/Res";
import { PrivateLayout } from "./Components/PrivateLayout";
import { MyExams } from "./pages/MyExams";
import Profile from "./pages/UserProfile";
import { Grade } from "./pages/Grade";
import PendingList from "./pages/PendingList";
import { AdminLayout } from "./pages/Admin/AdminLayout";
import { Dashboard } from "./pages/Admin/Dashboard";
import { UserManagement } from "./pages/Admin/UserManagement";
import { ExamManagement } from "./pages/Admin/ExamManagement";
import { AnswerManagement } from "./pages/Admin/AnswerManagement";
import { TagManagement } from "./pages/Admin/TagManagement";
import QuestionBank from "./pages/QuestionBank";
import QuestionImport from "./pages/QuestionImport";
import { ClassroomManage } from "./pages/ClassroomManage";
import { ClassroomDetail } from "./pages/ClassroomDetail";
import { StudentClassroom } from "./pages/StudentClassroom";
import { TeacherJoinClassroom } from "./pages/TeacherJoinClassroom";
import { PublishedExams } from "./pages/PublishedExams";
import { ExamPublish } from "./pages/ExamPublish";
import { StudentPublishedExams } from "./pages/StudentPublishedExams";

const router = createBrowserRouter([
  {
    path: "/",
    Component: PrivateLayout,
    children: [
      {
        path: "/",
        Component: ExamList,
      },
      {
        path: "edit/:id",
        Component: Edit,
      },
      {
        path: "exam/:id",
        Component: Exam,
      },
      {
        path: "res/:id",
        Component: Res,
      },
      {
        path: "my-exams",
        Component: MyExams,
      },
      {
        path: "profile",
        Component: Profile,
      },
      {
        path: "grade/:id",
        Component: Grade,
      },
      {
        path: "pending-list",
        Component: PendingList,
      },
      {
        path: "question-import",
        Component: QuestionImport,
      },
      {
        path: "classroom-manage",
        Component: ClassroomManage,
      },
      {
        path: "classroom-detail/:id",
        Component: ClassroomDetail,
      },
      {
        path: "student-classroom",
        Component: StudentClassroom,
      },
      {
        path: "teacher-join-classroom",
        Component: TeacherJoinClassroom,
      },
      {
        path: "published-exams",
        Component: PublishedExams,
      },
      {
        path: "exam-publish/:id",
        Component: ExamPublish,
      },
      {
        path: "student-published-exams",
        Component: StudentPublishedExams,
      },
    ],
  },
  {
    path: "admin",
    Component: AdminLayout,
    children: [
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "user-management",
        Component: UserManagement,
      },
      {
        path: "exam-management",
        Component: ExamManagement,
      },
      {
        path: "answer-management",
        Component: AnswerManagement,
      },
      {
        path: "tag-management",
        Component: TagManagement,
      },
      {
        path: "question-bank",
        Component: QuestionBank,
      },
    ],
  },
  {
    path: "login",
    Component: Login,
  },
  {
    path: "register",
    Component: Register,
  },
  {
    path: "update_password",
    Component: UpdatePassword,
  },
]);

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMessageApi(messageApi);
    setReady(true);
  }, [messageApi]);

  return (
    <>
      {contextHolder}
      {!ready ? (
        <div>加载中...</div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <RouterProvider router={router} />
        </DndProvider>
      )}
    </>
  );
}

export default App;
