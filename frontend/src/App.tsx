import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/Skeleton";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const EditExpense = lazy(() => import("./pages/EditExpense"));
const Categories = lazy(() => import("./pages/Categories"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 w-80">
        <Skeleton variant="rectangular" height="40px" width="60%" className="mx-auto" />
        <div className="space-y-3">
          {[3, 2].map((cols, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} variant="rectangular" height="120px" className="flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<SuspensePage><AnimatedPage><Login /></AnimatedPage></SuspensePage>} />
            <Route path="/register" element={<SuspensePage><AnimatedPage><Register /></AnimatedPage></SuspensePage>} />
            <Route path="/forgot-password" element={<SuspensePage><AnimatedPage><ForgotPassword /></AnimatedPage></SuspensePage>} />
            <Route path="/reset-password" element={<SuspensePage><AnimatedPage><ResetPassword /></AnimatedPage></SuspensePage>} />
            <Route path="/verify-email" element={<SuspensePage><AnimatedPage><VerifyEmail /></AnimatedPage></SuspensePage>} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<SuspensePage><AnimatedPage><Dashboard /></AnimatedPage></SuspensePage>} />
            <Route path="/expenses" element={<SuspensePage><AnimatedPage><Expenses /></AnimatedPage></SuspensePage>} />
            <Route path="/add" element={<SuspensePage><AnimatedPage><AddExpense /></AnimatedPage></SuspensePage>} />
            <Route path="/edit/:id" element={<SuspensePage><AnimatedPage><EditExpense /></AnimatedPage></SuspensePage>} />
            <Route path="/categories" element={<SuspensePage><AnimatedPage><Categories /></AnimatedPage></SuspensePage>} />
            <Route path="/analytics" element={<SuspensePage><AnimatedPage><Analytics /></AnimatedPage></SuspensePage>} />
            <Route path="/budgets" element={<SuspensePage><AnimatedPage><Budgets /></AnimatedPage></SuspensePage>} />
            <Route path="/settings" element={<SuspensePage><AnimatedPage><Settings /></AnimatedPage></SuspensePage>} />
          </Route>
          <Route path="*" element={<SuspensePage><AnimatedPage><NotFound /></AnimatedPage></SuspensePage>} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
