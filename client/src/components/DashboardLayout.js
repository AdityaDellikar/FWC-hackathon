'use client';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar title={title} />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
