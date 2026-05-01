import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="h-screen flex bg-gray-100">
      <Outlet />
    </div>
  );
};

export default DashboardLayout;