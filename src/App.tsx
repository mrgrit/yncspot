import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { Protected, homePathFor } from "@/routes/guards";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { YouthLayout } from "@/components/layout/YouthLayout";
import { CompanyLayout } from "@/components/layout/CompanyLayout";

import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import NotFound from "@/pages/public/NotFound";

import MyPage from "@/pages/youth/MyPage";
import Portfolio from "@/pages/youth/Portfolio";
import Badges from "@/pages/youth/Badges";
import SpotBoard from "@/pages/youth/SpotBoard";
import SpotDetail from "@/pages/youth/SpotDetail";
import SpotWork from "@/pages/youth/SpotWork";
import SpotHistory from "@/pages/youth/SpotHistory";
import Courses from "@/pages/youth/Courses";
import Jobs from "@/pages/youth/Jobs";
import JobDetail from "@/pages/youth/JobDetail";
import Chat from "@/pages/youth/Chat";

import Dashboard from "@/pages/admin/Dashboard";
import Members from "@/pages/admin/Members";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminSpotJobs from "@/pages/admin/AdminSpotJobs";
import Companies from "@/pages/admin/Companies";
import Placements from "@/pages/admin/Placements";
import Graduates from "@/pages/admin/Graduates";
import Reports from "@/pages/admin/Reports";

import CompanyPortal from "@/pages/company/CompanyPortal";

function RootIndex() {
  const { account } = useAuth();
  return account ? <Navigate to={homePathFor(account.role)} replace /> : <Landing />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootIndex />} />
                <Route path="/login" element={<Login />} />

                {/* 참여자 */}
                <Route
                  element={
                    <Protected roles={["youth"]}>
                      <YouthLayout />
                    </Protected>
                  }
                >
                  <Route path="/me" element={<MyPage />} />
                  <Route path="/me/portfolio" element={<Portfolio />} />
                  <Route path="/me/badges" element={<Badges />} />
                  <Route path="/spot" element={<SpotBoard />} />
                  <Route path="/spot/history" element={<SpotHistory />} />
                  <Route path="/spot/:id/work" element={<SpotWork />} />
                  <Route path="/spot/:id" element={<SpotDetail />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/:id" element={<JobDetail />} />
                  <Route path="/chat" element={<Chat />} />
                </Route>

                {/* 운영자 / 관리자 */}
                <Route
                  element={
                    <Protected roles={["operator", "admin"]}>
                      <AdminLayout />
                    </Protected>
                  }
                >
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/members" element={<Members />} />
                  <Route path="/admin/courses" element={<AdminCourses />} />
                  <Route path="/admin/spot-jobs" element={<AdminSpotJobs />} />
                  <Route path="/admin/companies" element={<Companies />} />
                  <Route path="/admin/placements" element={<Placements />} />
                  <Route path="/admin/graduates" element={<Graduates />} />
                  <Route path="/admin/reports" element={<Reports />} />
                </Route>

                {/* 협약기업 */}
                <Route
                  element={
                    <Protected roles={["company"]}>
                      <CompanyLayout />
                    </Protected>
                  }
                >
                  <Route path="/company" element={<CompanyPortal />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
