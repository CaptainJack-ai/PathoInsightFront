import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import WorkflowPage from "../pages/WorkflowPage";
import SliceProcessingPage from "../pages/SliceProcessingPage";
import { ROUTE_PATHS } from "./paths";

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.HOME} element={<HomePage />} />
      <Route path={ROUTE_PATHS.WORKFLOW} element={<WorkflowPage />} />
      <Route path={ROUTE_PATHS.WORKFLOW_CASE} element={<WorkflowPage />} />
      <Route path={ROUTE_PATHS.SLICE_PROCESSING} element={<SliceProcessingPage />} />
      <Route path="*" element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;
