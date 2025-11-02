import App from "@/App";
import Activities from "@/pages/activities/Activities";
import ActivitiesDetails from "@/pages/activitiesDetails/ActivitiesDetails";
import AppLayout from "@/pages/AppLayout";
import Home from "@/pages/home/Home";
import Login from "@/pages/login/Login";
import ChangePassword from "@/pages/changePassword/ChangePassword";
import Unauthorized from "@/pages/Unauthorized";
import Submissions from "@/pages/submissions/Submissions";
import Students from "@/pages/students/Students";
import Teachers from "@/pages/teachers/Teachers";
import Classes from "@/pages/classes/Classes";
import ClassDetails from "@/pages/classDetails/ClassDetails";
import SubmissionsDetails from "@/pages/submissionsDetails/SubmissionsDetails";
import Problems from "@/pages/problems/Problems";
import RequireAuth from "@/pages/RequireAuth";
import RequireRole from "@/pages/RequireRole";
import { BrowserRouter, Route, Routes } from "react-router";
import ProfileView from "@/pages/perfil/visualizacao-perfil";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<App />} />
            <Route path="home" element={<Home />} />
            <Route
              element={
                <RequireRole allowedRoles={["student", "professor", "admin"]} />
              }
            >
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="perfil" element={<ProfileView />} />
              <Route path="activities">
                <Route index element={<Activities />} />
                <Route path=":id" element={<ActivitiesDetails />} />
              </Route>
              <Route path="submissions">
                <Route index element={<Submissions />} />
                <Route
                  path=":activityId/:submissionId"
                  element={<SubmissionsDetails />}
                />
              </Route>
            </Route>
            <Route element={<RequireRole allowedRoles={["admin"]} />}>
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
            </Route>
<<<<<<< HEAD
            <Route
              element={
                <RequireRole allowedRoles={["student", "professor", "admin"]} />
              }
            >
=======
            <Route element={<RequireRole allowedRoles={["admin", "professor"]} />}>
              <Route path="problems" element={<Problems />} />
            <Route element={<RequireRole allowedRoles={["student", "professor", "admin"]} />}>
>>>>>>> upstream/visualizacao-perfil
              <Route path="classes">
                <Route index element={<Classes />} />
                <Route path=":id" element={<ClassDetails />} />
              </Route>
            </Route>
          </Route>
         </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
